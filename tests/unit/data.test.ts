import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import yaml from 'js-yaml';

const cursos: Record<string, any>[] = readdirSync('src/content/cursos').filter((f) => f.endsWith('.md')).map((f) => {
  const fm = readFileSync(`src/content/cursos/${f}`, 'utf8').split('---')[1];
  return { id: f.slice(0, -3), ...(yaml.load(fm) as Record<string, any>) } as Record<string, any>;
});
const docentes: { id: string; foto: string | null }[] = JSON.parse(readFileSync('src/data/profesorado.json', 'utf8'));
const patros: { id: string; logo: string | null }[] = JSON.parse(readFileSync('src/data/patrocinadores.json', 'utf8'));

describe('datos importados', () => {
  it('hay cursos y ninguno es borrador (variabilidad-glucemica está en borrador en el CMS)', () => {
    expect(cursos.length).toBeGreaterThanOrEqual(30);
    expect(cursos.find((c) => c.id === 'variabilidad-glucemica-lectura-critica')).toBeUndefined();
  });
  it('las referencias de profesorado y patrocinadores existen', () => {
    const d = new Set(docentes.map((x) => x.id)); const p = new Set(patros.map((x) => x.id));
    for (const c of cursos) {
      for (const id of c.profesorado) expect(d.has(id), `${c.id} → ${id}`).toBe(true);
      for (const id of c.patrocinadores) expect(p.has(id), `${c.id} → ${id}`).toBe(true);
    }
  });
  it('los ficheros referenciados existen', () => {
    for (const c of cursos) {
      if (c.imagen) expect(existsSync(`src/assets/cursos/${c.imagen}`), c.imagen).toBe(true);
      if (c.programa) expect(existsSync(`public${c.programa}`), c.programa).toBe(true);
    }
    for (const x of docentes) if (x.foto) expect(existsSync(`src/assets/profesorado/${x.foto}`)).toBe(true);
    for (const x of patros) if (x.logo) expect(existsSync(`public${x.logo}`)).toBe(true);
  });
});
