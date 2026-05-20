import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Disable mid-word hyphenation (avoid "im-mobilier" breaks on long French words)
Font.registerHyphenationCallback((word) => [word]);
import {
  PDF_COLORS,
  PDF_FONT,
  PDF_SIZE,
  PDF_SPACING,
  PDF_BORDER_RADIUS,
  PDF_SLOGAN,
  PDF_DISCLAIMER,
  PDF_BRAND_NAME,
  PDF_BRAND_TAG,
  PDF_SITE,
} from './tokens';

/**
 * Stub conservé pour compat avec les imports existants.
 * Plus de fonts custom à charger : on utilise Helvetica built-in
 * (pas de fetch, pas de CORS, pas de risque de rendu cassé).
 */
export function registerPdfFonts(): void {
  // no-op
}

/** Remplace les caractères qui posent problème dans React-PDF. */
function sanitize(s: string): string {
  return s
    .replace(/[  ]/g, ' ')
    .replace(/—/g, ', ')
    .replace(/–/g, '-');
}

const styles = StyleSheet.create({
  page: {
    paddingTop: PDF_SPACING.pageMarginTop,
    paddingBottom: PDF_SPACING.pageMarginBottom,
    paddingHorizontal: PDF_SPACING.pageMarginX,
    fontFamily: PDF_FONT.regular,
    fontSize: PDF_SIZE.body,
    color: PDF_COLORS.ink,
    lineHeight: PDF_SPACING.bodyLineHeight,
    backgroundColor: PDF_COLORS.paper,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.divider,
    borderBottomStyle: 'solid',
  },
  brandBlock: {
    maxWidth: 220,
  },
  brandName: {
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
    fontSize: PDF_SIZE.brand,
    letterSpacing: 3,
    color: PDF_COLORS.ink,
  },
  brandTag: {
    fontSize: PDF_SIZE.brandTag,
    color: PDF_COLORS.mutedLight,
    letterSpacing: 1,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  docTitleBox: {
    textAlign: 'right',
    flex: 1,
    paddingLeft: 24,
  },
  docEyebrow: {
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
    fontSize: PDF_SIZE.eyebrow,
    color: PDF_COLORS.mutedLight,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  docTitle: {
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
    fontSize: PDF_SIZE.docTitle,
    letterSpacing: -0.5,
    color: PDF_COLORS.ink,
    lineHeight: PDF_SPACING.titleLineHeight,
  },
  docRef: {
    fontSize: PDF_SIZE.docRef,
    color: PDF_COLORS.muted,
    marginTop: 6,
    letterSpacing: 0.3,
  },

  /* Meta grid noir (date + source) */
  metaGrid: {
    backgroundColor: PDF_COLORS.ink,
    borderRadius: PDF_BORDER_RADIUS.card,
    padding: PDF_SPACING.metaPadding,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: PDF_SPACING.sectionGap,
  },
  metaItem: {
    flexGrow: 1,
    flexBasis: 0,
    paddingHorizontal: 4,
  },
  metaLabel: {
    fontSize: PDF_SIZE.metaLabel,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  metaValue: {
    color: '#ffffff',
    fontSize: PDF_SIZE.meta,
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
  },

  /* Section title */
  sectionTitle: {
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
    fontSize: PDF_SIZE.sectionTitle,
    color: PDF_COLORS.ink,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 14,
  },

  /* Hero KPI (1 résultat unique) */
  hero: {
    marginBottom: PDF_SPACING.sectionGap,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.divider,
    borderBottomStyle: 'solid',
  },
  heroLabel: {
    fontSize: PDF_SIZE.metaLabel,
    color: PDF_COLORS.mutedLight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
  },
  heroValue: {
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
    fontSize: PDF_SIZE.heroValue,
    color: PDF_COLORS.ink,
    letterSpacing: -0.8,
    lineHeight: 1.1,
  },

  /* Cards (2-4 résultats) */
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: PDF_SPACING.sectionGap,
  },
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: PDF_COLORS.paperSoft,
    borderRadius: PDF_BORDER_RADIUS.card,
    padding: PDF_SPACING.cardPadding,
  },
  cardLabel: {
    fontSize: PDF_SIZE.metaLabel,
    color: PDF_COLORS.mutedLight,
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardValue: {
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
    fontSize: PDF_SIZE.cardValue,
    color: PDF_COLORS.ink,
    letterSpacing: -0.3,
  },

  /* Liste paramètres / résultats (5+) */
  list: {
    marginBottom: PDF_SPACING.sectionGap,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.dividerLight,
    borderBottomStyle: 'solid',
  },
  listRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 9,
  },
  listLabel: {
    color: PDF_COLORS.muted,
    fontSize: PDF_SIZE.body,
  },
  listValue: {
    color: PDF_COLORS.ink,
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
    fontSize: PDF_SIZE.body,
  },

  /* Table */
  table: {
    marginBottom: PDF_SPACING.sectionGap,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.paperSoft,
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.ink,
    borderBottomStyle: 'solid',
  },
  tableHeaderCell: {
    flexGrow: 1,
    flexBasis: 0,
    fontSize: PDF_SIZE.tableHead - 0.5,
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
    color: PDF_COLORS.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.dividerLight,
    borderBottomStyle: 'solid',
  },
  tableCell: {
    flexGrow: 1,
    flexBasis: 0,
    fontSize: PDF_SIZE.tableCell,
    color: PDF_COLORS.ink,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  /* Recommandations */
  recItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 0,
  },
  recRule: {
    width: 14,
    color: PDF_COLORS.mutedLight,
    fontSize: PDF_SIZE.body,
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
  },
  recText: {
    flex: 1,
    color: PDF_COLORS.inkSoft,
    fontSize: PDF_SIZE.body,
    lineHeight: PDF_SPACING.bodyLineHeight,
  },

  /* Disclaimer (notice Apple-style) */
  disclaimer: {
    marginTop: 10,
    padding: 14,
    backgroundColor: PDF_COLORS.warningBg,
    borderLeftWidth: 3,
    borderLeftColor: PDF_COLORS.warning,
    borderLeftStyle: 'solid',
  },
  disclaimerText: {
    fontSize: PDF_SIZE.micro + 0.5,
    color: PDF_COLORS.warningInk,
    lineHeight: PDF_SPACING.bodyLineHeight,
  },

  /* Slogan (dernière page seulement) */
  slogan: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: PDF_SIZE.micro,
    color: PDF_COLORS.mutedLight,
    letterSpacing: 0.4,
    fontFamily: PDF_FONT.italic,
  },

  /* Footer fixed */
  footer: {
    position: 'absolute',
    left: PDF_SPACING.pageMarginX,
    right: PDF_SPACING.pageMarginX,
    bottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.dividerLight,
    borderTopStyle: 'solid',
  },
  footerText: {
    fontSize: PDF_SIZE.footer,
    color: PDF_COLORS.mutedLight,
    letterSpacing: 0.2,
  },
  footerBrand: {
    fontFamily: PDF_FONT.bold,
    fontWeight: 700,
    color: PDF_COLORS.muted,
    letterSpacing: 1,
  },
});

