// Detector de invenciones: cada ponente o moderador de la agenda estructurada (`agenda`)
// debe aparecer literalmente en el cuerpo HTML del curso o en su registro del CMS de Webflow.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

export const normalizarTexto = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;| |‍/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').normalize('NFC');

export interface Fallo { slug: string; nombre: string; sesion: string }
type Agenda = { seccion: string; items: { titulo: string; ponentes?: string[]; moderacion?: string[] }[] }[];

/** Devuelve los nombres de la agenda que no aparecen en ninguna de las fuentes. */
export function verificarAgenda(slug: string, agenda: Agenda, fuentes: string[]): Fallo[] {
  const texto = normalizarTexto(fuentes.join(' \n '));
  const fallos: Fallo[] = [];
  for (const s of agenda) for (const it of s.items) for (const n of [...(it.ponentes ?? []), ...(it.moderacion ?? [])]) {
    if (!texto.includes(normalizarTexto(n).trim())) fallos.push({ slug, nombre: n, sesion: it.titulo });
  }
  return fallos;
}

const CAMPOS_CMS = ['name', 'description', 'course-about', 'course-content-column-1', 'course-content-column-2'];
export const RUTA_CMS_POR_DEFECTO = '../ksf-workspace/backups/webflow-2026/inginium-ksf/cms/courses.items.json';

/** Textos del CMS por slug (vacío si no está el backup). */
export function cargarCms(ruta = process.env.INGINIUM_CMS ?? RUTA_CMS_POR_DEFECTO): Map<string, string[]> {
  const m = new Map<string, string[]>();
  if (!existsSync(ruta)) return m;
  const d = JSON.parse(readFileSync(ruta, 'utf8'));
  for (const it of (Array.isArray(d) ? d : d.items) as { fieldData: Record<string, unknown> }[]) {
    m.set(String(it.fieldData.slug), CAMPOS_CMS.map((k) => it.fieldData[k]).filter((v): v is string => typeof v === 'string'));
  }
  return m;
}

/** Verifica todos los cursos con `agenda` de un directorio de contenido. */
export function verificarCursos(dir = 'src/content/cursos', cms = cargarCms()) {
  const revisados: string[] = []; const fallos: Fallo[] = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md')).sort()) {
    const [, fm, ...resto] = readFileSync(join(dir, f), 'utf8').split(/^---\s*$/m);
    const datos = yaml.load(fm) as { agenda?: Agenda };
    if (!datos?.agenda?.length) continue;
    const slug = f.replace(/\.md$/, '');
    revisados.push(slug);
    fallos.push(...verificarAgenda(slug, datos.agenda, [resto.join('---'), ...(cms.get(slug) ?? [])]));
  }
  return { revisados, fallos };
}
