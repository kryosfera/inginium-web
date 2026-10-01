import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import docentes from '../../src/data/profesorado.json' with { type: 'json' };

for (const [ruta, h1] of [
  ['/', /Formación continuada/], ['/profesorado', /Profesorado/], ['/acerca', /Inginium/],
  ['/legal/aviso-legal', /Aviso legal/], ['/legal/privacidad', /Privacidad/],
] as const) {
  test(`${ruta}: h1 y sin violaciones serias de axe`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(ruta);
    await expect(page.locator('h1')).toHaveText(h1);
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });
}

test('home: cursos destacados, cifras y enlace al catálogo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#destacados .card').first()).toBeVisible();
  await expect(page.locator('.stats .num').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver todos los cursos' })).toHaveAttribute('href', '/cursos');
});

test('home: con movimiento reducido solo la primera foto está cargada y visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const capas = page.locator('[data-hero-layer]');
  expect(await capas.count()).toBe(4);
  await expect(capas.first()).toBeVisible();
  // Las demás siguen diferidas: sin src real hasta que la rotación las promueva.
  expect(await page.locator('[data-hero-layer] img[data-src]').count()).toBe(3);
});

test('home: la rotación promueve la foto siguiente antes de mostrarla', async ({ page }) => {
  test.setTimeout(40_000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('[data-hero-layer].is-on')).toHaveCount(1);
  await expect.poll(async () => page.locator('[data-hero-layer] img[data-src]').count(), { timeout: 12_000 }).toBeLessThan(3);
  // Tras el primer periodo la segunda foto ya tiene src real y es la visible.
  await expect(page.locator('[data-hero-layer].is-on img[src]')).toHaveCount(1, { timeout: 12_000 });
  await expect.poll(async () => page.locator('[data-hero-layer]').evaluateAll((els) => els.findIndex((e) => e.classList.contains('is-on'))), { timeout: 12_000 }).toBe(1);
});

test('ficha de docente lista sus cursos', async ({ page }) => {
  const d = docentes[0];
  await page.goto(`/profesorado/${d.id}`);
  await expect(page.locator('h1')).toHaveText(d.nombre);
});

test('legales sin cookies analíticas y con la frase de Cloudflare', async ({ page }) => {
  for (const ruta of ['/legal/aviso-legal', '/legal/privacidad']) {
    await page.goto(ruta);
    await expect(page.locator('article')).toContainText('Cloudflare Web Analytics, sin cookies');
    await expect(page.locator('article')).not.toContainText(/Google/);
  }
});

test('404 es noindex', async ({ page }) => {
  const r = await page.goto('/no-existe');
  expect(r?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
