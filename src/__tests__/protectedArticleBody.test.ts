import { describe, it, expect } from 'vitest';
import {
  buildWatermarkSvgDataUrl,
  isBlockedShortcut,
} from '@/components/ProtectedArticleBody.helpers';

describe('buildWatermarkSvgDataUrl', () => {
  it('returns a data URL with the SVG mime type', () => {
    const url = buildWatermarkSvgDataUrl('user@example.com');
    expect(url.startsWith('data:image/svg+xml;utf8,')).toBe(true);
  });

  it('embeds the label text inside the SVG payload', () => {
    const url = buildWatermarkSvgDataUrl('alice@nfi.com');
    expect(decodeURIComponent(url)).toContain('alice@nfi.com');
  });

  it('escapes HTML-unsafe characters in the label (no script injection)', () => {
    const url = buildWatermarkSvgDataUrl('a<script>alert(1)</script>b');
    const decoded = decodeURIComponent(url);
    expect(decoded).not.toContain('<script>');
    expect(decoded).toContain('&#60;script&#62;');
  });

  it('produces deterministic output for the same input (no SSR mismatch)', () => {
    expect(buildWatermarkSvgDataUrl('x@y.com')).toBe(buildWatermarkSvgDataUrl('x@y.com'));
  });

  it('handles empty label without crashing', () => {
    expect(() => buildWatermarkSvgDataUrl('')).not.toThrow();
  });
});

describe('isBlockedShortcut', () => {
  it('blocks Ctrl+C', () => {
    expect(isBlockedShortcut({ ctrlKey: true, metaKey: false, key: 'c' })).toBe(true);
  });

  it('blocks Cmd+C on Mac', () => {
    expect(isBlockedShortcut({ ctrlKey: false, metaKey: true, key: 'c' })).toBe(true);
  });

  it('blocks all of A, C, P, S, X with a modifier', () => {
    for (const k of ['a', 'c', 'p', 's', 'x']) {
      expect(isBlockedShortcut({ ctrlKey: true, metaKey: false, key: k })).toBe(true);
    }
  });

  it('is case insensitive', () => {
    expect(isBlockedShortcut({ ctrlKey: true, metaKey: false, key: 'C' })).toBe(true);
    expect(isBlockedShortcut({ ctrlKey: false, metaKey: true, key: 'P' })).toBe(true);
  });

  it('does not block other letters', () => {
    expect(isBlockedShortcut({ ctrlKey: true, metaKey: false, key: 'b' })).toBe(false);
    expect(isBlockedShortcut({ ctrlKey: true, metaKey: false, key: 'v' })).toBe(false);
  });

  it('does not block keys without modifier', () => {
    expect(isBlockedShortcut({ ctrlKey: false, metaKey: false, key: 'c' })).toBe(false);
    expect(isBlockedShortcut({ ctrlKey: false, metaKey: false, key: 'a' })).toBe(false);
  });
});
