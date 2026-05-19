import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import {
  PDF_COLORS,
  PDF_FONT,
  PDF_SIZE,
  PDF_SPACING,
  PDF_BORDER_RADIUS,
  PDF_SLOGAN,
  PDF_DISCLAIMER,
} from './tokens';

/* ── Fonts registration (once at module load) ─────────────────────── */

const FONT_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

Font.register({
  family: PDF_FONT.title,
  fonts: [
    { src: `${FONT_ORIGIN}/fonts/inter-400.woff`, fontWeight: 400 },
    { src: `${FONT_ORIGIN}/fonts/inter-500.woff`, fontWeight: 500 },
    { src: `${FONT_ORIGIN}/fonts/inter-600.woff`, fontWeight: 600 },
    { src: `${FONT_ORIGIN}/fonts/inter-700.woff`, fontWeight: 700 },
  ],
});

Font.register({
  family: PDF_FONT.body,
  fonts: [
    { src: `${FONT_ORIGIN}/fonts/montserrat-400.woff`, fontWeight: 400 },
    { src: `${FONT_ORIGIN}/fonts/montserrat-500.woff`, fontWeight: 500 },
  ],
});

Font.register({
  family: PDF_FONT.wordmark,
  src: `${FONT_ORIGIN}/fonts/playfair-700.woff`,
  fontWeight: 700,
});

/* ── Sanitization helpers ─────────────────────────────────────────── */

/** Convertit les caractères qui posent problème dans React-PDF en équivalents safe. */
function sanitize(s: string): string {
  return s
    .replace(/[  ]/g, ' ') // non-break spaces
    .replace(/—/g, ', ') // em-dash interdit charte
    .replace(/–/g, '-'); // en-dash interdit charte
}

