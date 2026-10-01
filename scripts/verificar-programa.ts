// Uso: npm run verificar:programa  (INGINIUM_CMS=/ruta/courses.items.json opcional)
// Comprueba que cada ponente/moderador de `agenda` aparece literalmente en el cuerpo o en el CMS del curso.
import { verificarCursos, cargarCms } from '../src/lib/verificar-programa';

const cms = cargarCms();
if (!cms.size) console.warn('Aviso: no se encontró el JSON del CMS; solo se compara con el cuerpo de cada .md.');
const { revisados, fallos } = verificarCursos('src/content/cursos', cms);
for (const f of fallos) console.error(`✗ ${f.slug}: «${f.nombre}» (sesión «${f.sesion}») no aparece en la fuente`);
console.log(`${revisados.length} cursos con agenda revisados; ${fallos.length} nombres sin fuente.`);
process.exit(fallos.length ? 1 : 0);
