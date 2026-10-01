import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SectionHero from '../../src/components/SectionHero.astro';
import CourseCard from '../../src/components/CourseCard.astro';

// Prueba el marcador sin depender de los datos: tras importar los binarios todos los cursos pueden tener imagen.
const curso = (imagen: string | null) => ({ id: 'curso-de-prueba', collection: 'cursos', data: {
  titulo: 'Curso de prueba', resumen: 'Resumen', especialidades: [], modalidad: 'online', fechas: null, anio: 2026,
  duracion: null, creditos: null, estado: 'activo', url: null, encuesta: null, imagen, programa: null,
  profesorado: [], patrocinadores: [], destacado: false } });

describe('marcador de patrón sin imagen', () => {
  it('SectionHero sin imagen: patrón y ningún <img>', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(SectionHero, { props: { titulo: 'Curso de prueba' } });
    expect(html).toContain('class="pattern');
    expect(html).not.toMatch(/<img\b/);
  });
  it('CourseCard sin imagen (o con un fichero que no existe): patrón y ningún <img>', async () => {
    const c = await AstroContainer.create();
    for (const imagen of [null, 'no-existe.jpg']) {
      const html = await c.renderToString(CourseCard, { props: { curso: curso(imagen) as any } });
      expect(html).toContain('class="pattern');
      expect(html).not.toMatch(/<img\b/);
    }
  });
});
