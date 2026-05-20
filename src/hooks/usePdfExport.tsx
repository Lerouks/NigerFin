'use client';

import { useCallback } from 'react';

/**
 * Hook d'export PDF des outils, AVEC import dynamique de @react-pdf/renderer.
 *
 * Pourquoi : @react-pdf/renderer et ToolPdfDocument pesent environ 400-500 KB
 * gzip a l'analyse bundle, sans utilite tant que l'utilisateur ne clique pas
 * "Telecharger en PDF". L'import statique forcait ce poids dans le chunk de
 * chaque outil Premium (LCP en souffrait sur 4G/3G). On l'isole via import()
 * dynamique dans generate() : webpack cree un chunk separe, charge a la
 * demande au moment du clic uniquement.
 *
 * Design PDF :
 * - Helvetica built-in (pas de fonts custom a fetcher)
 * - Wordmark NFI Report, meta grid noire, hierarchie editoriale
 * - Personnalisation client Premium (Etabli pour M./Mme Nom)
 * - Reference stable type NFI-YYYY-NNNN injectee par /api/tools/pdf-create
 */

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

export function usePdfExport() {
  const generate = useCallback(async (opts: PdfExportOptions) => {
    // Import dynamique : @react-pdf/renderer + ToolPdfDocument arrivent
    // dans un chunk separe (lazy), chargement uniquement au clic.
    const [{ pdf }, { ToolPdfDocument, registerPdfFonts }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/components/pdf/ToolPdfDocument'),
    ]);

    registerPdfFonts();

    const data = {
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
