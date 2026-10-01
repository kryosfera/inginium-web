import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { writeFile } from 'node:fs/promises';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { REDIRECTS, redireccionesDinamicas, toRedirectsFile } from './src/lib/redirects.ts';

const cursos = existsSync('src/content/cursos')
  ? readdirSync('src/content/cursos').filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)) : [];
const docentes = existsSync('src/data/profesorado.json')
  ? JSON.parse(readFileSync('src/data/profesorado.json', 'utf8')).map((d) => d.id) : [];

const redirecciones = {
  name: 'inginium-redirects',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      await writeFile(new URL('_redirects', dir), toRedirectsFile([...redireccionesDinamicas(cursos, docentes), ...REDIRECTS]));
    },
  },
};

export default defineConfig({
  site: 'https://inginium-ksf.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap({ filter: (p) => !p.endsWith('/404') }), redirecciones],
  vite: { plugins: [tailwindcss()] },
});
