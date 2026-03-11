'use client';

import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/** Replace narrow no-break space (U+202F) and non-breaking space (U+00A0) with regular spaces so jsPDF can render them. */
function sanitize(s: string): string {
  return s.replace(/[\u00A0\u202F]/g, ' ');
}

function fmtFCFA(n: number): string {
  return sanitize(Math.round(n).toLocaleString('fr-FR')) + ' FCFA';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function fmtDate(): string {
  const now = new Date();
  const d = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  return `Généré le ${d} à ${h}h${m}`;
}

function isoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const DISCLAIMER =
  'Les simulations produites par NFI REPORT sont fournies à titre purement indicatif. ' +
  'Elles ne constituent en aucun cas un conseil financier, fiscal ou juridique. ' +
  'NFI REPORT ne saurait être tenu responsable des décisions prises sur la base de ces résultats.';

export interface PdfExportOptions {
  title: string;
  params: { label: string; value: string }[];
  results: { label: string; value: string }[];
  table?: { head: string[]; body: (string | number)[][] };
}

export function usePdfExport() {
  const generate = useCallback((opts: PdfExportOptions) => {
    const { title, params, results, table } = opts;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const marginL = 20;
    const marginR = 20;
    const contentW = pageW - marginL - marginR;

    // -- Helper to add footer on every page --
    const addFooter = () => {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageH = doc.internal.pageSize.getHeight();
        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(marginL, pageH - 20, pageW - marginR, pageH - 20);
        // Disclaimer
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(153, 153, 153);
        const disclaimerLines = doc.splitTextToSize(DISCLAIMER, contentW);
        doc.text(disclaimerLines, marginL, pageH - 16);
        // Center text
        doc.setFontSize(8);
        doc.text('NFI REPORT — nfireport.com', pageW / 2, pageH - 8, { align: 'center' });
        // Page number
        doc.text(`Page ${i}/${pageCount}`, pageW - marginR, pageH - 8, { align: 'right' });
      }
    };

    let y = 20;

    // -- Header --
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(17, 17, 17);
    doc.text('NFI REPORT', marginL, y);

    // Date on right
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text(fmtDate(), pageW - marginR, y, { align: 'right' });

    y += 4;
    doc.setDrawColor(17, 17, 17);
    doc.setLineWidth(0.8);
    doc.line(marginL, y, pageW - marginR, y);

    y += 8;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(17, 17, 17);
    doc.text(title, marginL, y);
    y += 10;

    // -- Parameters table --
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text('Paramètres de la simulation', marginL, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['Paramètre', 'Valeur']],
      body: params.map((p) => [sanitize(p.label), sanitize(p.value)]),
      headStyles: {
        fillColor: [17, 17, 17],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        font: 'Helvetica',
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [17, 17, 17],
        font: 'Helvetica',
      },
      alternateRowStyles: {
        fillColor: [249, 249, 249],
      },
      styles: {
        cellPadding: 4,
        lineWidth: 0,
      },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // -- Results table --
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text('Résultats', marginL, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['Indicateur', 'Valeur']],
      body: results.map((r) => [sanitize(r.label), sanitize(r.value)]),
      headStyles: {
        fillColor: [17, 17, 17],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        font: 'Helvetica',
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [17, 17, 17],
        font: 'Helvetica',
      },
      alternateRowStyles: {
        fillColor: [249, 249, 249],
      },
      styles: {
        cellPadding: 4,
        lineWidth: 0,
      },
    });

    // -- Detail table (amortization etc.) --
    if (table && table.body.length > 0) {
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(17, 17, 17);
      doc.text('Détail', marginL, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        margin: { left: marginL, right: marginR },
        head: [table.head],
        body: table.body.map((row) => row.map((cell) => sanitize(String(cell)))),
        headStyles: {
          fillColor: [17, 17, 17],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          font: 'Helvetica',
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [17, 17, 17],
          font: 'Helvetica',
        },
        alternateRowStyles: {
          fillColor: [249, 249, 249],
        },
        styles: {
          cellPadding: 3,
          lineWidth: 0,
        },
      });
    }

    // -- Footer on all pages --
    addFooter();

    // -- Save --
    const filename = `nfireport-${slugify(title)}-${isoDate()}.pdf`;
    doc.save(filename);
  }, []);

  return { generate, fmtFCFA };
}
