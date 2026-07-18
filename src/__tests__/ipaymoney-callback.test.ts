import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Secrets présents AVANT le chargement de la route (lus au top-level du module).
process.env.IPAYMONEY_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.IPAYMONEY_SECRET_KEY = 'sk_test_secret';

// ─── Mock Supabase : un builder chaînable réutilisé pour chaque .from() ──────
// `maybeSingle` sert au lookup + au claim atomique ; `single` au rôle + email.
function createBuilder() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };
}
let builder: ReturnType<typeof createBuilder>;
const mockServiceClient = { from: vi.fn(() => builder) };

vi.mock('@/lib/supabase', () => ({
  createServiceClient: vi.fn(() => mockServiceClient),
  createServerSupabaseClient: vi.fn(async () => mockServiceClient),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => ({ limited: false, remaining: 20, resetAt: new Date() })),
  getClientIP: vi.fn(() => '127.0.0.1'),
  RATE_LIMITS: { paymentCallback: { limit: 20, windowMs: 60_000 } },
}));

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));

// On mocke UNIQUEMENT l'appel réseau verifyIPayPayment ; les prédicats
// isIPaySucceeded/isIPayFailed restent les vrais (logique testée telle quelle).
const mockVerify = vi.fn();
vi.mock('@/lib/ipaymoney', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ipaymoney')>();
  return { ...actual, verifyIPayPayment: mockVerify };
});

const mockAudit = vi.fn(async () => {});
vi.mock('@/lib/audit', () => ({ logAuditEvent: mockAudit }));
vi.mock('@/lib/email', () => ({ sendTransactionalEmail: vi.fn(async () => {}) }));
vi.mock('@/lib/email-templates', () => ({
  paymentConfirmationEmail: vi.fn(() => ({ subject: 's', html: '<p>h</p>' })),
}));
vi.mock('@/lib/newsletter/subscribers', () => ({ upsertNewsletterSubscriber: vi.fn(async () => {}) }));
vi.mock('@/lib/invoices/issue', () => ({ issueInvoice: vi.fn(async () => {}) }));

// ─── Helpers ────────────────────────────────────────────────────────────────
const AUTH = { 'x-ipaymoney-secret': 'test-webhook-secret' };

function ipayRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/ipaymoney/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
  );
}

function rawRequest(body: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(
    new Request('http://localhost/api/ipaymoney/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
    }),
  );
}

const VERIFIED = 'ipaymoney_payment_verified';
const FAILED = 'ipaymoney_payment_failed';
function auditCalledWith(action: string): boolean {
  return mockAudit.mock.calls.some((c) => c[1] === action);
}

// Transaction locale par défaut (Premium annuel = 50 000 FCFA).
let paymentRow: Record<string, unknown> | null;

