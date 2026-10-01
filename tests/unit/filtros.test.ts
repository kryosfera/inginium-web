import { describe, it, expect } from 'vitest';
import { leerFiltro, escribirFiltro, aplicarFiltro, type CursoFiltrable } from '../../src/lib/filtros';

const C: CursoFiltrable[] = [
  { id: 'a', titulo: 'Soporte Nutricional en Pediatría', resumen: 'Nutrición', especialidades: ['Pediatría'], anio: 2026, estado: 'activo' },
  { id: 'b', titulo: 'Diabetes, objetivo mi paciente', resumen: 'Atención primaria', especialidades: ['Atención Primaria'], anio: 2025, estado: 'finalizado' },
  { id: 'c', titulo: 'Gestión del estrés', resumen: '', especialidades: [], anio: null, estado: 'finalizado' },
];
const ESP = ['Pediatría', 'Atención Primaria'];
const ANIOS = [2025, 2026];

describe('leerFiltro', () => {
  it('lee valores válidos', () => {
    expect(leerFiltro(new URLSearchParams('especialidad=pediatria&anio=2026&q=nutri'), ESP, ANIOS))
      .toEqual({ especialidad: 'Pediatría', anio: 2026, q: 'nutri' });
  });
  it('ignora valores inválidos', () => {
    expect(leerFiltro(new URLSearchParams('especialidad=xyz&anio=abc'), ESP, ANIOS)).toEqual({ especialidad: null, anio: null, q: '' });
    expect(leerFiltro(new URLSearchParams('anio=1999'), ESP, ANIOS)).toEqual({ especialidad: null, anio: null, q: '' });
  });
  it('recorta la búsqueda a 80 caracteres', () => {
    expect(leerFiltro(new URLSearchParams(`q=${'a'.repeat(200)}`), ESP, ANIOS).q).toHaveLength(80);
  });
});

describe('escribirFiltro', () => {
  it('vacío sin filtro', () => { expect(escribirFiltro({ especialidad: null, anio: null, q: '' })).toBe(''); });
  it('serializa con slug de especialidad', () => {
    expect(escribirFiltro({ especialidad: 'Atención Primaria', anio: 2025, q: 'dia' })).toBe('especialidad=atencion-primaria&anio=2025&q=dia');
  });
});

describe('aplicarFiltro', () => {
  const sin = { especialidad: null, anio: null, q: '' };
  it('sin filtro devuelve todo: activos primero, luego por año desc', () => {
    expect(aplicarFiltro(C, sin).map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });
  it('por especialidad', () => { expect(aplicarFiltro(C, { ...sin, especialidad: 'Pediatría' }).map((c) => c.id)).toEqual(['a']); });
  it('por año', () => { expect(aplicarFiltro(C, { ...sin, anio: 2025 }).map((c) => c.id)).toEqual(['b']); });
  it('búsqueda sin acentos ni mayúsculas en título y resumen', () => {
    expect(aplicarFiltro(C, { ...sin, q: 'PEDIATRIA' }).map((c) => c.id)).toEqual(['a']);
    expect(aplicarFiltro(C, { ...sin, q: 'atencion' }).map((c) => c.id)).toEqual(['b']);
  });
  it('combinado sin resultados', () => { expect(aplicarFiltro(C, { ...sin, especialidad: 'Pediatría', anio: 2025 })).toEqual([]); });
});

describe('vista de /cursos', () => {
  it('lee ?vista=anios y cae a rejilla con cualquier otro valor', async () => {
    const { leerVista } = await import('../../src/lib/filtros');
    expect(leerVista(new URLSearchParams('vista=anios'))).toBe('anios');
    expect(leerVista(new URLSearchParams('vista=xyz'))).toBe('rejilla');
    expect(leerVista(new URLSearchParams(''))).toBe('rejilla');
  });
  it('escribe la vista solo si no es la de por defecto', async () => {
    const { escribirConsulta } = await import('../../src/lib/filtros');
    const sin = { especialidad: null, anio: null, q: '' };
    expect(escribirConsulta(sin, 'rejilla')).toBe('');
    expect(escribirConsulta({ ...sin, especialidad: 'Pediatría' }, 'anios')).toBe('especialidad=pediatria&vista=anios');
  });
});
