import { test, expect } from '@playwright/test';

/**
 * Validation que la CSP nonce-based ne casse rien :
 * - 0 erreur console (pas de CSP violation)
 * - 0 page error (hydration React OK)
 * - Le nonce est present dans le header et applique aux scripts inline
 * - L'interactivite est preservee (bouton clickable)
 */
test.describe('CSP nonce-based en prod local', () => {
  const pages = ['/', '/articles', '/inscription', '/pricing', '/outil/simulateur-emprunt', '/connexion'];

  for (const path of pages) {
    test(`${path} : 0 erreur console + 0 CSP violation`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => pageErrors.push(err.message));

      const response = await page.goto(path);
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(400);

      const csp = response!.headers()['content-security-policy'] || '';
      expect(csp).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
      expect(csp).toContain("'strict-dynamic'");
      // 'unsafe-inline' doit etre RETIRE de script-src (vrai vecteur XSS).
      // style-src peut le garder (Tailwind utilise des styles inline et le
      // risque CSS injection est tres limite).
      const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src')) || '';
      expect(scriptSrc).not.toContain("'unsafe-inline'");

      await page.waitForLoadState('networkidle');

      // Filtre des erreurs : ignorer les 401/403 attendus pour visiteur anonyme
      const realErrors = [...consoleErrors, ...pageErrors].filter((e) =>
        !/401|403|Failed to load resource/.test(e)
      );

      expect(realErrors, `Erreurs sur ${path}: ${JSON.stringify(realErrors, null, 2)}`).toEqual([]);
    });
  }

  test('Inscription : hydration React fonctionne (radio civilite clicable)', async ({ page }) => {
    await page.goto('/inscription');
    await page.waitForLoadState('networkidle');

    // Si l'hydration est cassee, ce click ne sera pas pris en compte par React
    await page.locator('label:has-text("Mme")').first().click();
    await expect(page.locator('input[name="civility"][value="Mme"]')).toBeChecked();
  });
});