export interface ToolPdfData {
  title: string;
  eyebrow?: string;
  params: { label: string; value: string }[];
  results: { label: string; value: string }[];
  table?: { head: string[]; body: (string | number)[][] };
  recommendations?: string[];
  generatedAt: string;
}

/** Génère un numéro de référence court à partir d'un timestamp ISO. */
function refFromDate(): string {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(now.getTime()).slice(-4);
  return `${y}${m}${d}-${rand}`;
}

export function ToolPdfDocument({ data }: { data: ToolPdfData }) {
  const { title, eyebrow, params, results, table, recommendations, generatedAt } = data;
  const docRef = refFromDate();

  const hasHero = results.length === 1;
  const hasCards = results.length >= 2 && results.length <= 4;
  const heroResult = results[0];

  return (
    <Document
      title={`NFI Report, ${sanitize(title)}`}
      author="NFI Report"
      subject={sanitize(title)}
      keywords="Niger, finance, simulateur, NFI Report"
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>{PDF_BRAND_NAME}</Text>
            <Text style={styles.brandTag}>{PDF_BRAND_TAG}</Text>
          </View>
          <View style={styles.docTitleBox}>
            {eyebrow && <Text style={styles.docEyebrow}>{sanitize(eyebrow)}</Text>}
            <Text style={styles.docTitle}>{sanitize(title)}</Text>
            <Text style={styles.docRef}>Référence {docRef}</Text>
          </View>
        </View>

        {/* META GRID NOIR */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Généré le</Text>
            <Text style={styles.metaValue}>{sanitize(generatedAt.replace(/^Généré le /, ''))}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Source</Text>
            <Text style={styles.metaValue}>{PDF_SITE}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Format</Text>
            <Text style={styles.metaValue}>Simulation Premium</Text>
          </View>
        </View>

        {/* RÉSULTAT(S) */}
        <View wrap={false} minPresenceAhead={60}>
          <Text style={styles.sectionTitle}>Résultat{results.length > 1 ? 's' : ''}</Text>
          {hasHero && heroResult && (
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>{sanitize(heroResult.label)}</Text>
              <Text style={styles.heroValue}>{sanitize(heroResult.value)}</Text>
            </View>
          )}
          {hasCards && (
            <View style={styles.cardGrid}>
              {results.map((r, i) => (
                <View key={`${i}-${r.label}`} style={styles.card} wrap={false}>
                  <Text style={styles.cardLabel}>{sanitize(r.label)}</Text>
                  <Text style={styles.cardValue}>{sanitize(r.value)}</Text>
                </View>
              ))}
            </View>
          )}
          {!hasHero && !hasCards && (
            <View style={styles.list}>
              {results.map((r, i) => (
                <View
                  key={`${i}-${r.label}`}
                  style={i === results.length - 1 ? styles.listRowLast : styles.listRow}
                >
                  <Text style={styles.listLabel}>{sanitize(r.label)}</Text>
                  <Text style={styles.listValue}>{sanitize(r.value)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* PARAMÈTRES */}
        <View wrap={false} minPresenceAhead={60}>
          <Text style={styles.sectionTitle}>Paramètres de la simulation</Text>
          <View style={styles.list}>
            {params.map((p, i) => (
              <View
                key={`${i}-${p.label}`}
                style={i === params.length - 1 ? styles.listRowLast : styles.listRow}
              >
                <Text style={styles.listLabel}>{sanitize(p.label)}</Text>
                <Text style={styles.listValue}>{sanitize(p.value)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* DÉTAIL */}
        {table && table.body.length > 0 && (
          <View style={{ marginBottom: PDF_SPACING.sectionGap }} minPresenceAhead={80}>
            <Text style={styles.sectionTitle}>Détail</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow} fixed>
                {table.head.map((cell, i) => (
                  <Text key={`th-${i}`} style={styles.tableHeaderCell}>
                    {sanitize(cell)}
                  </Text>
                ))}
              </View>
              {table.body.map((row, i) => (
                <View key={`tr-${i}`} style={styles.tableRow} wrap={false}>
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

        {/* RECOMMANDATIONS */}
        {recommendations && recommendations.length > 0 && (
          <View minPresenceAhead={80} style={{ marginBottom: PDF_SPACING.sectionGap }}>
            <Text style={styles.sectionTitle}>Recommandations</Text>
            {recommendations.map((rec, i) => (
              <View key={`rec-${i}`} style={styles.recItem} wrap={false}>
                <Text style={styles.recRule}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={styles.recText}>{sanitize(rec)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* DISCLAIMER */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{PDF_DISCLAIMER}</Text>
        </View>

        {/* SLOGAN (apparait apres le disclaimer, donc sur la derniere page naturellement) */}
        <Text style={styles.slogan}>{PDF_SLOGAN}</Text>

        {/* FOOTER FIXED, brand + site */}
        <View style={styles.footer} fixed>
          <Text style={[styles.footerText, styles.footerBrand]}>{PDF_BRAND_NAME}</Text>
          <Text style={styles.footerText}>{PDF_SITE}</Text>
        </View>

      </Page>
    </Document>
  );
}
