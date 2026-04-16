import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Shared mocks ──────────────────────────────────────────────────────────

const mockSupabaseFrom = vi.fn();
const mockGetUser = vi.fn();

const mockSupabase = {
  from: mockSupabaseFrom,
  auth: { getUser: mockGetUser },
};

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(async () => mockSupabase),
  createServiceClient: vi.fn(() => mockSupabase),
}));

vi.mock('@/lib/api-error', () => ({
  serverError: vi.fn((_err: unknown) => {
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => ({ limited: false, remaining: 10, resetAt: new Date() })),
  getClientIP: vi.fn(() => '127.0.0.1'),
  RATE_LIMITS: {
    newsletter: { limit: 5, windowMs: 3600000 },
    contact: { limit: 3, windowMs: 3600000 },
    tracking: { limit: 60, windowMs: 60000 },
    likes: { limit: 30, windowMs: 60000 },
    comments: { limit: 10, windowMs: 60000 },
    discussions: { limit: 5, windowMs: 600000 },
    paymentSubmit: { limit: 5, windowMs: 3600000 },
    auth: { limit: 10, windowMs: 900000 },
  },
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

// Helper to create a request with JSON body
function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

function getRequest(url: string): NextRequest {
  return new NextRequest(new Request(url, { method: 'GET' }));
}

// ─── Comments route tests ──────────────────────────────────────────────────

describe('GET /api/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing article_id', async () => {
    const { GET } = await import('@/app/api/comments/route');
    const req = getRequest('http://localhost/api/comments');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('article_id');
  });

  it('rejects invalid UUID article_id', async () => {
    const { GET } = await import('@/app/api/comments/route');
    const req = getRequest('http://localhost/api/comments?article_id=not-a-uuid');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('UUID');
  });

  it('returns paginated response with valid UUID', async () => {
    const mockData = [{ id: '1', content: 'test' }];
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
        // For count query
      }),
    });
    // Override to return count for first call, data for second
    let callCount = 0;
    mockSupabaseFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // count query
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
          }),
        };
      }
      // data query
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({ data: mockData, error: null }),
            }),
          }),
        }),
      };
    });

    const { GET } = await import('@/app/api/comments/route');
    const req = getRequest('http://localhost/api/comments?article_id=550e8400-e29b-41d4-a716-446655440000');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty('data');
    expect(Array.isArray(json.data)).toBe(true);
    expect(json).toHaveProperty('pagination');
  });
});

describe('POST /api/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('@/app/api/comments/route');
    const req = jsonRequest('http://localhost/api/comments', {
      article_id: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Test comment',
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('rejects invalid article_id in POST body', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', user_metadata: {}, email: 'test@test.com' } },
    });

    const { POST } = await import('@/app/api/comments/route');
    const req = jsonRequest('http://localhost/api/comments', {
      article_id: 'invalid-id',
      content: 'Test comment',
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('UUID');
  });

  it('rejects malformed JSON', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', user_metadata: {}, email: 'test@test.com' } },
    });

    const { POST } = await import('@/app/api/comments/route');
    const req = new NextRequest(new Request('http://localhost/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not json{{{',
    }));
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ─── Likes route tests ─────────────────────────────────────────────────────

describe('GET /api/likes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing article_id', async () => {
    const { GET } = await import('@/app/api/likes/route');
    const req = getRequest('http://localhost/api/likes');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('rejects non-UUID article_id', async () => {
    const { GET } = await import('@/app/api/likes/route');
    const req = getRequest("http://localhost/api/likes?article_id='; DROP TABLE--");
    const res = await GET(req);

    expect(res.status).toBe(400);
  });
});

describe('POST /api/likes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('@/app/api/likes/route');
    const req = jsonRequest('http://localhost/api/likes', {
      article_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('rejects invalid article_id', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', user_metadata: {}, email: 'test@test.com' } },
    });

    const { POST } = await import('@/app/api/likes/route');
    const req = jsonRequest('http://localhost/api/likes', {
      article_id: 'not-valid',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ─── Newsletter route tests ────────────────────────────────────────────────

vi.mock('@/lib/beehiiv', () => ({
  subscribeToBeehiiv: vi.fn(async () => true),
}));

vi.mock('@/lib/email', () => ({
  sendTransactionalEmail: vi.fn(async () => {}),
}));

vi.mock('@/lib/email-templates', () => ({
  newsletterWelcomeEmail: vi.fn(() => ({ subject: 'Welcome', html: '<p>Hi</p>' })),
}));

describe('POST /api/newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid email (no TLD)', async () => {
    const { POST } = await import('@/app/api/newsletter/route');
    const req = jsonRequest('http://localhost/api/newsletter', { email: 'bad@domain' });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects email with just @', async () => {
    const { POST } = await import('@/app/api/newsletter/route');
    const req = jsonRequest('http://localhost/api/newsletter', { email: 'has@sign' });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON body', async () => {
    const { POST } = await import('@/app/api/newsletter/route');
    const req = new NextRequest(new Request('http://localhost/api/newsletter', {
      method: 'POST',
      body: '{broken',
    }));
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ─── Discussions route tests ───────────────────────────────────────────────

describe('POST /api/discussions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('@/app/api/discussions/route');
    const req = jsonRequest('http://localhost/api/discussions', {
      title: 'Test',
      content: 'Content',
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('rejects empty title', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', user_metadata: {}, email: 'test@test.com' } },
    });

    const { POST } = await import('@/app/api/discussions/route');
    const req = jsonRequest('http://localhost/api/discussions', {
      title: '',
      content: 'Content',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects oversized title (>200 chars)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', user_metadata: {}, email: 'test@test.com' } },
    });

    const { POST } = await import('@/app/api/discussions/route');
    const req = jsonRequest('http://localhost/api/discussions', {
      title: 'x'.repeat(201),
      content: 'Content',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ─── Discussions GET pagination test ────────────────────────────────────────

describe('GET /api/discussions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated response structure', async () => {
    let callCount = 0;
    mockSupabaseFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockResolvedValue({ count: 0, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      };
    });

    const { GET } = await import('@/app/api/discussions/route');
    const req = getRequest('http://localhost/api/discussions?page=1&limit=10');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty('pagination');
    expect(json.pagination).toHaveProperty('page');
    expect(json.pagination).toHaveProperty('total');
    expect(json.pagination).toHaveProperty('hasMore');
  });
});
