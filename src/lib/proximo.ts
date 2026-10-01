// Próximo curso y cuenta atrás (sin dependencias: lo usan Astro, el navegador y los tests).
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');

export interface Dia { y: number; m: number; d: number }

/**
 * Primer día que consta en el texto libre de `fechas` («13 de noviembre de 2026», «los días 4 y 5 de noviembre de 2021»,
 * «entre los días 1 de septiembre de 2024 y 31 de julio de 2025»). Sin año en la misma expresión usa el primero que aparezca después.
 */
export function primerDia(fechas: string | null | undefined): Dia | null {
  if (!fechas) return null;
  const t = sinAcentos(fechas).toLowerCase();
  const re = new RegExp(`(\\d{1,2})(?:\\s*(?:,|y|-|–|al)\\s*\\d{1,2})*\\s+de\\s+(${MESES.join('|')})(?:\\s+(?:de|del)\\s+(\\d{4}))?`);
  const m = re.exec(t);
  if (!m) return null;
  const anio = m[3] ?? /\b(20\d{2})\b/.exec(t.slice(m.index))?.[1];
  if (!anio) return null;
  const d = Number(m[1]), mes = MESES.indexOf(m[2]) + 1;
  if (d < 1 || d > 31) return null;
  return { y: Number(anio), m: mes, d };
}

/** Hora de inicio «08:50» de la primera sesión con hora de la agenda; null si no consta. */
export function horaInicio(agenda: { items: { hora: string | null }[] }[] | undefined): [number, number] | null {
  for (const s of agenda ?? []) for (const it of s.items) {
    const m = it.hora && /(\d{1,2})[:.](\d{2})/.exec(it.hora);
    if (m) return [Number(m[1]), Number(m[2])];
  }
  return null;
}

