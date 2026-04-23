import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars (load .env.local before running this spec).');
}

const TEST_EMAIL = `test-protection-${Date.now()}@nfi.local`;
const TEST_PASSWORD = 'TestProtect!2026Strong';
const PREMIUM_SLUG = 'banques-nigeriennes-sous-pression-qui-survivra-a-la-crise-de-liquidite';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
] as const;

let userId = '';

test.beforeAll(async () => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data, error } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  userId = data.user.id;

  const { error: profileError } = await admin.from('user_profiles').upsert({
    id: userId,
    email: TEST_EMAIL,
    full_name: 'Protection Test User',
    role: 'admin',
    profile_completed: true,
  });
  if (profileError) throw new Error(`profile upsert failed: ${profileError.message}`);
});

test.afterAll(async () => {
  if (!userId) return;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  await admin.from('user_profiles').delete().eq('id', userId);
  await admin.auth.admin.deleteUser(userId);
});

for (const vp of VIEWPORTS) {
  test(`premium article protection layer renders + blocks copy (${vp.name})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    // Login through the UI
    await page.goto('/connexion');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes('/connexion'), { timeout: 15000 }),
      page.click('button[type="submit"]'),
    ]);

    // Open the premium article
    await page.goto(`/articles/${PREMIUM_SLUG}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.article-content--protected', { timeout: 20000 });

    // Protection layer is present
    expect(await page.locator('.article-content--protected').count()).toBe(1);
    expect(await page.locator('.article-content__watermark').count()).toBe(1);

    // Watermark contains the user's email (forensic traceability)
    const bgImage = await page.locator('.article-content__watermark').evaluate(
      (el) => getComputedStyle(el).backgroundImage,
    );
    expect(decodeURIComponent(bgImage)).toContain(TEST_EMAIL);

    // user-select: none enforced
    const userSelect = await page.locator('.article-content--protected').evaluate(
      (el) => getComputedStyle(el).userSelect,
    );
    expect(userSelect).toBe('none');

    // Dismiss the RGPD cookie banner if present so it doesn't cover the body
    await page.locator('button', { hasText: 'Accepter et continuer' }).click({ timeout: 3000 }).catch(() => {});

    // Scroll the body into view for a meaningful screenshot
    await page.locator('.article-content__body').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Trigger blocked shortcut → hint pill should appear
    await page.locator('body').focus();
    await page.keyboard.press('Meta+C');
    await page.waitForSelector('.article-content__hint', { timeout: 2000 });

    // Screenshot the protected article (with watermark + hint visible)
    await page.screenshot({
      path: `e2e/screenshots/protection-premium-auth-${vp.name}.png`,
      fullPage: false,
    });
  });
}
