// Génère des screenshots de la newsletter sur 3 viewports.
// Pré-requis : test-results/newsletter/001-demo.html (généré par `npm test`).
//
// Usage: node e2e/newsletter-screenshots.mjs

import { chromium } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';

const HTML_PATH = path.resolve(process.cwd(), 'test-results/newsletter/001-demo.html');
const OUTPUT_DIR = path.resolve(process.cwd(), 'test-results/newsletter');
const FILE_URL = pathToFileURL(HTML_PATH).toString();

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 1600 },
  { name: 'tablet', width: 768, height: 1400 },
  { name: 'mobile', width: 375, height: 1400 },
];

await mkdir(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto(FILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);
    const out = path.join(OUTPUT_DIR, `screenshot-${vp.name}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`✓ ${vp.name}: ${out}`);
    await context.close();
  }
} finally {
  await browser.close();
}
