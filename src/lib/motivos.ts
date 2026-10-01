export const MOTIVOS = [
  { id: 'patrocinar', label: 'Quiero patrocinar un curso' },
  { id: 'profesional', label: 'Soy profesional sanitario' },
  { id: 'otro', label: 'Otro' },
] as const;
export const MOTIVO_IDS: readonly string[] = MOTIVOS.map((m) => m.id);
