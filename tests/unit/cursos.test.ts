import { describe, it, expect } from 'vitest';
import { normalizarEspecialidades, anioDe, estadoDe, slugEspecialidad } from '../../src/lib/cursos';

describe('normalizarEspecialidades', () => {
  it.each([
    ['Pediatría', ['Pediatría']],
    ['Pediatria', ['Pediatría']],
    ['Pediatría | Cirugía digestiva', ['Pediatría', 'Cirugía', 'Digestivo']],
    ['Pediatría | Cirugía | Digestivo', ['Pediatría', 'Cirugía', 'Digestivo']],
    ['Pediatría y sus áreas específicas', ['Pediatría']],
    ['Pediatría | Áreas específicas', ['Pediatría']],
    ['Medicina Atención Primaria', ['Atención Primaria']],
    ['Higienistas dentales', ['Odontología']],
    ['Cirugía cardíaca', ['Cirugía cardiovascular']],
    ['Cirugía Cardiovascular', ['Cirugía cardiovascular']],
    ['Endocrinología | Bioestadística', ['Endocrinología', 'Investigación']],
    ['Anestesiología y Medicina intensiva', ['Anestesiología']],
    ['Cardiología | Medicina Interna', ['Cardiología', 'Medicina interna']],
    ['Oncología', ['Oncología']],
    ['Enfermería', ['Enfermería']],
    ['Neumología', ['Neumología']],
  ])('%s', (raw, esperado) => { expect(normalizarEspecialidades(raw)).toEqual(esperado); });
  it('vacío o nulo da lista vacía', () => {
    expect(normalizarEspecialidades(null)).toEqual([]);
    expect(normalizarEspecialidades('  ')).toEqual([]);
  });
  it('sin duplicados', () => { expect(normalizarEspecialidades('Pediatría | Pediatria')).toEqual(['Pediatría']); });
});

describe('anioDe', () => {
  it('usa el último año del texto de fechas', () => {
    expect(anioDe('Disponible online entre los días 1 de agosto de 2025 y 31 de julio de 2026', 'x', null)).toBe(2026);
    expect(anioDe('13 de noviembre de 2026', 'x', null)).toBe(2026);
  });
  it('si no hay año en fechas, lo saca del slug', () => { expect(anioDe('Curso finalizado.', 'soporte-nutricional-2023', null)).toBe(2023); });
  it('si tampoco, de la fecha de creación', () => { expect(anioDe(null, 'gestion-estres', '2021-03-04T10:00:00.000Z')).toBe(2021); });
  it('sin datos, null', () => { expect(anioDe(null, 'gestion-estres', null)).toBeNull(); });
  it('ignora números que no son años', () => { expect(anioDe('Del 3 al 5 de abril', 'curso-2a-edicion', null)).toBeNull(); });
});

describe('estadoDe', () => {
  it('finalizado si cualquiera de las dos marcas', () => {
    expect(estadoDe(true, false)).toBe('finalizado');
    expect(estadoDe(false, true)).toBe('finalizado');
    expect(estadoDe(false, false)).toBe('activo');
  });
});

describe('slugEspecialidad', () => {
  it('quita acentos y espacios', () => {
    expect(slugEspecialidad('Pediatría')).toBe('pediatria');
    expect(slugEspecialidad('Atención Primaria')).toBe('atencion-primaria');
  });
});
