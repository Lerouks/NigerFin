# STRIPE

### 8. Route webhook Stripe

Fichier : src/app/api/stripe/webhook/route.ts

```typescript
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
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    Sentry.captureMessage('STRIPE_WEBHOOK_SECRET is not configured', { level: 'error' });
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const tier = session.metadata?.tier || 'premium';
        const billingCycle = session.metadata?.billing_cycle || 'monthly';

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string, { expand: ['items.data'] });
          const role = mapTierToRole(tier);
          const firstItem = subscription.items.data[0];

          // 1. Upsert subscriptions
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            tier,
            status: 'active',
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer as string,
            billing_cycle: billingCycle,
            current_period_start: firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000).toISOString() : null,
            current_period_end: firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000).toISOString() : null,
            price_amount: firstItem?.price?.unit_amount || 0,
          }, { onConflict: 'user_id' });

          // 2. Update user_profiles
          await supabase.from('user_profiles').update({
            role,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          }).eq('id', userId);

          // 3. Sync Beehiiv
          await syncBeehiivContact(userId, role, supabase);

          // 4. Audit log
          await supabase.from('audit_log').insert({
            admin_id: userId,
            action: 'subscription_created',
            entity_type: 'subscription',
            entity_id: subscription.id,
            details: { event_type: event.type, tier, billing_cycle: billingCycle, stripe_customer_id: session.customer },
          });

          // 5. Email de confirmation
          const { data: profile } = await supabase.from('user_profiles').select('email, full_name').eq('id', userId).single();
          if (profile?.email) {
            const confirmation = stripePaymentConfirmationEmail(profile.full_name || 'Client', billingCycle);
            await sendTransactionalEmail({ to: profile.email, ...confirmation }).catch((err) => {
              Sentry.captureException(err);
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
          const status = subscription.status === 'active' ? 'active' : subscription.status === 'past_due' ? 'active' : 'cancelled';
          const role = status === 'active' ? mapTierToRole(tier) : 'reader';

          await supabase.from('subscriptions').update({
            status,
            current_period_start: /* ... */,
            current_period_end: /* ... */,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId);

          await supabase.from('user_profiles').update({
            role,
            subscription_status: status === 'active' ? 'active' : 'cancelled',
            updated_at: new Date().toISOString(),
          }).eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Set subscription expired + profile role='reader', status='inactive' + sync Beehiiv
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        // Reactivate subscription to 'active' + update profile role/status
      }

      case 'customer.updated': {
        // Sync email/name from Stripe customer to user_profiles
      }

      case 'invoice.payment_failed': {
        // Set subscription_status = 'past_due' in user_profiles
      }

      case 'charge.dispute.created': {
        // Log dispute to audit_log + Sentry warning
      }

      case 'charge.refunded': {
        // Log refund to audit_log
      }
    }
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

### 9. Evenements Stripe ecoutes

| Evenement | Action |
|-----------|--------|
| checkout.session.completed | Cree/upsert subscription + met a jour profile (role=premium, status=active) + envoie email + sync Beehiiv |
| customer.subscription.updated | Sync status (active/cancelled) + met a jour role + cancel_at_period_end |
| customer.subscription.deleted | Met subscription a expired, profile a role=reader, subscription_status=inactive + sync Beehiiv |
| invoice.paid / invoice.payment_succeeded | Reactive subscription a active + met a jour profile |
| invoice.payment_failed | Met subscription_status a past_due dans user_profiles |
| customer.updated | Sync email/nom du client Stripe vers user_profiles |
| charge.dispute.created | Log dans audit_log + alerte Sentry |
| charge.refunded | Log dans audit_log |

### 10. Actions dans Supabase apres paiement Stripe confirme

Sur checkout.session.completed :

1. Table subscriptions -- UPSERT (on conflict user_id) : tier='premium', status='active', stripe_subscription_id, stripe_customer_id, billing_cycle, current_period_start/end, price_amount
2. Table user_profiles -- UPDATE : role='premium', subscription_status='active', updated_at=now()
3. Sync Beehiiv (newsletter) avec role=premium
4. Audit log : action 'subscription_created'
5. Email : stripePaymentConfirmationEmail() envoye via Resend

### 11. Stripe Customer ID -- stockage et liaison

Le stripe_customer_id est stocke dans user_profiles.stripe_customer_id et aussi duplique dans subscriptions.stripe_customer_id.

Cree a la premiere tentative de checkout (src/app/api/stripe/checkout/route.ts) :

```typescript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('stripe_customer_id')
  .eq('id', user.id)
  .single();

let customerId = profile?.stripe_customer_id;

if (!customerId) {
  const customer = await stripe.customers.create(
    {
      email: user.email,
      metadata: { supabase_user_id: user.id },
    },
    { idempotencyKey: crypto.createHash('sha256').update(`create-customer:${user.id}`).digest('hex') }
  );
  customerId = customer.id;
  await supabase.from('user_profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
}
```

La liaison Stripe vers Supabase se fait via metadata.supabase_user_id injecte dans le customer, la session checkout, et la subscription.

### 12. Route Stripe Checkout

Fichier : src/app/api/stripe/checkout/route.ts

```typescript
export async function POST(request: NextRequest) {
  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Rate limit: 5 checkout/heure
  const rl = await checkRateLimit(`stripe-checkout:${user.id}`, 5, 60 * 60 * 1000);

  const { priceId: explicitPriceId, tier, billingCycle } = body;

  // Resolution du priceId depuis les env vars
  const priceIdMap: Record<string, string | undefined> = {
    monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
    quarterly: process.env.STRIPE_PRICE_ID_QUARTERLY,
    yearly: process.env.STRIPE_PRICE_ID_YEARLY,
  };
  const priceId = explicitPriceId || priceIdMap[billingCycle];

  // Validation : seul tier 'premium' accepte
  if (tier !== 'premium') return error 400;

  // Get or create Stripe customer (voir Q11)

  // Creation session checkout
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/compte?checkout=success`,
    cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
    metadata: {
      supabase_user_id: user.id,
      tier,
      billing_cycle: billingCycle || 'monthly',
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        tier,
        billing_cycle: billingCycle || 'monthly',
      },
    },
  }, { idempotencyKey: checkoutIdempotencyKey });

  return NextResponse.json({ url: session.url });
}
```

Il existe aussi une route Portal (src/app/api/stripe/portal/route.ts) pour gerer l'abonnement existant via le portail Stripe.
