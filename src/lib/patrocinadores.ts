// Franja de patrocinadores de la home: el CMS tiene marcas repetidas con logos distintos (p. ej. Sanofi ×4).
export interface Patrocinador { nombre: string; logo: string | null }

const clave = (n: string) => n.trim().toLowerCase();

/** Una entrada por nombre no vacío (la primera con logo; si ninguna lo tiene, la primera) más todas las de nombre vacío. */
export function unicosPorNombre(lista: Patrocinador[]): Patrocinador[] {
  const porNombre = new Map<string, Patrocinador>();
  const sinNombre: Patrocinador[] = [];
  for (const p of lista) {
    const k = clave(p.nombre);
    if (!k) { sinNombre.push(p); continue; }
    const previo = porNombre.get(k);
    if (!previo || (!previo.logo && p.logo)) porNombre.set(k, p);
  }
  return [...porNombre.values(), ...sinNombre];
}
