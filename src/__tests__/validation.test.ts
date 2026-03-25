import { describe, it, expect } from 'vitest';
import { isValidUUID, isValidEmail, sanitizeSearchQuery, isOneOf } from '@/lib/validation';

describe('isValidUUID', () => {
  it('accepts valid UUIDs', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
  });

  it('rejects invalid UUIDs', () => {
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
    expect(isValidUUID(123)).toBe(false);
    expect(isValidUUID(null)).toBe(false);
    expect(isValidUUID(undefined)).toBe(false);
    // SQL injection attempt
    expect(isValidUUID("'; DROP TABLE users; --")).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.user+tag@domain.co.uk')).toBe(true);
    expect(isValidEmail('name@sub.domain.org')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user@.com')).toBe(false);
    expect(isValidEmail('user@domain')).toBe(false);
    expect(isValidEmail(123)).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    // XSS attempt
    expect(isValidEmail('<script>alert(1)</script>@evil.com')).toBe(false);
    // Very long email (exceeds 254 char limit)
    expect(isValidEmail('a'.repeat(250) + '@b.com')).toBe(false);
  });
});

describe('sanitizeSearchQuery', () => {
  it('escapes SQL wildcard characters', () => {
    expect(sanitizeSearchQuery('test%injection')).toBe('test\\%injection');
    expect(sanitizeSearchQuery('test_injection')).toBe('test\\_injection');
    expect(sanitizeSearchQuery('test\\injection')).toBe('test\\\\injection');
  });

  it('handles combined injections', () => {
    expect(sanitizeSearchQuery('%_\\')).toBe('\\%\\_\\\\');
  });

  it('truncates to 200 characters', () => {
    const longInput = 'a'.repeat(300);
    expect(sanitizeSearchQuery(longInput).length).toBe(200);
  });

  it('preserves normal search terms', () => {
    expect(sanitizeSearchQuery('John Doe')).toBe('John Doe');
    expect(sanitizeSearchQuery('user@email.com')).toBe('user@email.com');
  });
});

describe('isOneOf', () => {
  it('validates against allowed values', () => {
    const roles = ['reader', 'premium', 'admin'] as const;
    expect(isOneOf('reader', roles)).toBe(true);
    expect(isOneOf('premium', roles)).toBe(true);
    expect(isOneOf('superadmin', roles)).toBe(false);
    expect(isOneOf('', roles)).toBe(false);
    expect(isOneOf(123, roles)).toBe(false);
  });
});
