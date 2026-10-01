import { z } from 'astro/zod';

// Modelo de contenido v2 (todos opcionales: si faltan, la ficha usa el cuerpo HTML).
// `programa` ya es la ruta del PDF/imagen del programa; la agenda estructurada va en `agenda`.
export const tipoSesion = z.enum(['ponencia', 'bloque', 'mesa', 'debate', 'pausa', 'apertura', 'cierre']);
export const sesionSchema = z.object({
  hora: z.string().nullable(), titulo: z.string().min(1), tipo: tipoSesion,
  ponentes: z.array(z.string()).default([]), moderacion: z.array(z.string()).default([]), detalle: z.string().nullable().optional(),
});
export const seccionAgendaSchema = z.object({ seccion: z.string().min(1), items: z.array(sesionSchema) });
export const cursoSchema = z.object({
  titulo: z.string().min(2), resumen: z.string(), especialidades: z.array(z.string()),
  modalidad: z.enum(['presencial', 'online']), fechas: z.string().nullable(), anio: z.number().int().nullable(),
  duracion: z.string().nullable(), creditos: z.number().nullable(), estado: z.enum(['activo', 'finalizado']),
  url: z.string().url().nullable(), encuesta: z.string().url().nullable(), imagen: z.string().nullable(),
  programa: z.string().nullable(), profesorado: z.array(z.string()), patrocinadores: z.array(z.string()), destacado: z.boolean(),
  aprenderas: z.array(z.string()).optional(), dirigidoA: z.string().nullable().optional(), sede: z.string().nullable().optional(),
  coordinacion: z.array(z.string()).optional(), sociedades: z.array(z.string()).optional(), agenda: z.array(seccionAgendaSchema).optional(),
});
export const docenteSchema = z.object({ nombre: z.string(), cargo: z.string(), resumen: z.string(), biografia: z.string(), foto: z.string().nullable() });
export const patrocinadorSchema = z.object({ nombre: z.string(), logo: z.string().nullable() });
export const cifrasSchema = z.object({ profesionalesFormados: z.number().int().nullable() });
