import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('cabecera, pie y marca', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Inginium, inicio' })).toBeVisible();
  await expect(page.getByText('Un proyecto de KSF Digital Healthcare')).toBeVisible();
  await expect(page.locator('[data-home-hero]')).toHaveAttribute('data-mode', 'oscuro');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'claro');
});

test('«Mi área» está oculto en fase 1', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Mi área' })).toHaveCount(0);
});

test('saltar al contenido es visible al enfocar', async ({ page, isMobile }) => {
  test.skip(isMobile, 'teclado');
  await page.goto('/');
  await page.keyboard.press('Tab');
  const box = await page.locator(':focus').boundingBox();
  expect(box!.width).toBeGreaterThan(1);
});

test('sin infracciones de contraste ni accesibilidad (axe)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
});

test('el lima nunca es color de texto sobre fondo claro', async ({ page }) => {
  await page.goto('/');
  const lima = await page.evaluate(() => {
    const malos: string[] = [];
    document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
      if (!el.textContent?.trim() || el.closest('[data-mode="oscuro"]')) return;
      if (getComputedStyle(el).color === 'rgb(181, 220, 16)') malos.push(el.tagName + '.' + el.className);
    });
    return malos;
  });
  expect(lima).toEqual([]);
});
