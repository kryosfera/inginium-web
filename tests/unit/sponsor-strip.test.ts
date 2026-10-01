import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SponsorStrip from '../../src/components/SponsorStrip.astro';

const patrocinadores = [{ nombre: 'AbbVie', logo: '/patrocinadores/a.png' }];

describe('SponsorStrip', () => {
  it('etiqueta por prop (home) y por defecto (ficha)', async () => {
    const c = await AstroContainer.create();
    expect(await c.renderToString(SponsorStrip, { props: { patrocinadores, etiqueta: 'Patrocinadores de nuestros cursos' } }))
      .toContain('aria-label="Patrocinadores de nuestros cursos"');
    expect(await c.renderToString(SponsorStrip, { props: { patrocinadores } })).toContain('aria-label="Patrocinadores del curso"');
  });
});
