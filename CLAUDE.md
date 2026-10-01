# inginium-web · inginium-ksf.com

Catálogo de formación Inginium (KSF Digital Healthcare con ESADE Business School). Sustituye a la web de Webflow (el plan Inginium-KSF vence el 23/10/2026).

## Estructura
- `src/content/cursos/*.md`: un archivo por curso (el nombre es el slug).
- `src/data/*.json`: datos compartidos (p. ej. profesorado).
- `src/lib/`: lógica pura con tests (`tests/unit`), incluidas las redirecciones (`redirects.ts`; `_redirects` se genera en el build).
- `src/pages/`: páginas Astro.
- `scripts/`: importación del CMS de Webflow (`import:cms`) y OG (`og`).
- `worker/index.ts` + `wrangler.jsonc`: Worker de Cloudflare que sirve `dist/` como assets (y atenderá `/api/contacto`).
- `tests/unit` (Vitest) y `tests/e2e` (Playwright, proyectos `desktop` y `mobile`).

## Cómo se trabaja
- El contenido se edita en `src/content/cursos` y `src/data`; la importación (`npm run import:cms`) fusiona con lo editado a mano. Publicar = merge a `main` (Cloudflare Workers Builds: build `npm run build`, deploy `npx wrangler deploy`).
- Antes de cada PR: `npm test && npm run build && npm run test:e2e`.
- Fuente de datos: `ksf-workspace/backups/webflow-2026/inginium-ksf`. Los binarios del CDN solo existen tras `descargar.sh`; el sitio debe compilar sin ellos.
- Sin cookies ni Google Analytics (Cloudflare Web Analytics desde el panel). Todo movimiento respeta `prefers-reduced-motion` y funciona sin JavaScript.

## Estado y siguientes pasos
- 01/10/2026: andamiaje hecho (Astro 5, Tailwind 4, Vitest, Playwright, Worker). Página de inicio provisional.
