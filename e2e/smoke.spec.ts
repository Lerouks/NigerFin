import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('homepage loads and shows site name', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NFI Report/);
  });

  test('login page renders', async ({ page }) => {
    await page.goto('/connexion');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('signup page renders', async ({ page }) => {
    await page.goto('/inscription');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('text=Premium')).toBeVisible();
  });

  test('articles page loads', async ({ page }) => {
    await page.goto('/articles');
    await expect(page).toHaveTitle(/NFI Report/);
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');
    // Check that main nav links exist
    const nav = page.locator('nav, header');
    await expect(nav).toBeVisible();
  });

  test('footer renders', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('robots.txt is accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
  });

  test('sitemap.xml is accessible', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
  });
});
