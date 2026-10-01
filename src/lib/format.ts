const nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });

/** Número en español con punto de miles siempre («2.266»), sin decimales. */
export function formatNumber(n: number): string {
  return nf.format(Math.round(n));
}

const TITULO = /^(dr|dra|prof)\.?$/i;

/** Hasta dos iniciales del nombre, ignorando el tratamiento («Dr.», «Dra.»). */
export function iniciales(nombre: string): string {
  return nombre.split(/\s+/).filter((p) => /^\p{L}/u.test(p) && !TITULO.test(p)).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

/** Clave de orden alfabético por nombre, sin el tratamiento («Dr. Orozco» se ordena como «Orozco»). */
export function claveNombre(nombre: string): string {
  return nombre.split(/\s+/).filter((p) => !TITULO.test(p)).join(' ');
}

/** JSON para incrustar en un <script> (ld+json o datos): «<» escapado, un «</script>» no puede cerrar la etiqueta. */
export const jsonEnScript = (o: unknown): string => JSON.stringify(o).replace(/</g, '\\u003c');
