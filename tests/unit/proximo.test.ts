import { describe, it, expect } from 'vitest';
import { primerDia, horaInicio, instanteMadrid, inicioCurso, proximoCurso, restante, fraseRestante, textoDuracion, porAnio, recuentoEspecialidades } from '../../src/lib/proximo';

describe('primerDia', () => {
  it('fecha simple', () => { expect(primerDia('13 de noviembre de 2026')).toEqual({ y: 2026, m: 11, d: 13 }); });
  it('varios días del mismo mes', () => {
    expect(primerDia('Este curso se celebró de forma presencial los días 4 y 5 de noviembre de 2021 en Terrassa (Barcelona).')).toEqual({ y: 2021, m: 11, d: 4 });
  });
  it('rango entre dos fechas: la primera', () => {
    expect(primerDia('Disponible online entre los días 1 de septiembre de 2024 y 31 de julio de 2025')).toEqual({ y: 2024, m: 9, d: 1 });
  });
  it('sin fecha reconocible', () => {
    expect(primerDia(null)).toBeNull();
    expect(primerDia('Próximamente')).toBeNull();
  });
});

describe('inicio y cuenta atrás', () => {
  const agenda = [{ items: [{ hora: null }, { hora: '08:50–09:00' }] }];
  it('hora de la primera sesión con hora', () => { expect(horaInicio(agenda)).toEqual([8, 50]); expect(horaInicio(undefined)).toBeNull(); });
  it('hora de Madrid en invierno (+01:00) y en verano (+02:00)', () => {
    expect(new Date(instanteMadrid({ y: 2026, m: 11, d: 13 }, 8, 50)).toISOString()).toBe('2026-11-13T07:50:00.000Z');
    expect(new Date(instanteMadrid({ y: 2026, m: 7, d: 1 }, 9, 0)).toISOString()).toBe('2026-07-01T07:00:00.000Z');
  });
  it('inicioCurso combina fecha y agenda', () => {
    expect(new Date(inicioCurso({ estado: 'activo', fechas: '13 de noviembre de 2026', agenda })!).toISOString()).toBe('2026-11-13T07:50:00.000Z');
  });
  it('próximo: el activo futuro más cercano; ignora finalizados, pasados y sin fecha', () => {
    const ahora = Date.parse('2026-10-01T10:00:00Z');
    const cursos = [
      { id: 'a', estado: 'activo' as const, fechas: '20 de diciembre de 2026' },
      { id: 'b', estado: 'activo' as const, fechas: '13 de noviembre de 2026' },
      { id: 'c', estado: 'finalizado' as const, fechas: '2 de noviembre de 2026' },
      { id: 'd', estado: 'activo' as const, fechas: '1 de enero de 2026' },
      { id: 'e', estado: 'activo' as const, fechas: null },
    ];
    expect(proximoCurso(cursos, ahora)?.curso.id).toBe('b');
    expect(proximoCurso(cursos.slice(2), ahora)).toBeNull();
  });
  it('restante en días, horas y minutos', () => {
    const inicio = Date.parse('2026-11-13T07:50:00Z');
    expect(restante(inicio, Date.parse('2026-11-10T09:00:00Z'))).toEqual({ dias: 2, horas: 22, min: 50 });
    expect(restante(inicio, inicio)).toBeNull();
    expect(fraseRestante({ dias: 1, horas: 0, min: 2 })).toBe('Faltan 1 día, 0 horas y 2 minutos');
  });
});

describe('utilidades de presentación', () => {
  it('textoDuracion', () => {
    expect(textoDuracion('7hr')).toBe('7 h');
    expect(textoDuracion('8 horas')).toBe('8 h');
    expect(textoDuracion('2 días')).toBe('2 días');
    expect(textoDuracion('5hr 30min')).toBe('5 h 30 min');
    expect(textoDuracion(null)).toBeNull();
  });
  it('porAnio: años descendentes, sin los que no tienen año', () => {
    const r = porAnio([{ id: 1, anio: 2024 }, { id: 2, anio: 2026 }, { id: 3, anio: null }, { id: 4, anio: 2024 }]);
    expect(r.map((g) => [g.anio, g.cursos.map((c) => c.id)])).toEqual([[2026, [2]], [2024, [1, 4]]]);
  });
  it('recuentoEspecialidades', () => {
    expect(recuentoEspecialidades([{ especialidades: ['B', 'A'] }, { especialidades: ['A'] }, { especialidades: [] }]))
      .toEqual([{ nombre: 'A', n: 2 }, { nombre: 'B', n: 1 }]);
  });
});

describe('fechaCorta', async () => {
  const { fechaCorta, fechaIso } = await import('../../src/lib/proximo');
  it('día, rango y año', () => {
    expect(fechaCorta('13 de noviembre de 2026', 2026)).toBe('13 nov 2026');
    expect(fechaCorta('Disponible online entre los días 1 de septiembre de 2024 y 31 de julio de 2025', 2025)).toBe('1 sept 2024 – 31 jul 2025');
    expect(fechaCorta('los días 4 y 5 de noviembre de 2021 en Terrassa', 2021)).toBe('4–5 nov 2021');
    expect(fechaCorta(null, 2020)).toBe('2020');
    expect(fechaCorta(null, null)).toBeNull();
    expect(fechaIso('13 de noviembre de 2026')).toBe('2026-11-13');
  });
});
