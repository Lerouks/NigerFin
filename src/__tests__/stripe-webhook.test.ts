import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});
const mockSelectSingle = vi.fn().mockResolvedValue({
  data: { email: 'user@test.com', full_name: 'Test User' },
});

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === 'subscriptions') {
      return {
        upsert: mockUpsert,
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    return {
      update: mockUpdate,
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSelectSingle,
        }),
      }),
    };
  }),
};

vi.mock('@/lib/supabase', () => ({
  createServiceClient: vi.fn(() => mockSupabase),
}));

vi.mock('@/lib/brevo', () => ({
  syncContactToBrevo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email', () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email-templates', () => ({
  stripePaymentConfirmationEmail: vi.fn(() => ({
    subject: 'Confirmation',
    html: '<p>Confirmed</p>',
  })),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();

vi.mock('stripe', () => {
  class StripeMock {
    webhooks = { constructEvent: mockConstructEvent };
    subscriptions = { retrieve: mockSubscriptionsRetrieve };
  }
  return { default: StripeMock };
});

// ── Tests ─────────────────────────────────────────────────────────────────────

import { POST } from '@/app/api/stripe/webhook/route';
import { NextRequest } from 'next/server';

function makeRequest(body: string, signature = 'sig_test'): NextRequest {
  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': signature },
  });
}

describe('Stripe Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_fake';
  });

  it('returns 503 when STRIPE_SECRET_KEY is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe('Stripe not configured');
  });

  it('returns 503 when STRIPE_WEBHOOK_SECRET is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe('Webhook secret not configured');
  });

  it('returns 400 for invalid signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid signature');
  });

  it('handles checkout.session.completed', async () => {
    const fakeSubscription = {
      id: 'sub_123',
      current_period_start: 1700000000,
      current_period_end: 1702592000,
      items: { data: [{ price: { unit_amount: 9900 } }] },
    };

    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { supabase_user_id: 'user-uuid', tier: 'premium', billing_cycle: 'monthly' },
          subscription: 'sub_123',
          customer: 'cus_123',
        },
      },
    });

    mockSubscriptionsRetrieve.mockResolvedValue(fakeSubscription);

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);

    // Should upsert subscription
    expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
    expect(mockUpsert).toHaveBeenCalled();
  });

  it('handles customer.subscription.deleted', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          metadata: { supabase_user_id: 'user-uuid' },
        },
      },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
  });

  it('handles invoice.payment_failed', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: {
          subscription: 'sub_456',
        },
      },
    });

    mockSubscriptionsRetrieve.mockResolvedValue({
      metadata: { supabase_user_id: 'user-uuid' },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
  });

  it('returns 200 even for unknown event types (no crash)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'unknown.event',
      data: { object: {} },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
  });
});
