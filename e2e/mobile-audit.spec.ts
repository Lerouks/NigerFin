import { test } from '@playwright/test';

const BASE = 'https://www.nfireport.com';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'premium', path: '/premium' },
  { name: 'pricing', path: '/pricing' },
  { name: 'articles', path: '/articles' },
  { name: 'economie', path: '/economie' },
  { name: 'finance', path: '/finance' },
  { name: 'marches', path: '/marches' },
  { name: 'niger', path: '/niger' },
  { name: 'education', path: '/education' },
  { name: 'entreprises', path: '/entreprises' },
  { name: 'outils', path: '/outils' },
  { name: 'connexion', path: '/connexion' },
  { name: 'inscription', path: '/inscription' },
];

const MOBILE_VIEWPORT = { width: 375, height: 812 };

for (const p of PAGES) {
  test(`mobile ${p.name}`, async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    const resp = await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' }).catch(() => null);
    // Wait for fonts + CSS to be fully applied
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    await page.waitForTimeout(1500);
    // Dismiss cookie banner
    await page.getByRole('button', { name: /accepter|refuser/i }).first().click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `e2e/screenshots/mobile-${p.name}.png`,
      fullPage: true,
    });
    const status = resp?.status() ?? 'unknown';
    console.log(`[${p.name}] status=${status}`);
  });
}

test('mobile burger open', async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /accepter|refuser/i }).first().click({ timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /ouvrir le menu/i }).click().catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({
    path: 'e2e/screenshots/mobile-burger-open.png',
    fullPage: true,
  });
});

test('mobile header zoom', async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /accepter|refuser/i }).first().click({ timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({
    path: 'e2e/screenshots/mobile-header-zoom.png',
    clip: { x: 0, y: 0, width: 375, height: 140 },
  });
});

test('mobile premium faq zoom', async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto(`${BASE}/premium`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /accepter|refuser/i }).first().click({ timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(300);
  const faq = page.getByText('Questions fréquentes').first();
  await faq.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'e2e/screenshots/mobile-premium-faq.png',
    fullPage: false,
  });
});
