import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { syncContactToBeehiiv } from '@/lib/beehiiv';
import { sendTransactionalEmail } from '@/lib/email';
import { stripePaymentConfirmationEmail } from '@/lib/email-templates';
import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { timeout: 10000 });
}

function mapTierToRole(tier: string): string {
  return tier === 'premium' ? 'premium' : 'reader';
}

export async function POST(request: NextRequest) {
  // Guard: Stripe keys must be configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  // Guard: Webhook secret MUST be defined — never process webhooks without signature verification
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    Sentry.captureMessage('STRIPE_WEBHOOK_SECRET is not configured — webhook rejected', { level: 'error' });
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'stripe-webhook-signature' } });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const tier = session.metadata?.tier || 'premium';
        const billingCycle = session.metadata?.billing_cycle || 'monthly';

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            { expand: ['items.data'] }
          );
          const role = mapTierToRole(tier);
          const firstItem = subscription.items.data[0];
          const periodStart = firstItem?.current_period_start;
          const periodEnd = firstItem?.current_period_end;

          const { error: subError } = await supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: userId,
                tier,
                status: 'active',
                stripe_subscription_id: subscription.id,
                stripe_customer_id: session.customer as string,
                billing_cycle: billingCycle,
                current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
                current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
                price_amount: firstItem?.price?.unit_amount || 0,
              },
              { onConflict: 'user_id' }
            );

          if (subError) {
            Sentry.captureException(subError, {
              tags: { context: 'stripe-webhook-subscription-upsert' },
              extra: { userId, eventType: event.type },
            });
            throw new Error(`Subscription upsert failed: ${subError.message}`);
          }

          const { error: profileError } = await supabase
            .from('user_profiles')
            .update({
              role,
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (profileError) {
            Sentry.captureException(profileError, {
              tags: { context: 'stripe-webhook-profile-update' },
              extra: { userId, eventType: event.type },
            });
            throw new Error(`Profile update failed: ${profileError.message}`);
          }

          await syncBeehiivContact(userId, role, supabase);

          // Send confirmation email
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();
          if (profile?.email) {
            const confirmation = stripePaymentConfirmationEmail(profile.full_name || 'Client', billingCycle);
            await sendTransactionalEmail({ to: profile.email, ...confirmation }).catch((err) => {
              Sentry.captureException(err, { tags: { context: 'stripe-payment-confirmation-email' }, extra: { userId } });
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        const tier = subscription.metadata?.tier || 'premium';

        if (userId) {
          const status = subscription.status === 'active' ? 'active' :
                         subscription.status === 'past_due' ? 'active' : 'cancelled';
          const role = status === 'active' ? mapTierToRole(tier) : 'reader';
          const firstItem = subscription.items.data[0];
          const periodStart = firstItem?.current_period_start;
          const periodEnd = firstItem?.current_period_end;

          const { error: subUpdateError } = await supabase
            .from('subscriptions')
            .update({
              status,
              current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (subUpdateError) {
            Sentry.captureException(subUpdateError, {
              tags: { context: 'stripe-webhook-sub-update' },
              extra: { userId, eventType: event.type },
            });
            throw new Error(`Subscription update failed: ${subUpdateError.message}`);
          }

          const { error: profileError } = await supabase
            .from('user_profiles')
            .update({
              role,
              subscription_status: status === 'active' ? 'active' : 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (profileError) {
            Sentry.captureException(profileError, {
              tags: { context: 'stripe-webhook-profile-update' },
              extra: { userId, eventType: event.type },
            });
            throw new Error(`Profile update failed: ${profileError.message}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          const { error: subDeleteError } = await supabase
            .from('subscriptions')
            .update({
              status: 'expired',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (subDeleteError) {
            Sentry.captureException(subDeleteError, {
              tags: { context: 'stripe-webhook-sub-delete' },
              extra: { userId, eventType: event.type },
            });
            throw new Error(`Subscription delete update failed: ${subDeleteError.message}`);
          }

          const { error: profileError } = await supabase
            .from('user_profiles')
            .update({
              role: 'reader',
              subscription_status: 'inactive',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (profileError) {
            Sentry.captureException(profileError, {
              tags: { context: 'stripe-webhook-profile-expire' },
              extra: { userId, eventType: event.type },
            });
            throw new Error(`Profile expire update failed: ${profileError.message}`);
          }

          await syncBeehiivContact(userId, 'reader', supabase);
        }
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const parentSub = invoice.parent?.subscription_details?.subscription;
        const subId = typeof parentSub === 'string' ? parentSub : parentSub?.id;
        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId);
          const userId = subscription.metadata?.supabase_user_id;
          const tier = subscription.metadata?.tier || 'premium';
          if (userId) {
            const role = mapTierToRole(tier);

            const { error: subActiveError } = await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId);

            if (subActiveError) {
              Sentry.captureException(subActiveError, {
                tags: { context: 'stripe-webhook-invoice-paid' },
                extra: { userId, eventType: event.type },
              });
              throw new Error(`Subscription active update failed: ${subActiveError.message}`);
            }

            const { error: profileError } = await supabase
              .from('user_profiles')
              .update({
                role,
                subscription_status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);

            if (profileError) {
              Sentry.captureException(profileError, {
                tags: { context: 'stripe-webhook-invoice-paid-profile' },
                extra: { userId, eventType: event.type },
              });
              throw new Error(`Profile update on invoice paid failed: ${profileError.message}`);
            }

            // Log payment in audit_log
            await supabase.from('audit_log').insert({
              admin_id: userId,
              action: 'invoice_payment',
              entity_type: 'subscription',
              entity_id: subId,
              details: {
                event_type: event.type,
                invoice_id: invoice.id,
                amount_paid: invoice.amount_paid,
                currency: invoice.currency,
              },
            });
          }
        }
        break;
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        const userId = customer.metadata?.supabase_user_id;

        if (userId) {
          const updateData: Record<string, string> = {
            updated_at: new Date().toISOString(),
          };
          if (customer.email) {
            updateData.email = customer.email;
          }
          if (customer.name) {
            updateData.full_name = customer.name;
          }

          if (customer.email || customer.name) {
            const { error: syncError } = await supabase
              .from('user_profiles')
              .update(updateData)
              .eq('id', userId);

            if (syncError) {
              Sentry.captureException(syncError, {
                tags: { context: 'stripe-webhook-customer-updated' },
                extra: { userId, eventType: event.type },
              });
              throw new Error(`Customer sync failed: ${syncError.message}`);
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const parentSub = invoice.parent?.subscription_details?.subscription;
        const subId = typeof parentSub === 'string' ? parentSub : parentSub?.id;
        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId);
          const userId = subscription.metadata?.supabase_user_id;
          if (userId) {
            const { error: pastDueError } = await supabase
              .from('user_profiles')
              .update({
                subscription_status: 'past_due',
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);

            if (pastDueError) {
              Sentry.captureException(pastDueError, {
                tags: { context: 'stripe-webhook-payment-failed' },
                extra: { userId, eventType: event.type },
              });
              throw new Error(`Past due update failed: ${pastDueError.message}`);
            }
          }
        }
        break;
      }
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { context: 'stripe-webhook-handler' },
      extra: { eventType: event.type },
    });
    // Return 500 so Stripe retries the webhook for transient failures
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncBeehiivContact(userId: string, role: string, supabase: NonNullable<ReturnType<typeof createServiceClient>>) {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!profile?.email) return;

    await syncContactToBeehiiv({
      email: profile.email,
      firstName: profile.full_name || '',
      role,
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { context: 'stripe-webhook-beehiiv-sync' },
      extra: { userId },
    });
  }
}