/* ── Styles ────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: PDF_COLORS.bg,
    paddingTop: PDF_SPACING.pageMarginTop,
    paddingBottom: PDF_SPACING.pageMarginBottom,
    paddingHorizontal: PDF_SPACING.pageMarginX,
    fontFamily: PDF_FONT.body,
    fontSize: PDF_SIZE.body,
    color: PDF_COLORS.inkSecondary,
    lineHeight: PDF_SPACING.bodyLineHeight,
  },

  /* Header (page 1 only) */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.inkPrimary,
    marginBottom: 24,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wordmarkN: {
    fontFamily: PDF_FONT.wordmark,
    fontSize: PDF_SIZE.wordmark + 2,
    color: PDF_COLORS.gold,
    fontWeight: 700,
  },
  wordmarkMain: {
    fontFamily: PDF_FONT.title,
    fontSize: PDF_SIZE.wordmark,
    color: PDF_COLORS.inkPrimary,
    fontWeight: 600,
    letterSpacing: 0.4,
  },
  wordmarkR: {
    fontFamily: PDF_FONT.wordmark,
    fontSize: PDF_SIZE.wordmark + 2,
    color: PDF_COLORS.gold,
    fontWeight: 700,
  },
  headerDate: {
    fontFamily: PDF_FONT.body,
    fontSize: PDF_SIZE.caption,
    color: PDF_COLORS.inkMuted,
  },

  /* Page title */
  pageTitleEyebrow: {
    fontFamily: PDF_FONT.title,
    fontSize: PDF_SIZE.micro,
    fontWeight: 600,
    color: PDF_COLORS.gold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  pageTitle: {
    fontFamily: PDF_FONT.title,
    fontSize: PDF_SIZE.pageTitle,
    fontWeight: 600,
    color: PDF_COLORS.inkPrimary,
    lineHeight: PDF_SPACING.titleLineHeight,
    marginBottom: PDF_SPACING.sectionGap,
  },

  /* Section title */
  sectionTitle: {
    fontFamily: PDF_FONT.title,
    fontSize: PDF_SIZE.sectionTitle,
    fontWeight: 600,
    color: PDF_COLORS.inkPrimary,
    marginBottom: PDF_SPACING.blockGap,
    letterSpacing: 0.2,
  },

  /* Cards (KPI grid) */
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: PDF_SPACING.sectionGap,
  },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: PDF_COLORS.card,
    borderRadius: PDF_BORDER_RADIUS.card,
    padding: PDF_SPACING.cardPadding,
    borderWidth: 1,
    borderColor: PDF_COLORS.borderHairline,
  },
  cardLabel: {
    fontFamily: PDF_FONT.body,
    fontSize: PDF_SIZE.micro,
    color: PDF_COLORS.inkMuted,
    fontWeight: 500,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardValue: {
    fontFamily: PDF_FONT.title,
    fontSize: PDF_SIZE.sectionTitle + 2,
    fontWeight: 600,
    color: PDF_COLORS.inkPrimary,
  },

  /* Parameter list (rows) */
  paramsList: {
    backgroundColor: PDF_COLORS.card,
    borderRadius: PDF_BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: PDF_COLORS.borderHairline,
    padding: PDF_SPACING.cardPadding,
    marginBottom: PDF_SPACING.sectionGap,
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderHairline,
  },
  paramRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  paramLabel: {
    color: PDF_COLORS.inkMuted,
    fontSize: PDF_SIZE.body,
  },
  paramValue: {
    color: PDF_COLORS.inkPrimary,
    fontFamily: PDF_FONT.title,
    fontWeight: 500,
    fontSize: PDF_SIZE.body,
  },

  /* Detail table */
  table: {
    marginBottom: PDF_SPACING.sectionGap,
    borderRadius: PDF_BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: PDF_COLORS.borderHairline,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.inkPrimary,
  },
  tableHeadCell: {
    flexGrow: 1,
    flexBasis: 0,
    color: PDF_COLORS.card,
    fontFamily: PDF_FONT.title,
    fontSize: PDF_SIZE.tableHead,
    fontWeight: 600,
    padding: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.card,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.borderHairline,
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.borderHairline,
  },
  tableCell: {
    flexGrow: 1,
    flexBasis: 0,
    color: PDF_COLORS.inkPrimary,
    fontFamily: PDF_FONT.title,
    fontSize: PDF_SIZE.tableCell,
    padding: 7,
  },

  /* Recommendations bullets */
  recItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recBullet: {
    color: PDF_COLORS.gold,
    fontSize: PDF_SIZE.body,
    marginRight: 8,
    fontWeight: 700,
  },
  recText: {
    flex: 1,
    color: PDF_COLORS.inkSecondary,
    fontSize: PDF_SIZE.body,
    lineHeight: PDF_SPACING.bodyLineHeight,
  },

  /* Slogan (last page only) */
  slogan: {
    marginTop: PDF_SPACING.sectionGap,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.borderHairline,
    fontFamily: PDF_FONT.wordmark,
    fontSize: PDF_SIZE.body,
    color: PDF_COLORS.gold,
    textAlign: 'center',
    letterSpacing: 0.6,
  },

  /* Footer (fixed on every page) */
  footer: {
    position: 'absolute',
    bottom: 20,
    left: PDF_SPACING.pageMarginX,
    right: PDF_SPACING.pageMarginX,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.borderHairline,
  },
  footerLeft: {
    fontFamily: PDF_FONT.body,
    fontSize: PDF_SIZE.micro,
    color: PDF_COLORS.inkMuted,
  },
  footerRight: {
    fontFamily: PDF_FONT.title,
    fontSize: PDF_SIZE.micro,
    color: PDF_COLORS.inkMuted,
  },

  /* Disclaimer */
  disclaimer: {
    marginTop: PDF_SPACING.sectionGap,
    fontFamily: PDF_FONT.body,
    fontSize: PDF_SIZE.micro,
    color: PDF_COLORS.inkSubtle,
    lineHeight: 1.5,
  },
});

/* ── Component types ──────────────────────────────────────────────── */

export interface ToolPdfData {
  title: string;
  /** Optional eyebrow (e.g. "Simulateur d'emprunt") */
  eyebrow?: string;
  params: { label: string; value: string }[];
  /** Display results as KPI cards (max 4) when 1-4 entries, else as a list */
  results: { label: string; value: string }[];
  table?: { head: string[]; body: (string | number)[][] };
  recommendations?: string[];
  /** Date string already formatted */
  generatedAt: string;
}

/* ── Wordmark component ───────────────────────────────────────────── */

/** Wordmark "NFI Report" avec N et R en Playfair, reste en Inter. */
function Wordmark() {
  return (
    <View style={styles.wordmarkRow}>
      <Text style={styles.wordmarkN}>N</Text>
      <Text style={styles.wordmarkMain}>FI Repo</Text>
      <Text style={styles.wordmarkR}>r</Text>
      <Text style={styles.wordmarkMain}>t</Text>
    </View>
  );
}

