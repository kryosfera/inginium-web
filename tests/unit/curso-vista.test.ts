import { describe, it, expect } from 'vitest';
import { puedeInscribirse, etiquetaModalidad, textoCreditos, tipoPrograma } from '../../src/lib/curso-vista';
describe('vista de curso', () => {
  it('inscripción solo si activo y con enlace', () => {
    expect(puedeInscribirse({ estado: 'activo', url: 'https://x.es' })).toBe(true);
    expect(puedeInscribirse({ estado: 'activo', url: null })).toBe(false);
    expect(puedeInscribirse({ estado: 'finalizado', url: 'https://x.es' })).toBe(false);
  });
  it('modalidad', () => { expect(etiquetaModalidad('presencial')).toBe('Presencial'); expect(etiquetaModalidad('online')).toBe('Online'); });
  it('créditos con coma decimal', () => {
    expect(textoCreditos(1.4)).toBe('1,4 créditos CFC');
    expect(textoCreditos(1)).toBe('1 crédito CFC');
    expect(textoCreditos(null)).toBeNull();
  });
  it('programa: PDF o imagen según la extensión', () => {
    expect(tipoPrograma('https://cdn.x/a/Programa.PDF')).toBe('pdf');
    expect(tipoPrograma('https://cdn.x/a.pdf?v=2')).toBe('pdf');
    expect(tipoPrograma('https://cdn.x/a.jpg')).toBe('imagen');
  });
});