describe('POST /api/ipaymoney/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    builder = createBuilder();
    paymentRow = {
      id: 'pr-1',
      user_id: 'user-1',
      tier: 'premium',
      billing_cycle: 'yearly',
      amount: 50_000,
      payment_method: 'ipaymoney',
      status: 'pending',
    };
    // 1er maybeSingle = lookup (lit paymentRow au moment de l'appel) ;
    // les suivants = claim atomique gagné ({ id }).
    builder.maybeSingle
      .mockImplementationOnce(async () => ({ data: paymentRow, error: null }))
      .mockImplementation(async () => ({ data: { id: 'pr-1' }, error: null }));
    // single = rôle puis email (même objet, champs distincts lus séparément).
    builder.single.mockImplementation(async () => ({
      data: { role: 'reader', email: 'u@test.com', full_name: 'Test' },
      error: null,
    }));
  });

  it('rejette un secret webhook invalide (401)', async () => {
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest(
        { data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' } },
        { 'x-ipaymoney-secret': 'WRONG' },
      ),
    );
    expect(res.status).toBe(401);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('rejette un header secret totalement absent (401)', async () => {
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' } }),
    );
    expect(res.status).toBe(401);
  });

  it('rejette un corps JSON malformé (400) après authentification', async () => {
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(rawRequest('{ this is not json', AUTH));
    expect(res.status).toBe(400);
  });

  it('rejette un corps sans external_reference (400)', async () => {
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(ipayRequest({ data: { reference: 'ipayref', status: 'succeeded' } }, AUTH));
    expect(res.status).toBe(400);
  });

  it('404 si la transaction est introuvable', async () => {
    paymentRow = null;
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-x', reference: 'ipayref', status: 'succeeded' } }, AUTH),
    );
    expect(res.status).toBe(404);
  });

  it('500 (retryable) si la lecture DB échoue vraiment', async () => {
    builder.maybeSingle.mockReset();
    builder.maybeSingle.mockImplementationOnce(async () => ({ data: null, error: { message: 'db down' } }));
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' } }, AUTH),
    );
    expect(res.status).toBe(500);
  });

  it('laisse en attente si aucune reference iPay (vérification impossible)', async () => {
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(ipayRequest({ data: { external_reference: 'NFI-1', status: 'succeeded' } }, AUTH));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.pending).toBe(true);
    expect(mockVerify).not.toHaveBeenCalled();
    expect(auditCalledWith(VERIFIED)).toBe(false);
  });

  it("n'active PAS et demande un réessai (503) si iPay ne confirme pas (verify indisponible => null)", async () => {
    mockVerify.mockResolvedValue(null);
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' } }, AUTH),
    );
    const json = await res.json();
    // 503 => iPay réessaiera le webhook ; aucune activation tant que non confirmé.
    expect(res.status).toBe(503);
    expect(json.pending).toBe(true);
    expect(json.retry).toBe(true);
    expect(auditCalledWith(VERIFIED)).toBe(false);
  });

  it("demande un réessai (503) si iPay répond 'pending'", async () => {
    mockVerify.mockResolvedValue({ external_reference: 'NFI-1', reference: 'ipayref', status: 'pending' });
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'pending' } }, AUTH),
    );
    const json = await res.json();
    expect(res.status).toBe(503);
    expect(json.pending).toBe(true);
    expect(json.retry).toBe(true);
    expect(auditCalledWith(VERIFIED)).toBe(false);
  });

  it("anti-forgery : webhook dit succeeded mais iPay dit failed => rejet, pas d'activation", async () => {
    mockVerify.mockResolvedValue({ external_reference: 'NFI-1', reference: 'ipayref', status: 'failed' });
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' } }, AUTH),
    );
    expect(res.status).toBe(200);
    expect(auditCalledWith(FAILED)).toBe(true);
    expect(auditCalledWith(VERIFIED)).toBe(false);
  });

  it('active le Premium quand iPay confirme succeeded + montant correct', async () => {
    mockVerify.mockResolvedValue({ external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' });
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' } }, AUTH),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(auditCalledWith(VERIFIED)).toBe(true);
  });

  it('rejette si le montant stocké est SOUS le plancher config (anti-fraude « payer moins »)', async () => {
    paymentRow = { ...(paymentRow as object), amount: 100 }; // annuel, plancher 50 000
    mockVerify.mockResolvedValue({ external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' });
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' } }, AUTH),
    );
    expect(res.status).toBe(400);
    expect(auditCalledWith(VERIFIED)).toBe(false);
  });

  it('accepte un prix dynamique SUPERIEUR au config (pricing dynamique wired de bout en bout)', async () => {
    paymentRow = { ...(paymentRow as object), amount: 60_000 }; // annuel, >= plancher 50 000
    mockVerify.mockResolvedValue({ external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' });
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' } }, AUTH),
    );
    expect(res.status).toBe(200);
    expect(auditCalledWith(VERIFIED)).toBe(true);
  });

  it('rejette un montant aberrant au-dessus du plafond', async () => {
    paymentRow = { ...(paymentRow as object), amount: 20_000_000 }; // > MAX_DYNAMIC_PRICE
    mockVerify.mockResolvedValue({ external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' });
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' } }, AUTH),
    );
    expect(res.status).toBe(400);
    expect(auditCalledWith(VERIFIED)).toBe(false);
  });

  it('rejette si external_reference renvoyé par iPay ne correspond pas (mismatch)', async () => {
    mockVerify.mockResolvedValue({ external_reference: 'NFI-AUTRE', reference: 'ipayref', status: 'succeeded' });
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' } }, AUTH),
    );
    expect(res.status).toBe(400);
    expect(auditCalledWith(VERIFIED)).toBe(false);
  });

  it("laisse en attente si iPay confirme succeeded mais SANS external_reference (fail-closed)", async () => {
    mockVerify.mockResolvedValue({ reference: 'ipayref', status: 'succeeded' });
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' } }, AUTH),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.pending).toBe(true);
    expect(auditCalledWith(VERIFIED)).toBe(false);
  });

  it('idempotent : transaction déjà vérifiée => 200 sans re-vérifier', async () => {
    paymentRow = { ...(paymentRow as object), status: 'verified' };
    const { POST } = await import('@/app/api/ipaymoney/callback/route');
    const res = await POST(
      ipayRequest({ data: { external_reference: 'NFI-1', reference: 'ipayref', status: 'succeeded' } }, AUTH),
    );
    expect(res.status).toBe(200);
    expect(mockVerify).not.toHaveBeenCalled();
    expect(auditCalledWith(VERIFIED)).toBe(false);
  });
});
