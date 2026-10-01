import { test, expect } from '@playwright/test';
test('la home responde', async ({ page }) => {
  const r = await page.goto('/');
  expect(r?.status()).toBe(200);
  await expect(page.locator('h1')).toBeVisible();
});
