import * as React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Invoice } from '@/types/invoice';

/**
 * Format an integer amount in FCFA with thin-space thousand separators.
 * Example : 1234567 -> "1 234 567 FCFA"
 */
function formatXof(amount: number): string {
  return amount.toLocaleString('fr-FR').replace(/ /g, ' ').replace(/ /g, ' ') + ' FCFA';
}

function formatDateFR(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function recipientLabelFor(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('facture') || t.includes('invoice')) return 'Facturé à';
  if (t.includes('devis') || t.includes('quote')) return 'Client';
  if (t.includes('achat') || t.includes('purchase')) return 'Fournisseur';
  return 'Destinataire';
}

const colors = {
  ink: '#1d1d1f',
  inkSoft: '#3a3a3c',
  muted: '#6e6e73',
  mutedLight: '#86868b',
  divider: '#d2d2d7',
  dividerLight: '#e5e5e7',
  paper: '#f5f5f7',
  positive: '#16a34a',
  negative: '#dc2626',
  warning: '#d97706',
  warningBg: '#fff9eb',
  warningInk: '#5c4308',
};

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: colors.ink,
    lineHeight: 1.55,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    borderBottomStyle: 'solid',
  },
  brandName: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 3,
    color: colors.ink,
    fontFamily: 'Helvetica-Bold',
  },
  brandTag: {
    fontSize: 8,
    color: colors.mutedLight,
    letterSpacing: 1,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  docTitleBox: { textAlign: 'right' },
  docTitle: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.5,
    color: colors.ink,
  },
  docRef: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
    letterSpacing: 0.4,
  },
  parties: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  partyBlock: { flex: 1, paddingRight: 24 },
  partyLabel: {
    fontSize: 7.5,
    color: colors.mutedLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: 700,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'Helvetica-Bold',
    color: colors.ink,
    marginBottom: 4,
  },
  partyDetail: {
    fontSize: 9.5,
    color: colors.inkSoft,
    lineHeight: 1.55,
  },
  metaGrid: {
    backgroundColor: colors.ink,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 22,
  },
  metaItem: { width: '25%', paddingHorizontal: 4 },
  metaLabel: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  metaValue: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: 700,
    fontFamily: 'Helvetica-Bold',
  },
  description: {
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'Helvetica-Bold',
    color: colors.ink,
    marginBottom: 12,
  },
  table: {
    marginBottom: 18,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
    borderBottomStyle: 'solid',
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 700,
    fontFamily: 'Helvetica-Bold',
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderCellRight: { textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerLight,
    borderBottomStyle: 'solid',
  },
  tableCell: {
    fontSize: 10,
    color: colors.ink,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableCellSubtle: {
    fontSize: 9,
    color: colors.inkSoft,
    marginTop: 2,
  },
  tableCellNum: { textAlign: 'right' },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 6,
    gap: 16,
  },
  paymentInfo: {
    flex: 1,
    maxWidth: 260,
    backgroundColor: colors.paper,
    borderRadius: 8,
    padding: 14,
  },
  paymentInfoLabel: {
    fontSize: 7.5,
    color: colors.mutedLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 700,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  paymentInfoText: {
    fontSize: 9,
    color: colors.inkSoft,
    lineHeight: 1.55,
  },
  totalsBox: { width: 220 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalLabel: { color: colors.muted, fontSize: 10 },
  totalValue: { color: colors.ink, fontSize: 10 },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
    borderTopStyle: 'solid',
  },
  grandLabel: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grandValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'Helvetica-Bold',
  },
  notice: {
    marginTop: 18,
    padding: 12,
    backgroundColor: colors.warningBg,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    borderLeftStyle: 'solid',
  },
  noticeText: {
    fontSize: 8.5,
    color: colors.warningInk,
    lineHeight: 1.55,
  },
  noticeBold: {
    fontFamily: 'Helvetica-Bold',
    fontWeight: 700,
  },
  digitalNotice: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 8,
    color: colors.mutedLight,
    fontStyle: 'italic',
    letterSpacing: 0.4,
  },
  legalFooter: {
    position: 'absolute',
    left: 56,
    right: 56,
    bottom: 28,
    textAlign: 'center',
    fontSize: 7.5,
    color: colors.mutedLight,
    lineHeight: 1.7,
    letterSpacing: 0.2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.dividerLight,
    borderTopStyle: 'solid',
  },
  legalFooterBrand: {
    fontWeight: 700,
    fontFamily: 'Helvetica-Bold',
    color: colors.muted,
  },
  stampWrap: {
    position: 'absolute',
    top: 130,
    right: 60,
    transform: 'rotate(-15deg)',
  },
  stamp: {
    borderWidth: 3,
    borderStyle: 'solid',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  stampText: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  stampPaid: { borderColor: colors.positive },
  stampPaidText: { color: colors.positive },
  stampCancelled: { borderColor: colors.negative },
  stampCancelledText: { color: colors.negative },
});

export interface InvoicePdfProps {
  invoice: Invoice;
}

