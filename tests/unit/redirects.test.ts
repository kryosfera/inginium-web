import { describe, it, expect } from 'vitest';
import { REDIRECTS, redireccionesDinamicas, toRedirectsFile } from '../../src/lib/redirects';

describe('redirecciones', () => {
  it('cada curso y docente tiene su regla, antes que los comodines', () => {
    const r = [...redireccionesDinamicas(['soporte-nutricional-2023'], ['dra-ana']), ...REDIRECTS];
    const i = (from: string) => r.findIndex(([f]) => f === from);
    expect(r).toContainEqual(['/product/soporte-nutricional-2023', '/cursos/soporte-nutricional-2023']);
    expect(r).toContainEqual(['/teacher/dra-ana', '/profesorado/dra-ana']);
    expect(i('/product/soporte-nutricional-2023')).toBeLessThan(i('/product/*'));
    expect(i('/teacher/dra-ana')).toBeLessThan(i('/teacher/*'));
  });
  it('rutas fijas del spec', () => {
    const m = new Map(REDIRECTS.map(([a, b]) => [a, b]));
    expect(m.get('/courses')).toBe('/cursos');
    expect(m.get('/about-us')).toBe('/acerca');
    expect(m.get('/contact-us')).toBe('/contacto');
    expect(m.get('/politica-de-privacidad')).toBe('/legal/privacidad');
    expect(m.get('/aviso-legal')).toBe('/legal/aviso-legal');
    expect(m.get('/blog')).toBe('/');
    expect(m.get('/course/*')).toBe('/cursos');
  });
  it('variante con barra final solo en rutas exactas', () => {
    const f = toRedirectsFile([['/courses', '/cursos'], ['/post/*', '/']]);
    expect(f).toBe('/courses /cursos 301\n/courses/ /cursos 301\n/post/* / 301\n');
  });
});
