import { render } from '@react-email/render';
import * as React from 'react';
import { PremiumBriefing, type PremiumBriefingProps } from './PremiumBriefing';
import type { NewsletterIssue } from './types';
import { getLiveMarketRows, getMarketSourceLine } from '@/lib/newsletter/market-sync';

/**
 * Rend la newsletter en HTML.
 * Le helper @react-email/render assure la compatibilité multi-clients
 * (Gmail, Outlook 365, Apple Mail, iOS Mail, Yahoo).
 */
export async function renderPremiumBriefingHtml(props: PremiumBriefingProps): Promise<string> {
  // Si l'issue a active autoSync sur les marches, on remplace les rows par les
  // valeurs vivantes de la table market_data (single source of truth = site).
  const issue = await maybeSyncMarketRows(props.issue);
  const html = await render(React.createElement(PremiumBriefing, { ...props, issue }), {
    pretty: false,
  });
  return html;
}

async function maybeSyncMarketRows(issue: NewsletterIssue): Promise<NewsletterIssue> {
  if (!issue.market?.autoSync) return issue;
  try {
    const liveRows = await getLiveMarketRows();
    if (liveRows.length === 0) return issue; // fallback gracieux
    const liveSource = await getMarketSourceLine();
    return {
      ...issue,
      market: {
        ...issue.market,
        rows: liveRows,
        source: liveSource || issue.market.source,
      },
    };
  } catch {
    // En cas d'erreur DB, on retombe sur les rows hardcodées (degradation gracieuse)
    return issue;
  }
}

/**
 * Plain-text fallback : essentiel pour la délivrabilité (filtres anti-spam)
 * et pour les clients sans support HTML (lecteurs d'écran, watch, etc.).
 */
export function renderPremiumBriefingText(issue: NewsletterIssue, siteUrl: string): string {
  const lines: string[] = [];
  lines.push('NFI REPORT - PREMIUM BRIEFING');
  lines.push(`Édition n°${String(issue.number).padStart(2, '0')} - ${issue.issueDateLabel}`);
  lines.push('');
  lines.push('- ' + issue.intro.heading.toUpperCase() + ' -');
  lines.push('');
  lines.push(issue.intro.paragraph);
  if (issue.intro.summary?.length) {
    lines.push('');
    lines.push('AU SOMMAIRE');
    issue.intro.summary.forEach((t) => lines.push(`  ${t.number}  ${stripHtml(t.label)}`));
  }
  lines.push('');
  lines.push('I · TABLEAU DE BORD');
  issue.market.rows.forEach((r) => {
    const sign = r.changePercent >= 0 ? '+' : '';
    lines.push(`  ${r.label.padEnd(18)} ${r.value}${r.unit ? ' ' + r.unit : ''}   ${sign}${r.changePercent.toFixed(2)}%`);
  });
  if (issue.market.source) lines.push(`Source : ${issue.market.source}`);
  lines.push('');

  if (issue.nigerKpi?.items?.length) {
    lines.push('-----------------');
    lines.push(`II · NIGER EN CHIFFRES - ${issue.nigerKpi.title ?? ''}`);
    issue.nigerKpi.items.forEach((k) => {
      lines.push(`  ${k.label.padEnd(28)} ${k.value}${k.unit ? ' ' + k.unit : ''}${k.delta ? '   (' + k.delta + ')' : ''}`);
    });
    lines.push('');
  }

  issue.headlines.forEach((h, idx) => {
    lines.push('-----------------');
    lines.push(`ANALYSE ${idx + 1} - ${stripHtml(h.title)}`);
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
    lines.push('-----------------');
    lines.push(`GRAPHIQUE : ${issue.chart.title}`);
    if (issue.chart.caption) lines.push(stripHtml(issue.chart.caption));
    lines.push('');
  }

  if (issue.digest?.items?.length) {
    lines.push('-----------------');
    lines.push(`EN BREF - ${issue.digest.title ?? 'Le digest'}`);
    issue.digest.items.forEach((d) => {
      lines.push(`  • ${stripHtml(d.title)} - ${stripHtml(d.body)}`);
    });
    lines.push('');
  }

  if (issue.quote) {
    lines.push('-----------------');
    lines.push(`« ${stripHtml(issue.quote.text)} »`);
    lines.push(`- ${issue.quote.author}${issue.quote.role ? ', ' + issue.quote.role : ''}`);
    lines.push('');
  }

  if (issue.radar?.items?.length) {
    lines.push('-----------------');
    lines.push(`SUR NOTRE RADAR - ${issue.radar.title ?? 'À retenir'}`);
    issue.radar.items.forEach((r, idx) => {
      lines.push(`  ${idx + 1}. ${stripHtml(r.title)}${r.hint ? ' - ' + stripHtml(r.hint) : ''}`);
    });
    lines.push('');
  }

  lines.push('-----------------');
  lines.push(`NFI Report - Niamey, Niger - ${siteUrl}`);
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
