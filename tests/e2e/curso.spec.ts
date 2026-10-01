import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import yaml from 'js-yaml';

const cursos = readdirSync('src/content/cursos').map((f) => ({ id: f.slice(0, -3), ...(yaml.load(readFileSync(`src/content/cursos/${f}`, 'utf8').split('---')[1]) as any) }));
const activo = cursos.find((c) => c.estado === 'activo' && c.url)!;
const finalizado = cursos.find((c) => c.estado === 'finalizado' && c.url);
const activoSinEnlace = cursos.find((c) => c.estado === 'activo' && !c.url);
// Estos casos dependen de los datos: si no hay ninguno se saltan. El marcador sin imagen se prueba además
// sin depender de los datos en tests/unit/marcador.test.ts (Container API de Astro).
const sinImagen = cursos.find((c) => !c.imagen);
const conImagen = cursos.find((c) => c.imagen);

test('curso activo: datos y botón de inscripción a la web del curso', async ({ page }) => {
  await page.goto(`/cursos/${activo.id}`);
  await expect(page.locator('h1')).toHaveText(activo.titulo);
  const b = page.getByRole('link', { name: /Inscribirme|Acceder al curso/ }).first();
  await expect(b).toHaveAttribute('href', activo.url);
  await expect(b).toHaveAttribute('target', '_blank');
  await expect(b).toHaveAttribute('rel', /noopener/);
});

test('curso finalizado: etiqueta y sin botón', async ({ page }) => {
  test.skip(!finalizado, 'ningún curso finalizado con enlace en los datos');
  await page.goto(`/cursos/${finalizado!.id}`);
  await expect(page.getByText('Finalizado').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Inscribirme|Acceder al curso/ })).toHaveCount(0);
});

test('curso sin imagen: marcador, sin imagen rota', async ({ page }) => {
  test.skip(!sinImagen, 'todos los cursos tienen imagen (el marcador se prueba en tests/unit/marcador.test.ts)');
  await page.goto(`/cursos/${sinImagen!.id}`);
  await expect(page.locator('.shero .pattern')).toHaveCount(1);
  const rotas = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length);
  expect(rotas).toBe(0);
  await expect(page.getByRole('link', { name: /^Programa/ })).toHaveCount(0);
});

test('ficha con imagen: cartel completo junto al título (encima en móvil), sin solaparse ni recortarse', async ({ page, isMobile }) => {
  test.skip(!conImagen, 'ningún curso con imagen en los datos');
  await page.goto(`/cursos/${conImagen!.id}`);
  const img = page.locator('.shero .cartel img');
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('alt', new RegExp(`^Cartel del curso .*${conImagen!.titulo.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  const h = (await page.locator('.shero h1').boundingBox())!;
  const c = (await img.boundingBox())!;
  if (isMobile) expect(c.y + c.height).toBeLessThanOrEqual(h.y);
  else {
    const solapa = c.x < h.x + h.width && c.x + c.width > h.x && c.y < h.y + h.height && c.y + c.height > h.y;
    expect(solapa).toBe(false);
    expect(c.x).toBeGreaterThan(h.x);
  }
  // sin recortar: la caja conserva la proporción natural y respeta el alto máximo
  const { nw, nh, maxH } = await img.evaluate((el: HTMLImageElement) => ({ nw: el.naturalWidth, nh: el.naturalHeight, maxH: parseFloat(getComputedStyle(el).maxHeight) }));
  expect(c.height).toBeLessThanOrEqual(maxH + 1);
  expect(Math.abs(c.width / c.height - nw / nh)).toBeLessThan(0.02);
  expect(c.height).toBeGreaterThan(120);
});

test('móvil: barra inferior con la acción', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'solo móvil');
  await page.goto(`/cursos/${activo.id}`);
  await expect(page.locator('.facts-bar')).toBeVisible();
});

test('móvil: la barra no tapa el pie al llegar al final', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'solo móvil');
  await page.goto(`/cursos/${activo.id}`);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const enlace = page.locator('footer a').last();
  await expect(enlace).toBeInViewport();
  await page.waitForTimeout(400);
  const bar = page.locator('.facts-bar');
  if (await bar.isVisible()) {
    const a = (await enlace.boundingBox())!, b = (await bar.boundingBox())!;
    expect(a.y + a.height).toBeLessThanOrEqual(b.y);
  }
});

test('curso activo sin enlace: sin botón de inscripción', async ({ page }) => {
  test.skip(!activoSinEnlace, 'ningún curso activo sin enlace en los datos');
  await page.goto(`/cursos/${activoSinEnlace!.id}`);
  await expect(page.getByRole('link', { name: /Inscribirme|Acceder al curso/ })).toHaveCount(0);
});
