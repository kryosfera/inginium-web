// Presentación de un curso (sin dependencias: la usan los componentes y los tests).
export const puedeInscribirse = (c: { estado: string; url: string | null }) => c.estado === 'activo' && !!c.url;
export const etiquetaModalidad = (m: 'presencial' | 'online') => (m === 'presencial' ? 'Presencial' : 'Online');
export function textoCreditos(n: number | null): string | null {
  if (n == null) return null;
  return `${String(n).replace('.', ',')} ${n === 1 ? 'crédito' : 'créditos'} CFC`;
}
/** El campo `programa` puede ser un PDF o una imagen (jpg/png). */
export const tipoPrograma = (url: string): 'pdf' | 'imagen' => (/\.pdf$/i.test(url.split(/[?#]/)[0]) ? 'pdf' : 'imagen');
