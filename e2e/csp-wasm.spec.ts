import { test, expect } from '@playwright/test';

test.describe('CSP autorise WebAssembly pour @react-pdf/renderer', () => {
  test('header contient wasm-unsafe-eval', async ({ page }) => {
    const response = await page.goto('/outil/simulateur-emprunt');
    expect(response).not.toBeNull();
    const csp = response!.headers()['content-security-policy'] ?? '';
    expect(csp).toContain("'wasm-unsafe-eval'");
  });

  test("instanciation WebAssembly possible sous CSP de prod", async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/outil/simulateur-emprunt');

    const wasmStatus = await page.evaluate(async () => {
      // Module WebAssembly minimal valide (export d'une fonction add)
      const bytes = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        0x01, 0x07, 0x01, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f,
        0x03, 0x02, 0x01, 0x00,
        0x07, 0x07, 0x01, 0x03, 0x61, 0x64, 0x64, 0x00, 0x00,
        0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b,
      ]);
      try {
        const mod = await WebAssembly.instantiate(bytes);
        const exp = mod.instance.exports as { add: (a: number, b: number) => number };
        return { ok: true, result: exp.add(2, 3) };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    });

    expect(wasmStatus.ok).toBe(true);
    expect(wasmStatus.result).toBe(5);
    const cspErrors = errors.filter((e) => /WebAssembly|CSP|unsafe-eval/i.test(e));
    expect(cspErrors).toEqual([]);
  });
});
