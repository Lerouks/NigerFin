// Screenshot zoom de la couverture seule (les 1100 premiers pixels)
// pour faire ressortir le travail de typo / Niger / wordmark.

import { chromium } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HTML_PATH = path.resolve(process.cwd(), 'test-results/newsletter/001-demo.html');
const FILE_URL = pathToFileURL(HTML_PATH).toString();

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 720, height: 1100 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(FILE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(200);
  const out = path.resolve(process.cwd(), 'test-results/newsletter/screenshot-cover-zoom.png');
  await page.screenshot({ path: out, fullPage: false, clip: { x: 0, y: 0, width: 720, height: 1100 } });
  console.log(`✓ ${out}`);
} finally {
  await browser.close();
}
