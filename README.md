# inginium-ksf.com · Catálogo de formación Inginium

Catálogo de formación Inginium (un proyecto de KSF Digital Healthcare con ESADE Business School). Astro 5 + Tailwind 4, desplegado en Cloudflare Workers (assets estáticos + `worker/index.ts`; config en `wrangler.jsonc`). Contenido en el repo (`src/content/cursos`, `src/data`).

```bash
npm install
npm run dev                          # http://localhost:4321
npm test                             # tests unitarios (Vitest)
npm run test:e2e                     # tests de navegador (Playwright)
npm run build                        # comprueba tipos y genera dist/
npm run import:cms -- <ruta $BK>     # importa el backup de Webflow (ksf-workspace/backups/webflow-2026/inginium-ksf)
```

## Variables de entorno

| Variable | Tipo | Dónde |
|---|---|---|
| `PUBLIC_TURNSTILE_SITEKEY` | **build** (Astro la incrusta en el HTML) | `.env` en local; **Build variables** del Worker (Settings → Build). **No** va en `.dev.vars`. Sin ella el build usa el sitekey de prueba y el formulario falla en producción. |
| `PUBLIC_MI_AREA_URL` | **build** | `.env` en local; Build variables del Worker. Vacía en la fase 1 (sin enlace a «Mi área»). |
| `TURNSTILE_SECRET` | runtime (Worker) | `.dev.vars` en local; secreto del Worker (Settings → Variables and Secrets) |
| `RESEND_API_KEY` | runtime (Worker) | `.dev.vars` en local; secreto del Worker (Settings → Variables and Secrets) |
| `CONTACT_TO` | runtime (Worker) | destinatario del formulario |
| `CONTACT_FROM` | runtime (Worker) | remitente (dominio verificado en Resend; `web@ksf.es` mientras inginium-ksf.com no esté verificado) |

Plantilla de las de runtime: `.dev.vars.example`. El Worker (`worker/index.ts`) sirve `dist/` y atiende `POST /api/contacto` (motivo, Turnstile y Resend); si falta alguna variable de runtime responde 500.
