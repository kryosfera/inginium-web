import { readFileSync, readdirSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import yaml from 'js-yaml';

const cursos = readdirSync('src/content/cursos').filter((f) => f.endsWith('.md')).map((f) => ({
  id: f.slice(0, -3), ...(yaml.load(readFileSync(`src/content/cursos/${f}`, 'utf8').split('---')[1]) as any),
}));
const activo = cursos.find((c) => c.estado === 'activo' && c.url)!;
const finalizado = cursos.find((c) => c.estado === 'finalizado')!;
const docente = JSON.parse(readFileSync('src/data/profesorado.json', 'utf8'))[0].id as string;

// Páginas indexables (están en el sitemap); /404 se prueba aparte.
const PAGINAS = [
  '/', '/cursos', `/cursos/${activo.id}`, `/cursos/${finalizado.id}`, '/profesorado', `/profesorado/${docente}`,
  '/acerca', '/contacto', '/legal/aviso-legal', '/legal/privacidad',
];

// Turnstile (challenges.cloudflare.com) no es accesible desde el contenedor de pruebas:
// se bloquea la petición para que no genere errores de consola ajenos a la web.
test.beforeEach(async ({ page }) => {
  await page.route('https://challenges.cloudflare.com/**', (r) => r.abort());
});

async function cargar(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('load');
}

const sinDuplicados = () => document.querySelectorAll('[id]').length - new Set([...document.querySelectorAll('[id]')].map((e) => e.id)).size;

for (const path of [...PAGINAS, '/404']) {
  test(`${path}: sin desbordamiento horizontal`, async ({ page }) => {
    await cargar(page, path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
  test(`${path}: sin fallos de accesibilidad graves ni ids duplicados`, async ({ page }) => {
    // Sin movimiento: axe no debe medir contraste a mitad de un fundido de entrada.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await cargar(page, path);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const graves = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(graves, graves.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join('\n')).toEqual([]);
    // El logo está en cabecera y pie: sus ids (si los hubiera) se repetirían. Se comprueba explícitamente.
    expect(await page.evaluate(sinDuplicados), 'ids duplicados').toBe(0);
  });
}

for (const path of PAGINAS) {
  test(`${path}: título, descripción, og:image absoluta y sin noindex`, async ({ page }) => {
    await cargar(page, path);
    expect((await page.title()).length).toBeGreaterThan(10);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/inginium-ksf\.com\/.+/);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });
}

test('/404: noindex', async ({ page }) => {
  await cargar(page, '/404');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('canonical y og:url: sin .html ni barra final y presentes en el sitemap', async ({ page, request }) => {
  const xml = await (await request.get('/sitemap-0.xml')).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(urls).not.toContain('https://inginium-ksf.com/404');
  for (const path of PAGINAS) {
    await page.goto(path);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    expect(canonical, path).not.toContain('.html');
    if (canonical !== 'https://inginium-ksf.com/') expect(canonical, path).not.toMatch(/\/$/);
    expect(ogUrl, path).toBe(canonical);
    expect(urls, path).toContain(canonical);
  }
});

test('sin errores de consola en la home ni en /contacto', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  for (const p of ['/', '/contacto']) await cargar(page, p);
  // La petición bloqueada de Turnstile deja un "Failed to load resource" que no es de la web.
  expect(errores.filter((e) => !/Failed to load resource|challenges\.cloudflare\.com|ERR_FAILED/.test(e))).toEqual([]);
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('la home muestra titular y primera foto', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    const img = page.locator('img').first();
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  });
  test('/cursos lista los cursos y la ficha y /contacto el formulario', async ({ page }) => {
    await page.goto('/cursos');
    await expect(page.locator('a[href^="/cursos/"]').first()).toBeVisible();
    await page.goto(`/cursos/${activo.id}`);
    await expect(page.locator('h1')).toBeVisible();
    await page.goto('/contacto');
    await expect(page.locator('form')).toBeVisible();
  });
});

test('menú móvil sin JavaScript: el <details> se abre y navega', async ({ browser, baseURL }, info) => {
  test.skip(info.project.name !== 'mobile', 'solo móvil');
  const ctx = await browser.newContext({ ...info.project.use, javaScriptEnabled: false, baseURL });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByText('Menú').click();
  const nav = page.getByRole('navigation', { name: 'Principal móvil' });
  await expect(nav.getByRole('link', { name: 'Acerca' })).toBeVisible();
  await nav.getByRole('link', { name: 'Acerca' }).click();
  await expect(page).toHaveURL(/\/acerca$/);
  await ctx.close();
});

test('sitemap y robots', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap: https://inginium-ksf.com/sitemap-index.xml');
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
});
