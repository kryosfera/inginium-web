import { describe, it, expect } from 'vitest';
import { mapCurso, mapDocente, patrocinadoresDe, limpiarHtml, fusionarCurso, isPublicado, nombreFichero, nombreDesdeFichero } from '../../src/lib/cms-import';

const docentes = new Map([['t1', 'dra-ana'], ['t2', 'dr-luis']]);
const item = (f: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  ({ id: 'c1', createdOn: '2022-05-01T00:00:00.000Z', isDraft: false, isArchived: false, ...extra,
     fieldData: { name: ' Soporte Nutricional ', slug: 'soporte-2023', ...f } });

describe('mapCurso', () => {
  it('mapea los campos del CMS', () => {
    const c = mapCurso(item({
      description: 'Resumen', especialidad: 'Pediatria', 'curso-presencial': true, 'calendario-de-la-actividad': '14 de marzo de 2023',
      'course-lenght': '8hr', creditos: 1.4, finalizado: true, 'no-activo': false, 'link-acceso-curso': 'https://x.es/',
      'course-teacher': 't1', 'profesor-2': 't2', profesorado: ['t1'], 'course-about': '<p id="">Hola</p>',
      'course-content-column-1': '<p>.</p>', 'course-content-column-2': '<p>Programa</p>',
      'patrocinadores-2': [{ fileId: 'f1', url: 'https://cdn.prod.website-files.com/a/f1_Logo.png' }],
      'logo-patrocinador': { fileId: 'f2', url: 'https://cdn.prod.website-files.com/a/f2_L.png' },
    }), { docentes, imagen: 'soporte-2023.jpg', programa: null });
    expect(c).toMatchObject({
      id: 'soporte-2023', titulo: 'Soporte Nutricional', resumen: 'Resumen', especialidades: ['Pediatría'],
      modalidad: 'presencial', fechas: '14 de marzo de 2023', anio: 2023, duracion: '8hr', creditos: 1.4,
      estado: 'finalizado', url: 'https://x.es/', imagen: 'soporte-2023.jpg', programa: null,
      profesorado: ['dra-ana', 'dr-luis'], patrocinadores: ['f1', 'f2'], destacado: false,
    });
    expect(c.cuerpo).toBe('<p>Hola</p>\n\n<p>Programa</p>');
  });
  it('activo con enlace es destacado; online por defecto; nulos limpios', () => {
    const c = mapCurso(item({ 'link-acceso-curso': 'https://y.es' }), { docentes, imagen: null, programa: null });
    expect(c).toMatchObject({ estado: 'activo', destacado: true, modalidad: 'online', creditos: null, especialidades: [], profesorado: [] });
  });
});

describe('patrocinadoresDe', () => {
  it('deduplica por fileId', () => {
    expect(patrocinadoresDe({ 'patrocinadores-2': [{ fileId: 'f1', url: 'u1' }, { fileId: 'f1', url: 'u1' }], 'logo-patrocinador': { fileId: 'f1', url: 'u1' } }))
      .toEqual([{ id: 'f1', url: 'u1' }]);
  });
});

describe('limpiarHtml', () => {
  it('quita párrafos vacíos o de relleno y atributos id', () => {
    expect(limpiarHtml('<p id="">A</p><p>.</p><p></p><p>&nbsp;</p>')).toBe('<p>A</p>');
    expect(limpiarHtml(null)).toBe('');
  });
  it('elimina scripts y manejadores en línea', () => {
    expect(limpiarHtml('<p onclick="x()">A</p><script>alert(1)</script>')).toBe('<p>A</p>');
  });
});

describe('mapDocente', () => {
  it('mapea y limpia', () => {
    expect(mapDocente({ isDraft: false, isArchived: false, fieldData: { name: 'Dra. Ana.', slug: 'dra-ana', 'teacher-position': 'Médico',
      'teacher-biography-summary': 'Resumen', 'teacher-biography': '<p id="">Bio</p>' } }, 'dra-ana.jpg'))
      .toEqual({ id: 'dra-ana', nombre: 'Dra. Ana', cargo: 'Médico', resumen: 'Resumen', biografia: '<p>Bio</p>', foto: 'dra-ana.jpg' });
  });
});

describe('fusionarCurso', () => {
  it('conserva lo editado a mano salvo binarios nuevos', () => {
    const nuevo = mapCurso(item({}), { docentes, imagen: 'n.jpg', programa: '/programas/soporte-2023.pdf' });
    const existente = { ...nuevo, titulo: 'Editado', especialidades: ['Nutrición'], imagen: null, programa: null, cuerpo: 'texto editado' };
    const f = fusionarCurso(nuevo, existente);
    expect(f.titulo).toBe('Editado');
    expect(f.especialidades).toEqual(['Nutrición']);
    expect(f.cuerpo).toBe('texto editado');
    expect(f.imagen).toBe('n.jpg');
    expect(f.programa).toBe('/programas/soporte-2023.pdf');
  });
  it('sin binario nuevo mantiene el existente', () => {
    const nuevo = mapCurso(item({}), { docentes, imagen: null, programa: null });
    expect(fusionarCurso(nuevo, { ...nuevo, imagen: 'a.jpg' }).imagen).toBe('a.jpg');
  });
});

describe('utilidades', () => {
  it('isPublicado', () => {
    expect(isPublicado({ isDraft: true, isArchived: false })).toBe(false);
    expect(isPublicado({ isDraft: false, isArchived: true })).toBe(false);
    expect(isPublicado({ isDraft: false, isArchived: false })).toBe(true);
  });
  it('nombreFichero decodifica', () => {
    expect(nombreFichero('https://cdn.prod.website-files.com/a/61cd_Logo%20Palex.jpg')).toBe('61cd_Logo Palex.jpg');
  });
});

describe('nombreDesdeFichero', () => {
  const cdn = 'https://cdn.prod.website-files.com/a/';
  it('deriva el nombre del logo', () => {
    expect(nombreDesdeFichero(cdn + '5fbcbee8ddd21b4d340022c4_Laboratorios-Ferrer-logo.png')).toBe('Laboratorios Ferrer');
    expect(nombreDesdeFichero(cdn + '5fbcbf3a9d448a5e2ac29da3_1987px-Sanofi_logo.svg.png')).toBe('Sanofi');
  });
  it('devuelve vacío si no queda nada', () => {
    expect(nombreDesdeFichero(cdn + '6a2ef6bcff6ee0eb74ff078f_LOGO.jpg')).toBe('');
    expect(nombreDesdeFichero(cdn + '6a2ef6bcff6ee0eb74ff078f_1987px.png')).toBe('');
  });
});

describe('enlaces al propio sitio', () => {
  it('no son enlace de acceso', () => {
    for (const l of ['https://www.inginium-ksf.com/contact-us', 'https://inginium-ksf.com/x']) {
      expect(mapCurso(item({ 'link-acceso-curso': l }), { docentes, imagen: null, programa: null })).toMatchObject({ url: null, destacado: false });
    }
  });
  it('fusionarCurso toma el url nuevo si el existente apunta al propio sitio', () => {
    const nuevo = mapCurso(item({}), { docentes, imagen: null, programa: null });
    expect(fusionarCurso(nuevo, { ...nuevo, url: 'https://www.inginium-ksf.com/contact-us', destacado: true })).toMatchObject({ url: null, destacado: false });
    expect(fusionarCurso(nuevo, { ...nuevo, url: 'https://otro.es/' }).url).toBe('https://otro.es/');
  });
});
