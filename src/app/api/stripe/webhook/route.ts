import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

function mapTierToRole(tier: string): string {
  switch (tier) {
    case 'standard': return 'standard';
    case 'pro': return 'pro';
    default: return 'reader';
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const tier = session.metadata?.tier || 'standard';
      const billingCycle = session.metadata?.billing_cycle || 'monthly';

      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const role = mapTierToRole(tier);
        const periodStart = (subscription as any).current_period_start;
        const periodEnd = (subscription as any).current_period_end;

        await supabase
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
              price_amount: subscription.items.data[0]?.price?.unit_amount || 0,
            },
            { onConflict: 'user_id' }
          );

        await supabase
          .from('user_profiles')
          .update({
            role,
            subscription_status: 'active',
            billing_cycle: billingCycle,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        await syncBrevoContact(userId, role, supabase);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      const tier = subscription.metadata?.tier || 'standard';

      if (userId) {
        const status = subscription.status === 'active' ? 'active' :
                       subscription.status === 'past_due' ? 'active' : 'cancelled';
        const role = status === 'active' ? mapTierToRole(tier) : 'reader';
        const periodStart = (subscription as any).current_period_start;
        const periodEnd = (subscription as any).current_period_end;

        await supabase
          .from('subscriptions')
          .update({
            status,
            current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        await supabase
          .from('user_profiles')
          .update({
            role,
            subscription_status: status === 'active' ? 'active' : 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;

      if (userId) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        await supabase
          .from('user_profiles')
          .update({
            role: 'reader',
            subscription_status: 'inactive',
            billing_cycle: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        await syncBrevoContact(userId, 'reader', supabase);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const sub = (invoice as any).subscription as string | undefined;
      if (sub) {
        const subscription = await stripe.subscriptions.retrieve(sub);
        const userId = subscription.metadata?.supabase_user_id;
        if (userId) {
          await supabase
            .from('user_profiles')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function syncBrevoContact(userId: string, role: string, supabase: any) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) return;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (!profile?.email) return;

  try {
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: profile.email,
        attributes: {
          FIRSTNAME: profile.full_name || '',
          ROLE: role,
        },
        listIds: getBrevoListIds(role),
        updateEnabled: true,
      }),
    });
  } catch {}
}

function getBrevoListIds(role: string): number[] {
  const listIds: number[] = [];
  const monthlyListId = parseInt(process.env.BREVO_LIST_MONTHLY || '0');
  const weeklyListId = parseInt(process.env.BREVO_LIST_WEEKLY || '0');
  const alertsListId = parseInt(process.env.BREVO_LIST_ALERTS || '0');
  const proListId = parseInt(process.env.BREVO_LIST_PRO || '0');

  if (monthlyListId) listIds.push(monthlyListId);

  if (role === 'standard' || role === 'pro') {
    if (weeklyListId) listIds.push(weeklyListId);
    if (alertsListId) listIds.push(alertsListId);
  }

  if (role === 'pro' && proListId) {
    listIds.push(proListId);
  }

  return listIds;
}
