import { z } from 'astro/zod';
export const cursoSchema = z.object({
  titulo: z.string().min(2), resumen: z.string(), especialidades: z.array(z.string()),
  modalidad: z.enum(['presencial', 'online']), fechas: z.string().nullable(), anio: z.number().int().nullable(),
  duracion: z.string().nullable(), creditos: z.number().nullable(), estado: z.enum(['activo', 'finalizado']),
  url: z.string().url().nullable(), encuesta: z.string().url().nullable(), imagen: z.string().nullable(),
  programa: z.string().nullable(), profesorado: z.array(z.string()), patrocinadores: z.array(z.string()), destacado: z.boolean(),
});
export const docenteSchema = z.object({ nombre: z.string(), cargo: z.string(), resumen: z.string(), biografia: z.string(), foto: z.string().nullable() });
export const patrocinadorSchema = z.object({ nombre: z.string(), logo: z.string().nullable() });
export const cifrasSchema = z.object({ profesionalesFormados: z.number().int().nullable() });
