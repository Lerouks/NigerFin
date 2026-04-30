import { render } from '@react-email/render';
import * as React from 'react';
import { PremiumBriefing, type PremiumBriefingProps } from './PremiumBriefing';
import type { NewsletterIssue } from './types';

/**
 * Rend la newsletter en HTML.
 * Le helper @react-email/render assure la compatibilité multi-clients
 * (Gmail, Outlook 365, Apple Mail, iOS Mail, Yahoo).
 */
export async function renderPremiumBriefingHtml(props: PremiumBriefingProps): Promise<string> {
  const html = await render(React.createElement(PremiumBriefing, props), {
    pretty: false,
  });
  return html;
}

/**
 * Plain-text fallback : essentiel pour la délivrabilité (filtres anti-spam)
 * et pour les clients sans support HTML (lecteurs d'écran, watch, etc.).
 */
export function renderPremiumBriefingText(issue: NewsletterIssue, siteUrl: string): string {
  const lines: string[] = [];
  lines.push('NFI REPORT — PREMIUM BRIEFING');
  lines.push(`Édition n°${String(issue.number).padStart(2, '0')} — ${issue.issueDateLabel}`);
  lines.push('');
  lines.push('— ' + issue.intro.heading.toUpperCase() + ' —');
  lines.push('');
  lines.push(issue.intro.paragraph);
  if (issue.intro.teasers?.length) {
    lines.push('');
    lines.push('AU PROGRAMME');
    issue.intro.teasers.forEach((t) => lines.push(`  • ${stripHtml(t)}`));
  }
  lines.push('');
  lines.push('TABLEAU DE BORD');
  issue.market.rows.forEach((r) => {
    const sign = r.changePercent >= 0 ? '+' : '';
    lines.push(`  ${r.label.padEnd(18)} ${r.value}${r.unit ? ' ' + r.unit : ''}   ${sign}${r.changePercent.toFixed(2)}%`);
  });
  if (issue.market.source) lines.push(`Source : ${issue.market.source}`);
  lines.push('');

  issue.headlines.forEach((h, idx) => {
    lines.push('—————————————————');
    lines.push(`ANALYSE ${idx + 1} — ${stripHtml(h.title)}`);
    lines.push('');
    lines.push('Ce qu’il se passe : ' + stripHtml(h.whatHappening));
    lines.push('');
    lines.push('Ce que ça veut dire : ' + stripHtml(h.whatItMeans));
    lines.push('');
    lines.push('Pourquoi ça compte : ' + stripHtml(h.whyCare));
    if (h.ctaLabel && h.ctaUrl) {
      lines.push('');
      lines.push(`→ ${h.ctaLabel} : ${h.ctaUrl}`);
    }
    lines.push('');
  });

  if (issue.chart) {
    lines.push('—————————————————');
    lines.push(`GRAPHIQUE : ${issue.chart.title}`);
    if (issue.chart.caption) lines.push(stripHtml(issue.chart.caption));
    lines.push('');
  }

  if (issue.digest?.items?.length) {
    lines.push('—————————————————');
    lines.push(`EN BREF — ${issue.digest.title ?? 'Le digest'}`);
    issue.digest.items.forEach((d) => {
      lines.push(`  • ${stripHtml(d.title)} — ${stripHtml(d.body)}`);
    });
    lines.push('');
  }

  if (issue.quote) {
    lines.push('—————————————————');
    lines.push(`« ${stripHtml(issue.quote.text)} »`);
    lines.push(`— ${issue.quote.author}${issue.quote.role ? ', ' + issue.quote.role : ''}`);
    lines.push('');
  }

  if (issue.radar?.items?.length) {
    lines.push('—————————————————');
    lines.push(`SUR NOTRE RADAR — ${issue.radar.title ?? 'À retenir'}`);
    issue.radar.items.forEach((r, idx) => {
      lines.push(`  ${idx + 1}. ${stripHtml(r.title)}${r.hint ? ' — ' + stripHtml(r.hint) : ''}`);
    });
    lines.push('');
  }

  lines.push('—————————————————');
  lines.push(`NFI Report — Niamey, Niger — ${siteUrl}`);
  lines.push('Cet e-mail vous est envoyé en tant qu’abonné Premium NFI Report.');

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&middot;/g, '·')
    .trim();
}
