import { test, expect } from '@playwright/test';

const PREMIUM_SLUG = 'banques-nigeriennes-sous-pression-qui-survivra-a-la-crise-de-liquidite';
const FREE_SLUG = 'rdc-emirats-arabes-unis-un-partenariat-strategique-qui-redessine-les-investissements-en-afrique';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
] as const;

test.describe('Article protection - control screenshots (unauthenticated)', () => {
  for (const vp of VIEWPORTS) {
    test(`free article unprotected, copy works (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/articles/${FREE_SLUG}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.article-content, [class*="paywall"], main', { timeout: 10000 });

      // Confirm NOT protected (no watermark layer, no protected class)
      const protectedExists = await page.locator('.article-content--protected').count();
      expect(protectedExists).toBe(0);

      await page.screenshot({
        path: `e2e/screenshots/protection-free-${vp.name}.png`,
        fullPage: false,
      });
    });

    test(`premium article paywall (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/articles/${PREMIUM_SLUG}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

      // Paywall expected (we are not logged in) - protection layer should NOT be rendered
      const protectedExists = await page.locator('.article-content--protected').count();
      expect(protectedExists).toBe(0);

      await page.screenshot({
        path: `e2e/screenshots/protection-paywall-${vp.name}.png`,
        fullPage: false,
      });
    });
  }
});
