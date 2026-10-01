import { test, expect } from '@playwright/test';

test('activos primero y archivo de finalizados', async ({ page }) => {
  await page.goto('/cursos');
  await expect(page.locator('#activos h2')).toBeVisible();
  await expect(page.locator('#archivo h2')).toBeVisible();
  const estados = await page.locator('#archivo [data-estado]').evaluateAll((els) => els.map((e) => e.getAttribute('data-estado')));
  expect(estados.every((e) => e === 'finalizado')).toBe(true);
});

test('el filtro por especialidad va en la URL y sobrevive a la recarga', async ({ page }) => {
  await page.goto('/cursos');
  const chip = page.locator('[data-esp]').first();
  const esp = await chip.getAttribute('data-esp');
  await chip.click();
  await expect(page).toHaveURL(new RegExp(`especialidad=${esp}`));
  await page.reload();
  await expect(page.locator(`[data-esp="${esp}"]`)).toHaveAttribute('aria-pressed', 'true');
  // El revelado GSAP deja las tarjetas en visibility:hidden unos instantes: espera a que la primera sea visible.
  await expect(page.locator('.card:visible').first()).toBeVisible();
  const visibles = await page.locator('.card:visible').evaluateAll((els) => els.map((e) => e.getAttribute('data-especialidades')));
  expect(visibles.length).toBeGreaterThan(0);
  expect(visibles.every((v) => v!.split(' ').includes(esp!))).toBe(true);
});

test('búsqueda sin resultados muestra mensaje', async ({ page }) => {
  await page.goto('/cursos?q=zzzzzz');
  await expect(page.locator('.resultado')).toHaveText(/Ningún curso coincide/);
});

test('parámetros inválidos se ignoran', async ({ page }) => {
  await page.goto('/cursos?especialidad=xyz&anio=abc');
  await expect(page.locator('.card:visible').first()).toBeVisible();
  await expect(page.locator('.resultado')).not.toHaveText(/Ningún curso/);
  expect(await page.locator('.card:visible').count()).toBeGreaterThanOrEqual(30);
});

test('filtrar no rompe el historial: Atrás vuelve a la página anterior', async ({ page }) => {
  await page.goto('/');
  await page.goto('/cursos');
  await page.locator('[data-esp]').first().click();
  await expect(page).toHaveURL(/especialidad=/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('form.filtros')).toHaveCount(0);
});

test('chips accesibles: botones con aria-pressed y anuncio en role=status', async ({ page }) => {
  await page.goto('/cursos');
  const chip = page.locator('button[data-esp]').first();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('p.resultado[role="status"]')).toHaveText(/\d+ cursos?/);
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.resultado')).toHaveText('');
});

test('movimiento reducido: el filtro cambia al instante', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/cursos');
  await page.locator('input[name="q"]').fill('zzzzzz');
  await expect(page.locator('.resultado')).toHaveText(/Ningún curso coincide/);
  expect(await page.locator('.card:visible').count()).toBe(0);
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('se listan todos los cursos', async ({ page }) => {
    await page.goto('/cursos');
    expect(await page.locator('.card').count()).toBeGreaterThanOrEqual(30);
  });
});
