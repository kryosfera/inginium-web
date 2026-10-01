import { describe, it, expect } from 'vitest';
import { unicosPorNombre } from '../../src/lib/patrocinadores';
import { iniciales, claveNombre } from '../../src/lib/format';

describe('unicosPorNombre', () => {
  it('deja una entrada por nombre, prefiriendo la que tiene logo', () => {
    const r = unicosPorNombre([
      { nombre: 'Sanofi', logo: null }, { nombre: 'sanofi ', logo: '/a.svg' }, { nombre: 'Sanofi', logo: '/b.svg' },
      { nombre: 'AbbVie', logo: null },
    ]);
    expect(r).toEqual([{ nombre: 'sanofi ', logo: '/a.svg' }, { nombre: 'AbbVie', logo: null }]);
  });
  it('conserva todas las de nombre vacío', () => {
    const r = unicosPorNombre([{ nombre: '', logo: '/x.svg' }, { nombre: '  ', logo: '/y.svg' }, { nombre: 'A', logo: null }]);
    expect(r.map((p) => p.logo)).toEqual([null, '/x.svg', '/y.svg']);
  });
});

describe('nombres de docentes', () => {
  it('iniciales ignora el tratamiento', () => {
    expect(iniciales('Dr. Domingo Orozco')).toBe('DO');
    expect(iniciales('Alejandra Herrera Muñoz')).toBe('AH');
  });
  it('claveNombre quita Dr./Dra. para ordenar', () => {
    expect(claveNombre('Dra. Ana Pérez')).toBe('Ana Pérez');
    expect(claveNombre('Beatriz Gil')).toBe('Beatriz Gil');
  });
});
