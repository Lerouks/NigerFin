/**
 * Persistent rate limiting using Supabase.
 * Uses a `rate_limits` table to track request counts per key.
 * Falls back to in-memory when Supabase is unavailable.
 */

import { createServiceClient } from '@/lib/supabase';

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: Date;
}

// In-memory fallback (last resort)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: limit - 1, resetAt: new Date(now + windowMs) };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  return {
    limited: entry.count > limit,
    remaining,
    resetAt: new Date(entry.resetAt),
  };
}

// Periodic cleanup of expired in-memory entries (every 5 min)
setInterval(() => {
  const now = Date.now();
  memoryStore.forEach((entry, key) => {
    if (now > entry.resetAt) memoryStore.delete(key);
  });
}, 5 * 60 * 1000);

/**
 * Check and enforce rate limit.
 * @param identifier - Unique key (e.g., "newsletter:192.168.1.1" or "likes:user-uuid")
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return memoryRateLimit(identifier, limit, windowMs);
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    // Clean expired entries and count current window
    const { count, error } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', identifier)
      .gte('created_at', windowStart.toISOString());

    if (error) {
      // Fallback to in-memory on DB error
      return memoryRateLimit(identifier, limit, windowMs);
    }

    const currentCount = count || 0;

    if (currentCount >= limit) {
      return {
        limited: true,
        remaining: 0,
        resetAt: new Date(windowStart.getTime() + windowMs),
      };
    }

    // Record this request
    await supabase.from('rate_limits').insert({
      key: identifier,
      created_at: now.toISOString(),
    });

    return {
      limited: false,
      remaining: limit - currentCount - 1,
      resetAt: new Date(now.getTime() + windowMs),
    };
  } catch {
    return memoryRateLimit(identifier, limit, windowMs);
  }
}

/** Extract client IP from request headers */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

// Rate limit presets for different route types
export const RATE_LIMITS = {
  newsletter: { limit: 5, windowMs: 60 * 60 * 1000 },         // 5/hour
  contact: { limit: 3, windowMs: 60 * 60 * 1000 },            // 3/hour
  tracking: { limit: 60, windowMs: 60 * 1000 },               // 60/min
  likes: { limit: 30, windowMs: 60 * 1000 },                  // 30/min
  comments: { limit: 10, windowMs: 60 * 1000 },               // 10/min
  discussions: { limit: 5, windowMs: 10 * 60 * 1000 },        // 5/10min
  paymentSubmit: { limit: 5, windowMs: 60 * 60 * 1000 },      // 5/hour
  auth: { limit: 10, windowMs: 15 * 60 * 1000 },              // 10/15min
} as const;
