// Normalización de datos de curso (sin dependencias: lo usan el import, Astro y el navegador).
const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
const clave = (t: string) => sinAcentos(t).toLowerCase().replace(/\s+/g, ' ').trim();

/** Tabla de equivalencias: clave normalizada → especialidades canónicas ([] = descartar). */
const MAPA: Record<string, string[]> = {
  'pediatria': ['Pediatría'],
  'pediatria y sus areas especificas': ['Pediatría'],
  'areas especificas': [],
  'cirugia digestiva': ['Cirugía', 'Digestivo'],
  'cirugia': ['Cirugía'],
  'digestivo': ['Digestivo'],
  'medicina atencion primaria': ['Atención Primaria'],
  'atencion primaria': ['Atención Primaria'],
  'enfermeria': ['Enfermería'],
  'higienistas dentales': ['Odontología'],
  'odontologia': ['Odontología'],
  'cirugia cardiaca': ['Cirugía cardiovascular'],
  'cirugia cardiovascular': ['Cirugía cardiovascular'],
  'endocrinologia': ['Endocrinología'],
  'bioestadistica': ['Investigación'],
  'anestesiologia y medicina intensiva': ['Anestesiología'],
  'cardiologia': ['Cardiología'],
  'medicina interna': ['Medicina interna'],
  'oncologia': ['Oncología'],
};

export function normalizarEspecialidades(raw: string | null | undefined): string[] {
  if (!raw || !raw.trim()) return [];
  const out: string[] = [];
  for (const parte of raw.split('|')) {
    const k = clave(parte);
    if (!k) continue;
    const canon = MAPA[k] ?? [parte.trim().charAt(0).toUpperCase() + parte.trim().slice(1)];
    for (const c of canon) if (!out.includes(c)) out.push(c);
  }
  return out;
}

const ANIO = /\b(20[0-4]\d)\b/g;
const ultimoAnio = (t: string | null) => { const m = t ? [...t.matchAll(ANIO)].map((x) => Number(x[1])) : []; return m.length ? Math.max(...m) : null; };

export function anioDe(fechas: string | null, slug: string, creado: string | null): number | null {
  return ultimoAnio(fechas) ?? ultimoAnio(slug.replace(/-/g, ' ')) ?? (creado ? new Date(creado).getUTCFullYear() : null);
}

export function estadoDe(finalizado: boolean, noActivo: boolean): 'activo' | 'finalizado' {
  return finalizado || noActivo ? 'finalizado' : 'activo';
}

export function slugEspecialidad(e: string): string {
  return sinAcentos(e).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export { sinAcentos };
