import { test } from '@playwright/test';

const BASE = 'https://www.nfireport.com';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'articles', path: '/articles' },
  { name: 'pricing', path: '/pricing' },
  { name: 'premium', path: '/premium' },
  { name: 'marches', path: '/marches' },
  { name: 'education', path: '/education' },
  { name: 'connexion', path: '/connexion' },
  { name: 'inscription', path: '/inscription' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

for (const vp of VIEWPORTS) {
  for (const p of PAGES) {
    test(`${vp.name} ${p.name}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' }).catch(() => null);
      await page.evaluate(() => document.fonts?.ready).catch(() => {});
      await page.waitForTimeout(1200);
      await page.getByRole('button', { name: /accepter|refuser/i }).first().click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(400);
      await page.screenshot({
        path: `e2e/screenshots/launch-${vp.name}-${p.name}.png`,
        fullPage: true,
      });
      const status = resp?.status() ?? 'unknown';
      console.log(`[${vp.name}|${p.name}] status=${status} errors=${errors.length}`);
      if (errors.length > 0) {
        console.log(`  errors: ${errors.slice(0, 3).join(' | ')}`);
      }
    });
  }
}
