import { slugEspecialidad, sinAcentos } from './cursos';

export interface CursoFiltrable { id: string; titulo: string; resumen: string; especialidades: string[]; anio: number | null; estado: 'activo' | 'finalizado' }
export interface Filtro { especialidad: string | null; anio: number | null; q: string }

export function leerFiltro(params: URLSearchParams, especialidadesValidas: string[], aniosValidos: number[]): Filtro {
  const e = params.get('especialidad');
  const especialidad = e ? especialidadesValidas.find((x) => slugEspecialidad(x) === e) ?? null : null;
  const a = Number(params.get('anio'));
  const anio = Number.isInteger(a) && aniosValidos.includes(a) ? a : null;
  const q = (params.get('q') ?? '').trim().slice(0, 80);
  return { especialidad, anio, q };
}

export function escribirFiltro(f: Filtro): string {
  const p = new URLSearchParams();
  if (f.especialidad) p.set('especialidad', slugEspecialidad(f.especialidad));
  if (f.anio) p.set('anio', String(f.anio));
  if (f.q) p.set('q', f.q);
  return p.toString();
}

const norm = (t: string) => sinAcentos(t).toLowerCase();

/** Orden: activos primero; dentro, año descendente (sin año al final) y título. */
export function ordenar<T extends CursoFiltrable>(cursos: T[]): T[] {
  return [...cursos].sort((x, y) =>
    (x.estado === y.estado ? 0 : x.estado === 'activo' ? -1 : 1)
    || ((y.anio ?? 0) - (x.anio ?? 0))
    || x.titulo.localeCompare(y.titulo, 'es'));
}

export function aplicarFiltro<T extends CursoFiltrable>(cursos: T[], f: Filtro): T[] {
  const q = norm(f.q);
  return ordenar(cursos.filter((c) =>
    (!f.especialidad || c.especialidades.includes(f.especialidad))
    && (!f.anio || c.anio === f.anio)
    && (!q || norm(`${c.titulo} ${c.resumen}`).includes(q))));
}
