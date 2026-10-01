// Uso: npm run import:cms -- /home/user/ksf-workspace/backups/webflow-2026/inginium-ksf
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import yaml from 'js-yaml';
import { imagenesDe, reescribirImagenes, nombreDesdeFichero, mapCurso, mapDocente, patrocinadoresDe, fusionarCurso, isPublicado, nombreFichero, type CmsItem, type CursoImportado } from '../src/lib/cms-import';

const bk = process.argv[2];
if (!bk) { console.error('Falta la ruta del backup de inginium-ksf'); process.exit(1); }
const leer = (n: string): CmsItem[] => { const d = JSON.parse(readFileSync(join(bk, 'cms', `${n}.items.json`), 'utf8')); return Array.isArray(d) ? d : d.items; };

// Índice nombre de fichero → ruta local (descargar.sh conserva la ruta del CDN bajo assets/files).
const indice = new Map<string, string>();
const recorrer = (d: string) => { if (!existsSync(d)) return; for (const e of readdirSync(d)) { const p = join(d, e); statSync(p).isDirectory() ? recorrer(p) : indice.set(e.normalize('NFC'), p); } };
recorrer(join(bk, 'assets', 'files'));
const local = (url: string | undefined | null) => { if (!url) return null; const n = nombreFichero(url).normalize('NFC'); return indice.get(n) ?? indice.get(encodeURIComponent(n).normalize('NFC')) ?? null; };
const copiar = (src: string | null, dir: string, base: string) => { if (!src) return null; mkdirSync(dir, { recursive: true }); const n = `${base}${extname(src).toLowerCase()}`; copyFileSync(src, join(dir, n)); return n; };

const faltan: string[] = [];
// Docentes
const docentesCms = leer('teachers');
const docentes = new Map(docentesCms.filter(isPublicado).map((t) => [t.id!, t.fieldData.slug as string]));
const docentesOut = docentesCms.filter(isPublicado).map((t) => {
  const src = local(t.fieldData['teacher-profile-picture']?.url); if (t.fieldData['teacher-profile-picture']?.url && !src) faltan.push(t.fieldData['teacher-profile-picture'].url);
  return mapDocente(t, copiar(src, 'src/assets/profesorado', t.fieldData.slug));
}).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
const prevDoc = existsSync('src/data/profesorado.json') ? new Map(JSON.parse(readFileSync('src/data/profesorado.json', 'utf8')).map((d: any) => [d.id, d])) : new Map();
writeFileSync('src/data/profesorado.json', JSON.stringify(docentesOut.map((d) => { const p = prevDoc.get(d.id) as any; return p ? { ...d, ...p, foto: d.foto ?? p.foto } : d; }), null, 2) + '\n');

// SKU → imagen principal del curso
const skus = new Map(leer('sku').map((s) => [s.id!, s.fieldData['main-image']?.url as string | undefined]));

// Patrocinadores
const prevPat: { id: string; nombre: string; logo: string | null }[] = existsSync('src/data/patrocinadores.json') ? JSON.parse(readFileSync('src/data/patrocinadores.json', 'utf8')) : [];
const patros = new Map(prevPat.map((p) => [p.id, p]));

// Cursos
mkdirSync('src/content/cursos', { recursive: true });
let n = 0;
for (const it of leer('courses').filter(isPublicado)) {
  const f = it.fieldData;
  const imgUrl = skus.get(f['default-sku']);
  const img = local(imgUrl); if (imgUrl && !img) faltan.push(imgUrl);
  const pdf = local(f.programa?.url); if (f.programa?.url && !pdf) faltan.push(f.programa.url);
  const programa = pdf ? `/programas/${copiar(pdf, 'public/programas', f.slug)}` : null;
  for (const p of patrocinadoresDe(f)) {
    const src = local(p.url); if (!src) faltan.push(p.url);
    const logo = src ? `/patrocinadores/${copiar(src, 'public/patrocinadores', p.id)}` : null;
    const prev = patros.get(p.id);
    patros.set(p.id, { id: p.id, nombre: prev?.nombre?.trim() || nombreDesdeFichero(p.url), logo: logo ?? prev?.logo ?? null });
  }
  const nuevo = mapCurso(it, { docentes, imagen: copiar(img, 'src/assets/cursos', f.slug), programa });
  // Imágenes en línea del cuerpo: copia local si existe; si no, se deja el src remoto y se cuenta como no encontrada.
  const mapaImg = new Map<string, string>();
  imagenesDe(nuevo.cuerpo).forEach((u, i) => {
    const src = local(u);
    if (!src) { faltan.push(u); return; }
    mapaImg.set(u, `/cursos-media/${copiar(src, 'public/cursos-media', `${f.slug}-${i + 1}`)}`);
  });
  nuevo.cuerpo = reescribirImagenes(nuevo.cuerpo, mapaImg);
  const ruta = `src/content/cursos/${f.slug}.md`;
  let existente: CursoImportado | null = null;
  if (existsSync(ruta)) { const [, fm, ...cuerpo] = readFileSync(ruta, 'utf8').split('---\n'); existente = { ...(yaml.load(fm) as any), id: f.slug, cuerpo: cuerpo.join('---\n').trim() }; }
  const { id: _id, cuerpo, ...fm } = fusionarCurso(nuevo, existente);
  writeFileSync(ruta, `---\n${yaml.dump(fm, { lineWidth: -1 })}---\n${cuerpo}\n`);
  n++;
}
writeFileSync('src/data/patrocinadores.json', JSON.stringify([...patros.values()], null, 2) + '\n');
console.log(`cursos: ${n} · docentes: ${docentesOut.length} · patrocinadores: ${patros.size}`);
console.log(`binarios no encontrados: ${faltan.length}${faltan.length ? ' (ejecuta descargar.sh en el Mac y repite la importación)' : ''}`);
