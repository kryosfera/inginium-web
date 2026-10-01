// Referencias cruzadas sobre el build (dist/ lo genera el webServer de Playwright antes de los tests).
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import yaml from 'js-yaml';
import { REDIRECTS, redireccionesDinamicas, toRedirectsFile } from '../../src/lib/redirects';

const DIST = 'dist';
const cursos = readdirSync('src/content/cursos').filter((f) => f.endsWith('.md')).map((f) => ({
  id: f.slice(0, -3), ...(yaml.load(readFileSync(`src/content/cursos/${f}`, 'utf8').split('---')[1]) as any),
}));
const docentes: { id: string; foto: string | null }[] = JSON.parse(readFileSync('src/data/profesorado.json', 'utf8'));
const patrocinadores: { id: string; logo: string | null }[] = JSON.parse(readFileSync('src/data/patrocinadores.json', 'utf8'));
// Mismas reglas que astro.config.mjs: una por curso y docente, y luego las fijas.
const REGLAS = [...redireccionesDinamicas(cursos.map((c) => c.id), docentes.map((d) => d.id)), ...REDIRECTS];

/** ¿La ruta /x del sitio se sirve desde dist/? (build.format 'file': /x → x.html; / → index.html) */
function existe(ruta: string): boolean {
  const p = decodeURI(ruta.split(/[?#]/)[0]).replace(/\/+$/, '');
  if (p === '') return existsSync(join(DIST, 'index.html'));
  const f = join(DIST, p);
  return (existsSync(f) && statSync(f).isFile()) || existsSync(`${f}.html`) || existsSync(join(f, 'index.html'));
}

function paginas(dir = DIST): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? (e === '_astro' ? [] : paginas(p)) : e.endsWith('.html') ? [p] : [];
  });
}

const soloUnaVez = () => test.skip(test.info().project.name !== 'desktop', 'no depende del dispositivo: solo una vez');

test('cada destino de las redirecciones existe en dist/ y _redirects está al día', () => {
  soloUnaVez();
  for (const [from, to] of REGLAS) expect(existe(to), `${from} → ${to}`).toBe(true);
  expect(readFileSync(join(DIST, '_redirects'), 'utf8')).toContain(toRedirectsFile(REGLAS).trim());
});

test('todos los href internos de todas las páginas resuelven', () => {
  soloUnaVez();
  const html = paginas();
  expect(html.length).toBeGreaterThan(60);
  const rotos: string[] = [];
  let revisados = 0;
  for (const f of html) {
    const src = readFileSync(f, 'utf8');
    for (const [, href] of src.matchAll(/\shref="([^"]*)"/g)) {
      let ruta: string | null = null;
      if (href.startsWith('/') && !href.startsWith('//')) ruta = href;
      else if (/^https:\/\/(www\.)?inginium-ksf\.com(\/|$)/.test(href)) ruta = new URL(href).pathname;
      if (ruta === null) continue;
      revisados++;
      if (!existe(ruta)) rotos.push(`${f}: ${href}`);
    }
  }
  expect(revisados).toBeGreaterThan(100);
  expect(rotos).toEqual([]);
});

test('imagen, programa, profesorado y patrocinadores de cada curso existen', () => {
  soloUnaVez();
  const ids = {
    docentes: new Set(docentes.map((d) => d.id)),
    patrocinadores: new Set(patrocinadores.map((p) => p.id)),
  };
  const rotos: string[] = [];
  for (const c of cursos) {
    // Los binarios del CDN solo existen tras descargar.sh: se exige el fichero si hay nombre local, no si es una URL.
    if (c.imagen && !/^https?:\/\//.test(c.imagen) && !existsSync(join('src/assets/cursos', c.imagen))) rotos.push(`${c.id}: imagen ${c.imagen}`);
    // programa es una ruta pública (/programas/<slug>.pdf), no un nombre de fichero: sin «/» inicial el enlace sería relativo a /cursos.
    if (c.programa && (!c.programa.startsWith('/') || !existsSync(join('public', c.programa)))) rotos.push(`${c.id}: programa ${c.programa}`);
    for (const d of c.profesorado) if (!ids.docentes.has(d)) rotos.push(`${c.id}: docente ${d}`);
    for (const p of c.patrocinadores) if (!ids.patrocinadores.has(p)) rotos.push(`${c.id}: patrocinador ${p}`);
  }
  // logo es una ruta pública (/patrocinadores/<id>.<ext>).
  for (const p of patrocinadores) if (p.logo && (!p.logo.startsWith('/') || !existsSync(join('public', p.logo)))) rotos.push(`patrocinador ${p.id}: logo ${p.logo}`);
  expect(rotos).toEqual([]);
});
