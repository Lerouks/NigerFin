/**
 * Tokens design pour les PDFs des outils NFI Report.
 * Cohérent avec src/emails/InvoicePdf.tsx (Apple-style validé en prod).
 * Helvetica built-in (pas de fonts custom) pour éviter tout problème
 * d'embedding/CORS/CSP et garantir un rendu identique partout.
 */

export const PDF_COLORS = {
  // Surfaces (palette Apple)
  paper: '#ffffff',
  paperSoft: '#f5f5f7',
  ink: '#1d1d1f',
  inkSoft: '#3a3a3c',
  muted: '#6e6e73',
  mutedLight: '#86868b',
  divider: '#d2d2d7',
  dividerLight: '#e5e5e7',
  // Notice (disclaimer)
  warning: '#d97706',
  warningBg: '#fff9eb',
  warningInk: '#5c4308',
  // Brand accent (utilisé avec parcimonie, uniquement sur slogan final)
  brand: '#1d1d1f',
} as const;

export const PDF_FONT = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique',
} as const;

export const PDF_SIZE = {
  // Hiérarchie typo (alignée sur InvoicePdf)
  brand: 14,
  docTitle: 22,
  docRef: 10,
  eyebrow: 7.5,
  sectionTitle: 11,
  body: 10.5,
  bodySmall: 10,
  meta: 10.5,
  metaLabel: 7,
  micro: 8,
  // Hero KPI (chiffre principal)
  heroValue: 32,
  cardValue: 20,
  // Table
  tableHead: 8,
  tableCell: 10,
  // Footer
  footer: 7.5,
} as const;

export const PDF_SPACING = {
  pageMarginTop: 56,
  pageMarginBottom: 56,
  pageMarginX: 56,
  sectionGap: 22,
  blockGap: 12,
  cardPadding: 16,
  metaPadding: 16,
  bodyLineHeight: 1.55,
  titleLineHeight: 1.15,
} as const;

export const PDF_BORDER_RADIUS = {
  card: 8,
  pill: 999,
} as const;

export const PDF_SLOGAN = 'La connaissance, votre meilleur capital';

export const PDF_DISCLAIMER =
  'Les simulations produites par NFI Report sont fournies à titre indicatif. Elles ne constituent pas un conseil financier, fiscal ou juridique. NFI Report ne saurait être tenu responsable des décisions prises sur la base de ces résultats.';

export const PDF_BRAND_NAME = 'NFI REPORT';
export const PDF_SITE = 'nfireport.com';
