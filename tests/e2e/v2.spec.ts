import { test, expect, type Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import yaml from 'js-yaml';

const cursos = readdirSync('src/content/cursos').filter((f) => f.endsWith('.md')).map((f) => ({
  id: f.slice(0, -3), ...(yaml.load(readFileSync(`src/content/cursos/${f}`, 'utf8').split('---')[1]) as any),
}));
const conAgenda = cursos.find((c) => c.agenda?.length && c.agenda.some((s: any) => s.items.some((i: any) => i.hora)))!;
const sinAgenda = cursos.find((c) => !c.agenda?.length)!;

const escritorio = (info: { project: { name: string } }) => info.project.name === 'desktop';

test.describe('home: próximo curso y cuenta atrás', () => {
  test('cuenta días · horas · min y se actualiza cada minuto (reloj simulado)', async ({ page }) => {
    await page.goto('/');
    const cuenta = page.locator('[data-cuenta]');
    test.skip(!(await cuenta.count()), 'no hay curso activo con fecha futura en los datos');
    const inicio = Date.parse((await cuenta.getAttribute('data-inicio'))!);
    // 2 días, 22 horas y 50 minutos antes del inicio (más 10 s para no caer en el borde del minuto).
    const ahora = inicio - ((2 * 24 + 22) * 60 + 50) * 60_000 + 10_000;
    await page.clock.install({ time: ahora });
    await page.reload();
    await expect(page.locator('[data-cuenta-d]')).toHaveText('2');
    await expect(page.locator('[data-cuenta-h]')).toHaveText('22');
    await expect(page.locator('[data-cuenta-m]')).toHaveText('49');
    await expect(page.locator('[data-cuenta-frase]')).toHaveText(/^Faltan 2 días, 22 horas y 49 minutos/);
    await expect(page.locator('.cuenta-fecha')).toBeHidden();
    await page.clock.runFor(60_000);
    await expect(page.locator('[data-cuenta-m]')).toHaveText('48');
  });

  test('la primera vista enlaza a la inscripción externa y a la ficha', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('[data-proximo]');
    test.skip(!(await hero.count()), 'no hay curso activo con fecha futura en los datos');
    await expect(hero.getByRole('link', { name: /Inscribirme|Acceder al curso/ })).toHaveAttribute('target', '_blank');
    await expect(hero.getByRole('link', { name: /Ver ficha/ })).toHaveAttribute('href', /^\/cursos\/.+/);
    await expect(hero.locator('.cifras .num').first()).toBeVisible();
  });

  test.describe('sin JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('la cuenta atrás muestra la fecha', async ({ page }) => {
      await page.goto('/');
      test.skip(!(await page.locator('[data-cuenta]').count()), 'sin próximo curso');
      await expect(page.locator('.cuenta-fecha')).toBeVisible();
      await expect(page.locator('.cuenta-js')).toBeHidden();
    });
  });
});

async function irATrayectoria(page: Page) {
  await page.locator('[data-trayectoria]').scrollIntoViewIfNeeded();
}

test.describe('home: trayectoria', () => {
  test('escritorio: pista horizontal fijada que avanza con el scroll', async ({ page }, info) => {
    test.skip(!escritorio(info), 'solo escritorio');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const tray = page.locator('[data-trayectoria]');
    await expect(tray).toHaveClass(/is-horizontal/);
    await expect(page.locator('.pin-spacer [data-trayectoria]')).toHaveCount(1);
    const top = await tray.evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo(0, y + 1500), top);
    await expect.poll(() => page.locator('[data-tray-pista]').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41)).toBeLessThan(-200);
    // Fijada: la sección sigue arriba del todo mientras avanza.
    expect(Math.abs(await tray.evaluate((el) => el.getBoundingClientRect().top))).toBeLessThan(2);
    await expect.poll(() => page.locator('[data-tray-barra]').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(0.05);
  });

  test('móvil: lista vertical por años, sin fijar', async ({ page }, info) => {
    test.skip(escritorio(info), 'solo móvil');
    await page.goto('/');
    await irATrayectoria(page);
    await expect(page.locator('[data-trayectoria]')).not.toHaveClass(/is-horizontal/);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    const a = (await page.locator('[data-tray-anio]').nth(0).boundingBox())!;
    const b = (await page.locator('[data-tray-anio]').nth(1).boundingBox())!;
    expect(b.y).toBeGreaterThan(a.y + a.height - 1);
  });

  test('movimiento reducido en escritorio: lista vertical', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('[data-trayectoria]')).not.toHaveClass(/is-horizontal/);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
  });

  test.describe('sin JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('lista vertical con todos los cursos enlazados', async ({ page }) => {
      await page.goto('/');
      const enlaces = page.locator('[data-trayectoria] a.tc');
      expect(await enlaces.count()).toBe(cursos.filter((c) => c.anio).length);
      await expect(page.locator('[data-trayectoria]')).not.toHaveClass(/is-horizontal/);
    });
  });
});

test('home: explorar por especialidad filtra la vista previa (máx. 6) y actualiza el enlace', async ({ page }) => {
  await page.goto('/');
  const chip = page.locator('[data-exp]:not([data-exp=""])').first();
  const esp = (await chip.getAttribute('data-exp'))!;
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-exp-todos]')).toHaveAttribute('href', `/cursos?especialidad=${esp}`);
  const visibles = await page.locator('[data-exp-item]:not([hidden])').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.especialidades));
  expect(visibles.length).toBeGreaterThan(0);
  expect(visibles.length).toBeLessThanOrEqual(6);
  expect(visibles.every((v) => v!.split(' ').includes(esp))).toBe(true);
});

