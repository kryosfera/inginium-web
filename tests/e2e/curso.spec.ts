import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import yaml from 'js-yaml';

const cursos = readdirSync('src/content/cursos').map((f) => ({ id: f.slice(0, -3), ...(yaml.load(readFileSync(`src/content/cursos/${f}`, 'utf8').split('---')[1]) as any) }));
const activo = cursos.find((c) => c.estado === 'activo' && c.url)!;
const finalizado = cursos.find((c) => c.estado === 'finalizado' && c.url)!;
const sinImagen = cursos.find((c) => !c.imagen);

test('curso activo: datos y botón de inscripción a la web del curso', async ({ page }) => {
  await page.goto(`/cursos/${activo.id}`);
  await expect(page.locator('h1')).toHaveText(activo.titulo);
  const b = page.getByRole('link', { name: /Inscribirme|Acceder al curso/ }).first();
  await expect(b).toHaveAttribute('href', activo.url);
  await expect(b).toHaveAttribute('target', '_blank');
  await expect(b).toHaveAttribute('rel', /noopener/);
});

test('curso finalizado: etiqueta y sin botón', async ({ page }) => {
  await page.goto(`/cursos/${finalizado.id}`);
  await expect(page.getByText('Finalizado').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Inscribirme|Acceder al curso/ })).toHaveCount(0);
});

test('curso sin imagen: marcador, sin imagen rota', async ({ page }) => {
  expect(sinImagen, 'debe existir al menos un curso sin imagen').toBeTruthy();
  await page.goto(`/cursos/${sinImagen!.id}`);
  await expect(page.locator('.shero .pattern')).toHaveCount(1);
  const rotas = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length);
  expect(rotas).toBe(0);
  await expect(page.getByRole('link', { name: /^Programa/ })).toHaveCount(0);
});

test('móvil: barra inferior con la acción', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'solo móvil');
  await page.goto(`/cursos/${activo.id}`);
  await expect(page.locator('.facts-bar')).toBeVisible();
});
