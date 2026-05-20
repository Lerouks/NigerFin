'use client';

import { useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { ToolPdfDocument, registerPdfFonts, type ToolPdfData } from '@/components/pdf/ToolPdfDocument';

/** Replace narrow no-break space (U+202F) and non-breaking space (U+00A0) with regular spaces. */
function sanitize(s: string): string {
  return s.replace(/[  ]/g, ' ');
}

function fmtFCFA(n: number): string {
  return sanitize(Math.round(n).toLocaleString('fr-FR')) + ' FCFA';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function fmtDate(): string {
  const now = new Date();
  const d = now.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  return `Généré le ${d} à ${h}h${m}`;
}

function isoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface PdfExportOptions {
  title: string;
  eyebrow?: string;
  params: { label: string; value: string }[];
  results: { label: string; value: string }[];
  table?: { head: string[]; body: (string | number)[][] };
  recommendations?: string[];
  /** Civilite du client Premium (M. ou Mme), injectee par PdfDownloadButton via /api/tools/pdf-create */
  recipientCivility?: 'M.' | 'Mme' | null;
  /** Nom de famille du client Premium pour personnalisation (Etabli pour) */
  recipientName?: string;
  /** Reference stable type NFI-YYYY-NNNN (compteur par utilisateur) */
  reference?: string;
}

/**
 * Hook d'export PDF pour les outils du site.
 * Renvoie une fonction `generate` qui crée un PDF React-PDF et le télécharge.
 *
 * Migration de jsPDF vers React-PDF (mai 2026) :
 * - Fonts custom (Inter, Montserrat, Playfair) servies depuis /public/fonts/
 * - Wordmark NFI Report avec N et R en Playfair
 * - Pagination propre via wrap={false} et minPresenceAhead
 * - Footer fixed avec nfireport.com + Page X / Y
 * - Slogan La connaissance, votre meilleur capital en dernière page
 */
export function usePdfExport() {
  const generate = useCallback(async (opts: PdfExportOptions) => {
    // Register fonts lazy on first generate (browser-side only, after window is ready)
    registerPdfFonts();

    const data: ToolPdfData = {
      title: opts.title,
      eyebrow: opts.eyebrow,
      params: opts.params,
      results: opts.results,
      table: opts.table,
      recommendations: opts.recommendations,
      generatedAt: fmtDate(),
      recipientCivility: opts.recipientCivility ?? null,
      recipientName: opts.recipientName ?? '',
      reference: opts.reference,
    };

    const blob = await pdf(<ToolPdfDocument data={data} />).toBlob();
    const url = URL.createObjectURL(blob);

    const filename = `nfireport-${slugify(opts.title)}-${isoDate()}.pdf`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  return { generate, fmtFCFA };
}
