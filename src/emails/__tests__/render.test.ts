import { describe, it, expect, beforeAll } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderPremiumBriefingHtml, renderPremiumBriefingText } from '../render';
import { issue001Demo } from '@/data/newsletter-issues/001-fictif';

const SITE_URL = 'https://nfireport.com';
const OUTPUT_DIR = path.resolve(process.cwd(), 'test-results/newsletter');

let html = '';
let plainText = '';

describe('PremiumBriefing render', () => {
  beforeAll(async () => {
    html = await renderPremiumBriefingHtml({
      issue: issue001Demo,
      siteUrl: SITE_URL,
      managePreferencesUrl: `${SITE_URL}/compte`,
      unsubscribeUrl: `${SITE_URL}/compte`,
      socials: {
        instagram: 'https://www.instagram.com/nfireport',
        facebook: 'https://www.facebook.com/nfireport',
      },
    });
    plainText = renderPremiumBriefingText(issue001Demo, SITE_URL);

    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(path.join(OUTPUT_DIR, '001-demo.html'), html, 'utf8');
    await writeFile(path.join(OUTPUT_DIR, '001-demo.txt'), plainText, 'utf8');
  });

  it('produces a non-empty HTML document', () => {
    expect(html.length).toBeGreaterThan(2000);
    expect(html).toMatch(/<!DOCTYPE html/i);
    expect(html).toContain('lang="fr"');
  });

  it('contains the issue subject and preheader', () => {
    expect(html).toContain('Premium Briefing');
    expect(html).toContain('Édition de démonstration');
    expect(html).toMatch(/<title>.*Premium Briefing n°01/i);
  });

  it('renders the Niger SVG accent', () => {
    expect(html).toContain('viewBox="0 0 1000 748"');
  });

  it('renders all market rows', () => {
    expect(html).toContain('BRVM Composite');
    expect(html).toContain('EUR / XOF');
    expect(html).toContain('655,957');
  });

  it('renders both headlines and the digest items', () => {
    expect(html).toContain('Pourquoi ça compte');
    expect(html).toContain('Ce que ça veut dire');
    expect(html).toContain('Mobile money');
  });

  it('produces a plain-text fallback', () => {
    expect(plainText.length).toBeGreaterThan(500);
    expect(plainText).toContain('NFI REPORT');
    expect(plainText).toContain('TABLEAU DE BORD');
    expect(plainText).toContain('BRVM Composite');
  });

  it('escapes raw HTML in plain text fallback', () => {
    expect(plainText).not.toContain('<strong>');
    expect(plainText).not.toContain('<br>');
  });
});
