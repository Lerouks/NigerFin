/**
 * Design tokens partagés entre la newsletter premium et le site nfireport.com.
 * Source de vérité unique : si la charte évolue, on modifie ici.
 */

export const colors = {
  paper: '#fafaf9',
  ink: '#1a1a1a',
  inkSoft: '#404040',
  inkMuted: '#737373',
  inkFaint: '#a3a3a3',
  primary: '#111111',
  surface: '#ffffff',
  secondary: '#f5f5f0',
  muted: '#f0efe9',
  divider: '#e5e5e5',
  gold: '#d4a843',
  goldSoft: 'rgba(212, 168, 67, 0.10)',
  goldFaint: 'rgba(212, 168, 67, 0.06)',
  positive: '#15803d',
  negative: '#b91c1c',
  positiveBg: '#dcfce7',
  negativeBg: '#fee2e2',
} as const;

export const fonts = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
} as const;

export const sizes = {
  containerWidth: 640,
  containerPadding: 32,
  sectionGap: 36,
} as const;

export const radii = {
  sm: '4px',
  md: '8px',
  lg: '12px',
} as const;

export const fontSizes = {
  wordmark: '24px',
  meta: '11px',
  h1: '28px',
  h2: '20px',
  h3: '16px',
  body: '15px',
  small: '13px',
  tiny: '11px',
} as const;

export const lineHeights = {
  tight: '1.25',
  normal: '1.65',
  relaxed: '1.78',
} as const;

export const letterSpacing = {
  wordmark: '4px',
  caps: '2px',
  loose: '1.5px',
  normal: '0px',
} as const;
