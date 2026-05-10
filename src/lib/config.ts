/**
 * Centralized site configuration.
 * All site-wide constants should live here to avoid scattered hardcoded values.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://nfireport.com';

/**
 * Truncate a title for the HTML <title> tag (SEO).
 * Cuts at the last word boundary before maxLen, preserves meaning.
 * Adds an ellipsis only if truncated.
 */
export function truncateSeoTitle(title: string, maxLen = 58): string {
  if (!title) return '';
  if (title.length <= maxLen) return title;
  const slice = title.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice;
  return cut.replace(/[.,;:!?-]+$/, '') + '…';
}
