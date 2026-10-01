import { normalizarEspecialidades, anioDe, estadoDe } from './cursos';

export interface CmsFile { fileId: string; url: string; alt?: string | null }
export interface CmsItem { id?: string; createdOn?: string | null; isDraft?: boolean; isArchived?: boolean; fieldData: Record<string, any> }
export interface CursoImportado {
  id: string; titulo: string; resumen: string; especialidades: string[]; modalidad: 'presencial' | 'online';
  fechas: string | null; anio: number | null; duracion: string | null; creditos: number | null;
  estado: 'activo' | 'finalizado'; url: string | null; encuesta: string | null; imagen: string | null; programa: string | null;
  profesorado: string[]; patrocinadores: string[]; destacado: boolean; cuerpo: string;
}
export interface Docente { id: string; nombre: string; cargo: string; resumen: string; biografia: string; foto: string | null }

export const isPublicado = (it: { isDraft?: boolean; isArchived?: boolean }) => !it.isDraft && !it.isArchived;
export const nombreFichero = (url: string) => decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '');

/** Nombre provisional de un patrocinador a partir del fichero del logo (editable después). '' si no queda nada útil. */
export function nombreDesdeFichero(url: string): string {
  const base = nombreFichero(url)
    .replace(/^[0-9a-f]{24}_/, '')
    .replace(/(\.(png|jpe?g|svg|webp|gif))+$/i, '')
    .replace(/\(alta calidad\)/gi, '')
    .replace(/[-_]p-\d+$/i, '');
  return base.split(/[\s_-]+/).filter((t) => t && !/^(logo|color|svg)$/i.test(t) && !/^\d+(px)?$/i.test(t)).join(' ');
}

const esDelSitio = (u: string | null) => { try { return /^(www\.)?inginium-ksf\.com$/i.test(new URL(u ?? '').hostname); } catch { return false; } };
const txt = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function limpiarHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\s(id|on\w+)="[^"]*"/gi, '')
    .replace(/<p>(\s|&nbsp;|\.)*<\/p>/gi, '')
    .trim();
}

export function patrocinadoresDe(f: Record<string, any>): { id: string; url: string }[] {
  const lista: CmsFile[] = [...(Array.isArray(f['patrocinadores-2']) ? f['patrocinadores-2'] : []), ...(f['logo-patrocinador']?.url ? [f['logo-patrocinador']] : [])];
  const vistos = new Map<string, string>();
  for (const x of lista) if (x?.fileId && x.url && !vistos.has(x.fileId)) vistos.set(x.fileId, x.url);
  return [...vistos].map(([id, url]) => ({ id, url }));
}

export function mapCurso(it: CmsItem, ctx: { docentes: Map<string, string>; imagen: string | null; programa: string | null }): CursoImportado {
  const f = it.fieldData;
  const estado = estadoDe(!!f.finalizado, !!f['no-activo']);
  const enlace = txt(f['link-acceso-curso']);
  const url = esDelSitio(enlace) ? null : enlace; // un enlace al propio sitio no es de acceso
  const refs = [f['course-teacher'], f['profesor-2'], ...(Array.isArray(f.profesorado) ? f.profesorado : [])]
    .filter((x): x is string => typeof x === 'string');
  const profesorado = [...new Set(refs.map((r) => ctx.docentes.get(r)).filter((x): x is string => !!x))];
  const cuerpo = [f['course-about'], f['course-content-column-1'], f['course-content-column-2']].map(limpiarHtml).filter(Boolean).join('\n\n');
  return {
    id: f.slug, titulo: String(f.name).trim(), resumen: txt(f.description) ?? '',
    especialidades: normalizarEspecialidades(f.especialidad), modalidad: f['curso-presencial'] ? 'presencial' : 'online',
    fechas: txt(f['calendario-de-la-actividad']), anio: anioDe(txt(f['calendario-de-la-actividad']), f.slug, it.createdOn ?? null),
    duracion: txt(f['course-lenght']), creditos: typeof f.creditos === 'number' ? f.creditos : null,
    estado, url, encuesta: txt(f['encuesta-de-satisfaccion']), imagen: ctx.imagen, programa: ctx.programa,
    profesorado, patrocinadores: patrocinadoresDe(f).map((p) => p.id), destacado: estado === 'activo' && !!url, cuerpo,
  };
}

export function mapDocente(it: CmsItem, foto: string | null): Docente {
  const f = it.fieldData;
  return { id: f.slug, nombre: String(f.name).trim().replace(/\.$/, ''), cargo: txt(f['teacher-position']) ?? '',
    resumen: txt(f['teacher-biography-summary']) ?? '', biografia: limpiarHtml(f['teacher-biography']), foto };
}

/** Lo editado a mano (existente) manda; los binarios recién encontrados sustituyen a los vacíos o antiguos. */
export function fusionarCurso(nuevo: CursoImportado, existente: CursoImportado | null): CursoImportado {
  if (!existente) return nuevo;
  // url: si el existente apunta al propio sitio (enlace antiguo no válido), manda el nuevo (y destacado, que depende de él).
  return { ...nuevo, ...existente, ...(esDelSitio(existente.url) ? { url: nuevo.url, destacado: nuevo.destacado } : {}), imagen: nuevo.imagen ?? existente.imagen, programa: nuevo.programa ?? existente.programa };
}
