/**
 * Tokens design pour les PDFs des outils NFI Report.
 * Source de vérité unique pour assurer la cohérence Apple-style avec InvoicePdf.tsx.
 *
 * Charte typo, strictement, Inter Display + Montserrat + Playfair (mission requirement).
 * Toutes les fonts vivent dans /public/fonts/, déclarées via Font.register dans ToolPdfDocument.tsx.
 */

export const PDF_COLORS = {
  // Surfaces
  bg: '#fafaf9',
  card: '#ffffff',
  inkPrimary: '#111111',
  inkSecondary: '#374151',
  inkMuted: '#6b7280',
  inkSubtle: '#9ca3af',
  // Borders
  borderSoft: '#e5e7eb',
  borderHairline: '#f0efe9',
  // Accents
  gold: '#d4a843',
  goldSoft: 'rgba(212, 168, 67, 0.12)',
  // Semantic
  success: '#10b981',
  error: '#ef4444',
} as const;

export const PDF_FONT = {
  // Stack body : Montserrat pour le corps texte (paragraphes, recommandations)
  body: 'Montserrat',
  // Stack titles : Inter pour les titres + données (chiffres clés, KPIs, headers)
  title: 'Inter',
  // Stack wordmark : Playfair pour le N et le R du wordmark NFI Report
  wordmark: 'Playfair',
} as const;

export const PDF_SIZE = {
  // Hierarchie typo
  wordmark: 16,
  pageTitle: 18,
  sectionTitle: 12,
  subSection: 10,
  body: 10,
  caption: 9,
  micro: 8,
  // Tabular
  tableHead: 9,
  tableCell: 9,
} as const;

export const PDF_SPACING = {
  // Page margins (mm-like in pt)
  pageMarginTop: 48,
  pageMarginBottom: 56,
  pageMarginX: 40,
  // Section spacing
  sectionGap: 24,
  blockGap: 12,
  rowGap: 6,
  // Block padding
  cardPadding: 14,
  // Line heights
  bodyLineHeight: 1.55,
  titleLineHeight: 1.25,
} as const;

export const PDF_BORDER_RADIUS = {
  card: 8,
  pill: 999,
} as const;

/** Slogan de fin de PDF, dernière page seulement */
export const PDF_SLOGAN = 'La connaissance, votre meilleur capital';

/** Texte légal commun à tous les PDFs des outils */
export const PDF_DISCLAIMER =
  'Les simulations produites par NFI Report sont fournies à titre indicatif. Elles ne constituent pas un conseil financier, fiscal ou juridique. NFI Report ne saurait être tenu responsable des décisions prises sur la base de ces résultats.';
