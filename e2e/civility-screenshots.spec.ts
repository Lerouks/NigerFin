import { test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

test.describe('Inscription, capture screenshots civilité', () => {
  for (const vp of VIEWPORTS) {
    test(`screenshot inscription ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/inscription');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `/tmp/qa-inscription-${vp.name}.png`,
        fullPage: false,
      });
    });
  }
});