export function InvoicePdf({ invoice }: InvoicePdfProps) {
  const title = 'FACTURE';
  const billingLabel = invoice.billingCycle === 'annual'
    ? 'annuel'
    : invoice.billingCycle === 'semi_annual'
      ? 'semestriel'
      : 'mensuel';

  const showStamp = invoice.status === 'paid' || invoice.status === 'cancelled' || invoice.status === 'refunded';
  const stampText = invoice.status === 'paid'
    ? 'PAYÉ'
    : invoice.status === 'cancelled'
      ? 'ANNULÉ'
      : 'REMBOURSÉ';
  const stampStyle = invoice.status === 'paid' ? styles.stampPaid : styles.stampCancelled;
  const stampTextStyle = invoice.status === 'paid' ? styles.stampPaidText : styles.stampCancelledText;

  const issuerAddress = `${invoice.issuer.address}\n${invoice.issuer.city}, ${invoice.issuer.country}\n${invoice.issuer.email}\n${invoice.issuer.phone}`;
  const customerAddress = [
    invoice.customer.email,
    invoice.customer.phone,
    invoice.customer.address,
    invoice.customer.city && invoice.customer.country
      ? `${invoice.customer.city}, ${invoice.customer.country}`
      : invoice.customer.city || invoice.customer.country,
  ]
    .filter(Boolean)
    .join('\n');

  const subtotal = invoice.lineItems.reduce((sum, l) => sum + l.totalXof, 0);

  const legalFooterText = [
    invoice.issuer.name,
    invoice.issuer.capitalXof
      ? `SARL au capital de ${formatXof(invoice.issuer.capitalXof).replace(' FCFA', ' FCFA')}`
      : null,
    `Siège : ${invoice.issuer.address}, ${invoice.issuer.city}, ${invoice.issuer.country}`,
    invoice.issuer.rccm ? `RCCM : ${invoice.issuer.rccm}` : null,
    invoice.issuer.niu ? `NIU : ${invoice.issuer.niu}` : null,
    `Tél. ${invoice.issuer.phone}`,
    invoice.issuer.email,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Document title={`${invoice.issuer.name} - ${title} - ${invoice.invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>NFI REPORT</Text>
            <Text style={styles.brandTag}>Actualités économiques et financières du Niger</Text>
          </View>
          <View style={styles.docTitleBox}>
            <Text style={styles.docTitle}>{title}</Text>
            <Text style={styles.docRef}>N° {invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* PARTIES */}
        <View style={styles.parties}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Émetteur</Text>
            <Text style={styles.partyName}>{invoice.issuer.name}</Text>
            <Text style={styles.partyDetail}>{issuerAddress}</Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>{recipientLabelFor(title)}</Text>
            <Text style={styles.partyName}>{invoice.customer.name}</Text>
            <Text style={styles.partyDetail}>{customerAddress}</Text>
          </View>
        </View>

        {/* META GRID NOIR */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{"Date d'émission"}</Text>
            <Text style={styles.metaValue}>{formatDateFR(invoice.createdAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Échéance</Text>
            <Text style={styles.metaValue}>{formatDateFR(invoice.paidAt ?? invoice.createdAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Devise</Text>
            <Text style={styles.metaValue}>{invoice.currency} (XOF)</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Mode</Text>
            <Text style={styles.metaValue}>{invoice.paymentMethod ?? '—'}</Text>
          </View>
        </View>

        {/* DESCRIPTION */}
        <Text style={styles.description}>{invoice.description}</Text>

        {/* TABLE */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellRight, { width: 100 }]}>Montant</Text>
          </View>
          {invoice.lineItems.map((line, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={[{ flex: 1 }]}>
                <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold', fontWeight: 700, paddingBottom: 0 }]}>{line.description}</Text>
                {line.qty > 1 ? (
                  <Text style={[styles.tableCell, styles.tableCellSubtle, { paddingTop: 0 }]}>
                    {line.qty} × {formatXof(line.unitPriceXof)}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.tableCell, styles.tableCellNum, { width: 100 }]}>{formatXof(line.totalXof)}</Text>
            </View>
          ))}
        </View>

        {/* PAYMENT INFO + TOTALS */}
        <View style={styles.bottomRow}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentInfoLabel}>Règlement</Text>
            <Text style={styles.paymentInfoText}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontWeight: 700, color: colors.ink }}>{invoice.paymentMethod ?? 'Virement'}</Text>
              {invoice.paymentReference ? `\nRéférence : ${invoice.paymentReference}` : ''}
              {`\nStatut : ${invoice.status === 'paid' ? 'Réglé' : invoice.status === 'cancelled' ? 'Annulé' : invoice.status === 'refunded' ? 'Remboursé' : 'En attente'}`}
              {billingLabel ? `\nFormule : Premium ${billingLabel}` : ''}
            </Text>
          </View>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total</Text>
              <Text style={styles.totalValue}>{formatXof(subtotal)}</Text>
            </View>
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>Net à payer</Text>
              <Text style={styles.grandValue}>{formatXof(invoice.amountXof)}</Text>
            </View>
          </View>
        </View>

        {/* NOTICE OHADA */}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            <Text style={styles.noticeBold}>Conditions de règlement. </Text>
            {"En cas de retard de paiement, des pénalités conformes au taux d'intérêt légal UEMOA en vigueur et une indemnité forfaitaire de recouvrement seront appliquées conformément à la législation nigérienne."}
          </Text>
        </View>

        <Text style={styles.digitalNotice}>Document généré électroniquement, valide sans signature manuscrite.</Text>

        {/* STAMP */}
        {showStamp ? (
          <View style={styles.stampWrap}>
            <View style={[styles.stamp, stampStyle]}>
              <Text style={[styles.stampText, stampTextStyle]}>{stampText}</Text>
            </View>
          </View>
        ) : null}

        {/* LEGAL FOOTER */}
        <Text style={styles.legalFooter} fixed>
          <Text style={styles.legalFooterBrand}>{legalFooterText}</Text>
        </Text>
      </Page>
    </Document>
  );
}

export default InvoicePdf;
