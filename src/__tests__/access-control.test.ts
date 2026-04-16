import { describe, it, expect } from 'vitest';
import {
  checkArticleAccess,
  getContentTypeFromArticle,
  canAccessTool,
  getReaderPremiumLimit,
} from '@/lib/access-control';

describe('checkArticleAccess', () => {
  // ── Visitor (no user role) ──────────────────────────────────────────────
  describe('visitor (not logged in)', () => {
    it('blocks premium content with login_required', () => {
      const result = checkArticleAccess('premium', null, 0, 'test-slug');
      expect(result).toEqual({ allowed: false, reason: 'login_required' });
    });
  });

  // ── Admin ───────────────────────────────────────────────────────────────
  describe('admin', () => {
    it('allows free content', () => {
      expect(checkArticleAccess('free', 'admin', 0, 'slug')).toEqual({ allowed: true });
    });

    it('allows premium content regardless of count', () => {
      expect(checkArticleAccess('premium', 'admin', 999, 'slug')).toEqual({ allowed: true });
    });
  });

  // ── Premium user ────────────────────────────────────────────────────────
  describe('premium user', () => {
    it('allows free content', () => {
      expect(checkArticleAccess('free', 'premium', 0, 'slug')).toEqual({ allowed: true });
    });

    it('allows premium content', () => {
      expect(checkArticleAccess('premium', 'premium', 0, 'slug')).toEqual({ allowed: true });
    });
  });

  // ── Reader ──────────────────────────────────────────────────────────────
  describe('reader', () => {
    it('allows free content', () => {
      expect(checkArticleAccess('free', 'reader', 0, 'slug')).toEqual({ allowed: true });
    });

    it('allows premium content under monthly limit', () => {
      expect(checkArticleAccess('premium', 'reader', 2, 'slug')).toEqual({ allowed: true });
    });

    it('blocks premium content at monthly limit', () => {
      const result = checkArticleAccess('premium', 'reader', 3, 'slug');
      expect(result).toEqual({ allowed: false, reason: 'paywall_reader' });
    });

    it('blocks premium content over monthly limit', () => {
      const result = checkArticleAccess('premium', 'reader', 10, 'slug');
      expect(result).toEqual({ allowed: false, reason: 'paywall_reader' });
    });

    it('respects custom premium limit', () => {
      // Custom limit of 5, 4 read should still be allowed
      expect(checkArticleAccess('premium', 'reader', 4, 'slug', 5)).toEqual({ allowed: true });
      // At 5 should be blocked
      expect(checkArticleAccess('premium', 'reader', 5, 'slug', 5)).toEqual({
        allowed: false,
        reason: 'paywall_reader',
      });
    });
  });
});

describe('getContentTypeFromArticle', () => {
  it('returns explicit contentType when set', () => {
    expect(getContentTypeFromArticle({ contentType: 'premium' })).toBe('premium');
    expect(getContentTypeFromArticle({ contentType: 'free' })).toBe('free');
  });

  it('falls back to isPremium flag', () => {
    expect(getContentTypeFromArticle({ isPremium: true })).toBe('premium');
    expect(getContentTypeFromArticle({ isPremium: false })).toBe('free');
  });

  it('defaults to free when no indicators', () => {
    expect(getContentTypeFromArticle({})).toBe('free');
  });
});

describe('canAccessTool', () => {
  it('allows free tools for everyone', () => {
    expect(canAccessTool(null, false)).toBe(true);
    expect(canAccessTool('reader', false)).toBe(true);
  });

  it('blocks premium tools for non-logged in users', () => {
    expect(canAccessTool(null, true)).toBe(false);
  });

  it('blocks premium tools for readers', () => {
    expect(canAccessTool('reader', true)).toBe(false);
  });

  it('allows premium tools for premium users', () => {
    expect(canAccessTool('premium', true)).toBe(true);
  });

  it('allows premium tools for admins', () => {
    expect(canAccessTool('admin', true)).toBe(true);
  });
});

describe('getReaderPremiumLimit', () => {
  it('returns configured limit when provided', () => {
    expect(getReaderPremiumLimit(10)).toBe(10);
  });

  it('returns default limit of 3 when not configured', () => {
    expect(getReaderPremiumLimit()).toBe(3);
    expect(getReaderPremiumLimit(undefined)).toBe(3);
  });
});
