import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase module before importing rate-limit
vi.mock('@/lib/supabase', () => ({
  createServiceClient: vi.fn(() => null), // Force in-memory fallback
}));

import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

describe('checkRateLimit (in-memory fallback)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests under the limit', async () => {
    const result = await checkRateLimit('test-key-1', 3, 60000);
    expect(result.limited).toBe(false);
    expect(result.remaining).toBe(2);
  });

  it('blocks requests over the limit', async () => {
    const key = 'test-key-block-' + Date.now();
    await checkRateLimit(key, 2, 60000);
    await checkRateLimit(key, 2, 60000);
    const result = await checkRateLimit(key, 2, 60000);
    expect(result.limited).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', async () => {
    const key = 'test-key-reset-' + Date.now();
    await checkRateLimit(key, 1, 1000);
    const blocked = await checkRateLimit(key, 1, 1000);
    expect(blocked.limited).toBe(true);

    // Advance time past the window
    vi.advanceTimersByTime(1100);

    const reset = await checkRateLimit(key, 1, 1000);
    expect(reset.limited).toBe(false);
  });
});

describe('getClientIP', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    });
    expect(getClientIP(req)).toBe('192.168.1.1');
  });

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '10.0.0.5' },
    });
    expect(getClientIP(req)).toBe('10.0.0.5');
  });

  it('returns unknown when no headers present', () => {
    const req = new Request('http://localhost');
    expect(getClientIP(req)).toBe('unknown');
  });
});