test.describe('/cursos: conmutador de vista', () => {
  test('«Por años» agrupa por año, va en la URL y sobrevive a la recarga', async ({ page }) => {
    await page.goto('/cursos');
    await page.getByRole('button', { name: 'Por años' }).click();
    await expect(page).toHaveURL(/vista=anios/);
    await expect(page.locator('#por-anios')).toBeVisible();
    await expect(page.locator('#activos')).toBeHidden();
    const anios = await page.locator('[data-anio-sec]:visible').evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.anioSec)));
    expect(anios).toEqual([...anios].sort((a, b) => b - a));
    const mal = await page.locator('[data-anio-sec]').evaluateAll((secs) => secs.flatMap((s) =>
      [...s.querySelectorAll<HTMLElement>('.card')].filter((c) => c.dataset.anio !== (s as HTMLElement).dataset.anioSec).map((c) => c.dataset.id)));
    expect(mal).toEqual([]);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Por años' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#por-anios')).toBeVisible();
  });

  test('el filtro se combina con la vista y volver a «Rejilla» quita el parámetro', async ({ page }) => {
    await page.goto('/cursos?vista=anios');
    const chip = page.locator('[data-esp]').first();
    const esp = (await chip.getAttribute('data-esp'))!;
    await chip.click();
    await expect(page).toHaveURL(new RegExp(`especialidad=${esp}.*vista=anios`));
    await expect(page.locator('.card:visible').first()).toBeVisible();
    const visibles = await page.locator('.card:visible').evaluateAll((els) => els.map((e) => e.getAttribute('data-especialidades')));
    expect(visibles.every((v) => v!.split(' ').includes(esp))).toBe(true);
    await page.getByRole('button', { name: 'Rejilla' }).click();
    await expect(page).not.toHaveURL(/vista=/);
    await expect(page.locator('#por-anios')).toBeHidden();
    await expect(page.locator('#archivo .card:visible').first()).toBeVisible();
  });

  test('las especialidades muestran su recuento', async ({ page }) => {
    await page.goto('/cursos');
    await expect(page.locator('[data-esp] .n').first()).toHaveText(/\d+/);
  });
});

test.describe('ficha: índice y agenda', () => {
  test('el índice marca la sección activa', async ({ page }, info) => {
    await page.goto(`/cursos/${conAgenda.id}`);
    const nav = page.getByRole('navigation', { name: 'En esta ficha' });
    await expect(nav).toBeVisible();
    await page.locator('#programa').evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.3));
    await expect(nav.locator('[data-indice-link="programa"]')).toHaveAttribute('aria-current', 'true');
    await expect(nav.locator('[aria-current="true"]')).toHaveCount(1);
    const pos = await nav.evaluate((el) => getComputedStyle(el).position);
    expect(pos).toBe('sticky');
    if (!escritorio(info)) expect(await nav.locator('ol').evaluate((el) => getComputedStyle(el).overflowX)).toBe('auto');
  });

  test('agenda: el nodo activo sigue la lectura', async ({ page }) => {
    await page.goto(`/cursos/${conAgenda.id}`);
    const items = page.locator('[data-agenda-item]');
    const n = await items.count();
    expect(n).toBeGreaterThan(4);
    const objetivo = items.nth(4);
    // Coloca la sesión 5 justo por encima de la marca de lectura (45 % del alto).
    await objetivo.evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.45 + 30));
    await expect(objetivo).toHaveClass(/is-activo/);
    await expect(page.locator('[data-agenda-item].is-activo')).toHaveCount(1);
    await expect(items.nth(3)).toHaveClass(/is-hecho/);
    await expect(items.nth(5)).not.toHaveClass(/is-hecho/);
  });

  test('agenda: las secciones se pliegan con <details>', async ({ page }) => {
    await page.goto(`/cursos/${conAgenda.id}`);
    const sec = page.locator('[data-agenda] details').first();
    await expect(sec).toHaveAttribute('open', '');
    await sec.locator('summary').click();
    await expect(sec).not.toHaveAttribute('open', '');
    await expect(sec.locator('[data-agenda-item]').first()).toBeHidden();
  });

  test('sin agenda: el programa cae al cuerpo HTML', async ({ page }) => {
    await page.goto(`/cursos/${sinAgenda.id}`);
    await expect(page.locator('[data-agenda]')).toHaveCount(0);
    await expect(page.locator('#programa .prose')).not.toBeEmpty();
    await expect(page.getByRole('navigation', { name: 'En esta ficha' }).getByRole('link', { name: 'Programa' })).toBeVisible();
    await expect(page.locator('#aprenderas')).toHaveCount(sinAgenda.aprenderas?.length ? 1 : 0);
  });

  test('ficha de la actividad con los datos que constan', async ({ page }) => {
    await page.goto(`/cursos/${conAgenda.id}`);
    const ficha = page.locator('#ficha');
    await expect(ficha.locator('dt', { hasText: 'Modalidad' })).toBeVisible();
    if (conAgenda.sede) await expect(ficha).toContainText(conAgenda.sede);
    if (conAgenda.dirigidoA) await expect(ficha).toContainText(conAgenda.dirigidoA);
  });
});

test('cabecera: transparente arriba sobre la escena y compacta con fondo al bajar', async ({ page }) => {
  await page.goto('/cursos');
  const h = page.locator('[data-header]');
  await expect(h).toHaveClass(/is-sobre/);
  await page.evaluate(() => scrollTo(0, 600));
  await expect(h).toHaveClass(/is-compacta/);
  await expect(h).not.toHaveClass(/is-sobre/);
});
