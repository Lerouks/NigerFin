import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

test.describe('Inscription : radio civilité obligatoire', () => {
  for (const vp of VIEWPORTS) {
    test(`affiche le radio M./Mme et bloque sans sélection (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/inscription');

      // Les deux options doivent etre visibles
      await expect(page.locator('input[name="civility"][value="M."]')).toHaveCount(1);
      await expect(page.locator('input[name="civility"][value="Mme"]')).toHaveCount(1);
      await expect(page.locator('text=Monsieur')).toBeVisible();
      await expect(page.locator('text=Madame')).toBeVisible();

      // Sans civilite : le bouton submit doit etre disabled
      const submit = page.locator('button[type="submit"]');
      await page.fill('input[id="name"]', 'NFI Report');
      await page.fill('input[id="email"]', 'test@example.com');
      await page.fill('input[id="password"]', 'TestPass2026!');
      await page.fill('input[id="confirmPassword"]', 'TestPass2026!');

      await expect(submit).toBeDisabled();

      // En cliquant Monsieur, le bouton doit s'activer
      await page.locator('label:has-text("Monsieur")').click();
      await expect(submit).toBeEnabled();
    });
  }

  test('la sélection Madame est sauvegardée visuellement', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/inscription');

    const mmeLabel = page.locator('label:has-text("Madame")');
    await mmeLabel.click();

    // La radio Mme doit etre checked
    await expect(page.locator('input[name="civility"][value="Mme"]')).toBeChecked();
    await expect(page.locator('input[name="civility"][value="M."]')).not.toBeChecked();
  });
});
