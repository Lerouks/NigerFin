import { test, expect } from '@playwright/test';

test.describe('Verification post-audit en prod', () => {
  test('Inscription : labels compacts M. / Mme', async ({ page }) => {
    await page.goto('/inscription');
    // Les valeurs envoyees doivent toujours etre M. / Mme
    await expect(page.locator('input[name="civility"][value="M."]')).toHaveCount(1);
    await expect(page.locator('input[name="civility"][value="Mme"]')).toHaveCount(1);
    // Les labels visibles doivent etre compacts M. / Mme (pas Monsieur/Madame)
    await expect(page.locator('label:has(span:text-is("M."))')).toHaveCount(1);
    await expect(page.locator('label:has(span:text-is("Mme"))')).toHaveCount(1);
    // Mais aria-label doit conserver l'accessibilite "Monsieur/Madame"
    const mLabel = page.locator('label:has(span:text-is("M."))').locator('span[aria-label]');
    await expect(mLabel).toHaveAttribute('aria-label', 'Monsieur');
  });

  test('Pricing : pas de 4x GET /api/user/profile pour visiteur anonyme', async ({ page }) => {
    const profileCalls: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/api/user/profile')) {
        profileCalls.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    // Doit etre 0 (visiteur anonyme, isSignedIn=false donc no fetch)
    expect(profileCalls.length).toBeLessThanOrEqual(0);
  });

  test('Outil simulateur emprunt : la page se charge sans erreur', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/outil/simulateur-emprunt');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
    await expect(page.locator('text=Simulateur').first()).toBeVisible();
  });
});
