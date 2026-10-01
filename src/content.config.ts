import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { cursoSchema, docenteSchema, patrocinadorSchema } from './lib/schemas';
export const collections = {
  cursos: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/cursos' }), schema: cursoSchema }),
  profesorado: defineCollection({ loader: file('src/data/profesorado.json'), schema: docenteSchema }),
  patrocinadores: defineCollection({ loader: file('src/data/patrocinadores.json'), schema: patrocinadorSchema }),
};
