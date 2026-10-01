import { describe, it, expect } from 'vitest';
import { verificarAgenda, verificarCursos, normalizarTexto } from '../../src/lib/verificar-programa';

describe('verificarAgenda', () => {
  const agenda = [{ seccion: 'Mañana', items: [{ titulo: 'Sesión', ponentes: ['Dra. Ana Pérez'], moderacion: ['Dr. Luis Gil'] }] }];
  it('acepta nombres presentes aunque haya etiquetas y tabuladores por medio', () => {
    expect(verificarAgenda('x', agenda, ['<p>Sesión<br>\t\tDra. Ana   Pérez</p>', 'Moderador: Dr. Luis Gil'])).toEqual([]);
  });
  it('detecta un ponente inventado', () => {
    expect(verificarAgenda('x', agenda, ['Dra. Ana Pérez · Dr. Luis Gil', '']).length).toBe(0);
    expect(verificarAgenda('x', agenda, ['Dra. Ana Pérez']).map((f) => f.nombre)).toEqual(['Dr. Luis Gil']);
  });
  it('normaliza espacios y entidades', () => { expect(normalizarTexto('a&nbsp;\t<b>b</b>')).toBe('a b '); });
});

describe('cursos con agenda', () => {
  it('todos los ponentes y moderadores constan en el cuerpo o en el CMS', () => {
    const { revisados, fallos } = verificarCursos();
    expect(revisados.length).toBeGreaterThanOrEqual(3);
    expect(fallos).toEqual([]);
  });
});