/* ── Main document ────────────────────────────────────────────────── */

export function ToolPdfDocument({ data }: { data: ToolPdfData }) {
  const { title, eyebrow, params, results, table, recommendations, generatedAt } = data;

  // KPI cards format if 2-4 results, otherwise list format
  const resultsAsCards = results.length >= 2 && results.length <= 4;

  return (
    <Document
      title={`NFI Report, ${sanitize(title)}`}
      author="NFI Report"
      subject={sanitize(title)}
      keywords="Niger, finance, simulateur, NFI Report"
    >
      <Page size="A4" style={styles.page}>
        {/* Header (page 1 only via not fixed) */}
        <View style={styles.header}>
          <Wordmark />
          <Text style={styles.headerDate}>{sanitize(generatedAt)}</Text>
        </View>

        {/* Page title */}
        {eyebrow && <Text style={styles.pageTitleEyebrow}>{sanitize(eyebrow)}</Text>}
        <Text style={styles.pageTitle}>{sanitize(title)}</Text>

        {/* Parameters list, indivisible block */}
        <View wrap={false} style={{ marginBottom: PDF_SPACING.sectionGap }} minPresenceAhead={40}>
          <Text style={styles.sectionTitle}>Paramètres de la simulation</Text>
          <View style={styles.paramsList}>
            {params.map((p, i) => (
              <View
                key={`${i}-${p.label}`}
                style={i === params.length - 1 ? styles.paramRowLast : styles.paramRow}
              >
                <Text style={styles.paramLabel}>{sanitize(p.label)}</Text>
                <Text style={styles.paramValue}>{sanitize(p.value)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Results, indivisible block */}
        <View wrap={false} style={{ marginBottom: PDF_SPACING.sectionGap }} minPresenceAhead={40}>
          <Text style={styles.sectionTitle}>Résultats</Text>
          {resultsAsCards ? (
            <View style={styles.cardGrid}>
              {results.map((r, i) => (
                <View key={`${i}-${r.label}`} style={styles.card} wrap={false}>
                  <Text style={styles.cardLabel}>{sanitize(r.label)}</Text>
                  <Text style={styles.cardValue}>{sanitize(r.value)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.paramsList}>
              {results.map((r, i) => (
                <View
                  key={`${i}-${r.label}`}
                  style={i === results.length - 1 ? styles.paramRowLast : styles.paramRow}
                >
                  <Text style={styles.paramLabel}>{sanitize(r.label)}</Text>
                  <Text style={styles.paramValue}>{sanitize(r.value)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Detail table (can split across pages, but header repeats) */}
        {table && table.body.length > 0 && (
          <View style={{ marginBottom: PDF_SPACING.sectionGap }} minPresenceAhead={60}>
            <Text style={styles.sectionTitle}>Détail</Text>
            <View style={styles.table}>
              <View style={styles.tableHead} fixed>
                {table.head.map((cell, i) => (
                  <Text key={`th-${i}`} style={styles.tableHeadCell}>
                    {sanitize(cell)}
                  </Text>
                ))}
              </View>
              {table.body.map((row, i) => (
                <View
                  key={`tr-${i}`}
                  style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                  wrap={false}
                >
                  {row.map((cell, j) => (
                    <Text key={`td-${i}-${j}`} style={styles.tableCell}>
                      {sanitize(String(cell))}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <View minPresenceAhead={60} style={{ marginBottom: PDF_SPACING.sectionGap }}>
            <Text style={styles.sectionTitle}>Recommandations</Text>
            {recommendations.map((rec, i) => (
              <View key={`rec-${i}`} style={styles.recItem} wrap={false}>
                <Text style={styles.recBullet}>•</Text>
                <Text style={styles.recText}>{sanitize(rec)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>{PDF_DISCLAIMER}</Text>

        {/* Slogan on last page only */}
        <Text
          style={styles.slogan}
          render={({ pageNumber, totalPages }) =>
            pageNumber === totalPages ? PDF_SLOGAN : ''
          }
        />

        {/* Footer fixed on every page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>nfireport.com</Text>
          <Text
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