/** Desfase (ms) de Europe/Madrid respecto a UTC en un instante dado. */
function desfaseMadrid(utc: number): number {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(new Date(utc)).map((x) => [x.type, Number(x.value)]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - utc;
}

/** Instante (ms UTC) de una hora local de Madrid. */
export function instanteMadrid({ y, m, d }: Dia, h = 0, min = 0): number {
  const local = Date.UTC(y, m - 1, d, h, min);
  const t = local - desfaseMadrid(local);
  return local - desfaseMadrid(t);
}

export interface CursoFechable { estado: 'activo' | 'finalizado'; fechas: string | null; agenda?: { items: { hora: string | null }[] }[] }

/** Inicio del curso (ms UTC): primer día de `fechas` a la hora de la primera sesión (o a las 00:00 de Madrid). */
export function inicioCurso(c: CursoFechable): number | null {
  const dia = primerDia(c.fechas);
  if (!dia) return null;
  const h = horaInicio(c.agenda);
  return instanteMadrid(dia, h?.[0] ?? 0, h?.[1] ?? 0);
}

/** El curso activo con fecha de inicio futura más próxima, o null. */
export function proximoCurso<T extends CursoFechable>(cursos: T[], ahora: number): { curso: T; inicio: number } | null {
  let mejor: { curso: T; inicio: number } | null = null;
  for (const curso of cursos) {
    if (curso.estado !== 'activo') continue;
    const inicio = inicioCurso(curso);
    if (inicio !== null && inicio > ahora && (!mejor || inicio < mejor.inicio)) mejor = { curso, inicio };
  }
  return mejor;
}

/** Tiempo restante en días, horas y minutos (redondeo hacia abajo); null si ya ha empezado. */
export function restante(inicio: number, ahora: number): { dias: number; horas: number; min: number } | null {
  const ms = inicio - ahora;
  if (ms <= 0) return null;
  const totalMin = Math.floor(ms / 60_000);
  return { dias: Math.floor(totalMin / 1440), horas: Math.floor((totalMin % 1440) / 60), min: totalMin % 60 };
}

/** Frase accesible de la cuenta atrás. */
export function fraseRestante(r: { dias: number; horas: number; min: number }): string {
  const p = (n: number, s: string, pl: string) => `${n} ${n === 1 ? s : pl}`;
  return `Faltan ${p(r.dias, 'día', 'días')}, ${p(r.horas, 'hora', 'horas')} y ${p(r.min, 'minuto', 'minutos')}`;
}

/** Duración legible: «7hr» → «7 h»; el resto, tal cual. */
export function textoDuracion(d: string | null | undefined): string | null {
  if (!d) return null;
  return d.trim()
    .replace(/(\d+(?:[.,]\d+)?)\s*(?:hrs?|horas?|h)\b\.?/gi, (_, n: string) => `${n.replace('.', ',')} h`)
    .replace(/(\d+)\s*(?:min|minutos?)\b\.?/gi, '$1 min');
}

/** Agrupa por año descendente (los cursos sin año se omiten). Conserva el orden de entrada dentro de cada año. */
export function porAnio<T extends { anio: number | null }>(cursos: T[]): { anio: number; cursos: T[] }[] {
  const m = new Map<number, T[]>();
  for (const c of cursos) if (c.anio !== null) m.set(c.anio, [...(m.get(c.anio) ?? []), c]);
  return [...m.entries()].sort((a, b) => b[0] - a[0]).map(([anio, cs]) => ({ anio, cursos: cs }));
}

/** Recuento por especialidad, de más a menos cursos y alfabético. */
export function recuentoEspecialidades(cursos: { especialidades: string[] }[]): { nombre: string; n: number }[] {
  const m = new Map<string, number>();
  for (const c of cursos) for (const e of c.especialidades) m.set(e, (m.get(e) ?? 0) + 1);
  return [...m.entries()].map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es'));
}

const ABREV = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const fmt = (x: Dia) => `${x.d} ${ABREV[x.m - 1]} ${x.y}`;

/** Fecha compacta para tarjetas y datos en mono: «13 nov 2026», «1 sept 2024 – 31 jul 2025» o, si no se reconoce, el año. */
export function fechaCorta(fechas: string | null | undefined, anio: number | null): string | null {
  const primero = primerDia(fechas);
  if (!primero) return anio ? String(anio) : null;
  const t = sinAcentos(fechas!).toLowerCase();
  const todas = [...t.matchAll(new RegExp(`(\\d{1,2})\\s+de\\s+(${MESES.join('|')})\\s+(?:de|del)\\s+(\\d{4})`, 'g'))]
    .map((m) => ({ d: Number(m[1]), m: MESES.indexOf(m[2]) + 1, y: Number(m[3]) }));
  const ultimo = todas.at(-1);
  if (!ultimo || fmt(ultimo) === fmt(primero)) return fmt(primero);
  if (ultimo.y === primero.y && ultimo.m === primero.m) return `${primero.d}–${fmt(ultimo)}`;
  return `${fmt(primero)} – ${fmt(ultimo)}`;
}

/** Fecha ISO (AAAA-MM-DD) del primer día, para <time datetime>. */
export function fechaIso(fechas: string | null | undefined): string | null {
  const p = primerDia(fechas);
  return p ? `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}` : null;
}

export interface FechaDestacada { grande: string; anio: string | null; hasta: string | null }

/**
 * Fecha de la cabecera de la ficha: el primer día en grande («13.11») con su año y, si hay rango, el último día («31 jul 2025»).
 * Sin día reconocible, el año en grande; sin año, null.
 */
export function fechaDestacada(fechas: string | null | undefined, anio: number | null): FechaDestacada | null {
  const p = primerDia(fechas);
  if (!p) return anio ? { grande: String(anio), anio: null, hasta: null } : null;
  const dd = (n: number) => String(n).padStart(2, '0');
  const corta = fechaCorta(fechas, anio)!;
  const fin = corta.split(/\s+–\s+|–/).at(-1)!;
  const hasta = corta.includes('–') ? (/\d{4}$/.test(fin) ? fin : null) : null;
  return { grande: `${dd(p.d)}.${dd(p.m)}`, anio: String(p.y), hasta };
}

/** Duración legible: «7hr» → «7 h», «12hr 45min» → «12 h 45 min», «15 horas» → «15 h»; el resto, tal cual. */
export function duracionCorta(duracion: string | null | undefined): string | null {
  const t = duracion?.trim();
  if (!t) return null;
  const m = /^(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hora|horas)\.?(?:\s*(\d+)\s*min\.?)?$/i.exec(t);
  return m ? `${m[1]} h${m[2] ? ` ${m[2]} min` : ''}` : t;
}
