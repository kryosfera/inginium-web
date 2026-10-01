# inginium-web · inginium-ksf.com

Catálogo de formación Inginium (KSF Digital Healthcare con ESADE Business School). Sustituye a la web de Webflow (el plan Inginium-KSF vence el 23/10/2026).

## Estructura
- `src/content/cursos/*.md`: un archivo por curso (el nombre es el slug).
- `src/data/*.json`: datos compartidos (p. ej. profesorado).
- `src/lib/`: lógica pura con tests (`tests/unit`), incluidas las redirecciones (`redirects.ts`; `_redirects` se genera en el build).
- `src/pages/`: páginas Astro.
- `scripts/`: importación del CMS de Webflow (`import:cms`) y OG (`og`).
- `worker/index.ts` + `wrangler.jsonc`: Worker de Cloudflare que sirve `dist/` como assets y atiende `/api/contacto` (`run_worker_first` para `/api/*`). Wrangler 4 está en `devDependencies`.
- `tests/unit` (Vitest) y `tests/e2e` (Playwright, proyectos `desktop` y `mobile`).

## Cómo se trabaja
- El contenido se edita en `src/content/cursos` y `src/data`; la importación (`npm run import:cms`) fusiona con lo editado a mano. Publicar = merge a `main` (Cloudflare Workers Builds: build `npm run build`, deploy `npx wrangler deploy`).
- Antes de cada PR: `npm test && npm run build && npm run test:e2e`.
- El build imprime avisos `Duplicate id "<slug>" found in …` del glob-loader (uno por curso): son benignos. Salen porque `astro check` y `astro build` sincronizan el contenido dos veces en el mismo proceso de `npm run build`; no indican ficheros duplicados. Cualquier otro aviso sí hay que mirarlo.
- Fuente de datos: `ksf-workspace/backups/webflow-2026/inginium-ksf`. Los binarios del CDN solo existen tras `descargar.sh`; el sitio debe compilar sin ellos.
- Sin cookies ni Google Analytics (Cloudflare Web Analytics desde el panel). Todo movimiento respeta `prefers-reduced-motion` y funciona sin JavaScript.

## Cómo editar el contenido

### Cursos (`src/content/cursos/<slug>.md`)
El nombre del archivo es el slug (la URL `/cursos/<slug>`). Frontmatter:
- `titulo`, `resumen`: texto de la ficha y de la tarjeta (el resumen también se busca en el filtro).
- `especialidades`: lista; alimenta el filtro de `/cursos`. `[]` = sin especialidad (15 cursos pendientes de completar).
- `modalidad`: `presencial` | `online`. `fechas`: texto libre. `anio`: número (filtro por año). `duracion`, `creditos`: opcionales.
- `estado`: `activo` | `finalizado`. Un curso activo muestra el botón de inscripción solo si tiene `url`; un finalizado muestra la etiqueta «Finalizado» y nunca el botón.
- `url`: enlace de inscripción/acceso (o `null`). `encuesta`: enlace a la encuesta (o `null`).
- `imagen`: **solo el nombre del fichero**, que va en `src/assets/cursos/` (Astro lo optimiza). Ejemplo: `imagen: soporte-nutricional-en-pediatria-2026.jpg` → `src/assets/cursos/soporte-nutricional-en-pediatria-2026.jpg`.
- `programa`: **ruta pública con `/` inicial**; el fichero va en `public/programas/` (puede ser imagen, no solo PDF). Ejemplo: `programa: /programas/soporte-nutricional-en-pediatria-2026.pdf` → `public/programas/soporte-nutricional-en-pediatria-2026.pdf`. Sin la `/` el enlace sería relativo a `/cursos` (404); el test de enlaces lo rechaza.
- Sin `imagen` la ficha y la tarjeta usan un marcador de patrón; sin `programa` no sale el botón de programa.
- `profesorado`: ids de `src/data/profesorado.json`. `patrocinadores`: ids de `src/data/patrocinadores.json`.
- `destacado`: `true` para que salga en la home. Con menos de 3 destacados la home se completa con «Últimas formaciones».
- El cuerpo del archivo es HTML (programa y descripción).

### Profesorado
`src/data/profesorado.json` (`id`, `nombre`, `cargo`, `resumen`, `biografia`, `foto`). La foto va en `src/assets/profesorado/` y `foto` lleva **solo el nombre del fichero**. Ejemplo: `"foto": "dra-ana-perez.jpg"` → `src/assets/profesorado/dra-ana-perez.jpg`.

### Patrocinadores
`src/data/patrocinadores.json` (`id`, `nombre`, `logo`). Los logos van en `public/patrocinadores/` y `logo` lleva la **ruta pública con `/` inicial** (no solo el nombre, al contrario que `imagen` y `foto`). Ejemplo: `"logo": "/patrocinadores/6a71c06f7c7b8870797bfdf3.png"` → `public/patrocinadores/6a71c06f7c7b8870797bfdf3.png`. `null` = sin logo (no se muestra). El `nombre` se derivó del fichero del logo: es editable y conviene corregirlo a mano (alt del logo y deduplicación en la home).

### Cifras
`src/data/cifras.json`: `profesionalesFormados` (número; con `null` el contador no se muestra).

### Reimportar tras descargar.sh
Desde un Mac: ejecutar `descargar.sh` en `ksf-workspace/backups/webflow-2026/inginium-ksf` y después `npm run import:cms -- <ruta del backup>`. La importación fusiona con lo editado a mano (no lo pisa), copia los binarios a `src/assets/` y `public/` (también las imágenes en línea del cuerpo, aunque se conserve el cuerpo editado) y muestra cuántos faltan. Después hay que **commitear** `src/content/cursos`, `src/data`, `src/assets/cursos`, `src/assets/profesorado` y `public/{patrocinadores,programas,cursos-media}`: Workers Builds compila desde git.

## Estado y siguientes pasos

- **01/10/2026 · Fase 1 hecha (tareas 1-10):** andamiaje, utilidades, importación del CMS, sistema visual, ficha de curso, listado con filtros, home y páginas, contacto, SEO y calidad. Código en `kryosfera/inginium-web` (`main`). Spec y plan en `ksf-workspace/docs/superpowers/specs|plans/2026-10-01-inginium-web*`.
- **01/10/2026 · Revisión final y binarios:** arreglados I1-I2 y M1-M11 de la revisión final (imágenes en línea localizadas tras la fusión, marcador probado con la Container API de Astro, formatos de `imagen`/`programa`/`foto`/`logo`, AVIF de cabecera a calidad 45, `run_worker_first`, `EMAIL_CONTACTO`, etiqueta de SponsorStrip, «cursos impartidos» solo finalizados, JSON-LD escapado, Wrangler 4 fijado, test de `src` y del CDN). **Binarios importados** (`binarios no encontrados: 0`): 39 imágenes de curso, 20 fotos, 28 logos, 2 PDF y 3 imágenes en línea; unos 43 MB en git, ninguno de más de 5 MB (el mayor, el PDF de EII-P 2026, 4,3 MB). Ya no hay referencias al CDN de Webflow en `dist/`.
- **Decisiones:** Worker de Cloudflare (no Pages); 4 cursos de 2020-21 pasados a finalizados a petición de Joaquín; enlaces de acceso que apuntaban al propio sitio descartados (`url: null`); nombres de patrocinador derivados del fichero del logo (editables); con menos de 3 destacados la home se completa con «Últimas formaciones»; mailto de privacidad alineados con el texto visible (info@inginium.es); sin CSP.
- **Pendiente de Joaquín:**
  - Carteles de curso con texto (resuelto 01/10): la ficha tiene su propia cabecera, `CursoHero` (ver abajo). El resto de páginas usan `SectionHero` con foto de fondo.
  - Fotos de docentes y carteles pesan hasta 3 MB en origen (Astro los optimiza en el build; el repo crece). Valorar reducir los originales.
  - Completar `especialidades` de 15 cursos (los que tienen `especialidades: []` en `src/content/cursos`).
  - Revisar nombres de patrocinadores (algunos toscos: «Palex en», «Ferrer New Print CMYK», «gileadRecurso 2@3x», uno vacío) y marcas repetidas.
  - Cifra de profesionales formados (`src/data/cifras.json`).
  - Revisar legales: titulares (Kryosfera Solutions vs INGINIUM CONSULTORES / www.inginium.es), que exista info@inginium.es y la fecha «Última actualización».
  - Email de contacto: la interfaz (formulario, `/contacto` y JSON-LD de `Seo`) usa una sola constante, `EMAIL_CONTACTO` en `src/lib/contacto-info.ts` (hoy `info@ksf.es`); confirmar el valor. Quedan fuera, pendientes de revisar con Joaquín: los textos legales (`src/pages/legal/privacidad.astro`, `info@inginium.es`) y `/acerca` (`info@ksf-learning.net` y teléfono de Marta).
  - Valorar los títulos en mayúsculas que vienen del CMS.
- **Publicación (pasos externos, guiados):**
  1. Worker `inginium-web` en Cloudflare conectado al repo (build `npm run build`, deploy `npx wrangler deploy`).
  2. Variables: `PUBLIC_TURNSTILE_SITEKEY` (de build), `TURNSTILE_SECRET` y `RESEND_API_KEY` (secretos), `CONTACT_TO=info@ksf.es`, `CONTACT_FROM=web@ksf.es`, `PUBLIC_MI_AREA_URL` vacía.
  3. Widget de Turnstile con `inginium-ksf.com`, `nueva.inginium-ksf.com` e `inginium-web.joaquin-05a.workers.dev`.
  4. Regla de rate limiting en `/api/contacto` (5/min por IP) cuando la zona esté en Cloudflare.
  5. DNS de `inginium-ksf.com` de Squarespace a Cloudflare: copiar registros MX/SPF/DKIM/DMARC, comparar, desactivar DNSSEC y cambiar nameservers.
  6. `nueva.inginium-ksf.com` y Lighthouse >= 90 sobre la vista previa (`/`, `/cursos` y una ficha, móvil y escritorio).
  7. Con aprobación, `inginium-ksf.com` y `www` al Worker antes del 23/10/2026.
- **01/10/2026 · Rediseño v2 (home, /cursos, ficha):** home con el próximo curso (cartel con inclinación 3D, cuenta atrás que se recalcula cada minuto; sin JS, la fecha), trayectoria por años (pin + scrub horizontal en escritorio ≥1024 px; lista vertical en móvil, con movimiento reducido y sin JS), explorar por especialidad (Flip, máx. 6), aval y acreditación, patrocinio y dos caminos. /cursos: tarjetas con cartel completo, chips con recuento y vista «Por años» (`?vista=anios`). Ficha: índice con sección activa, ficha de la actividad, agenda como línea de tiempo con progreso de lectura (fallback al cuerpo HTML sin `agenda`). Cabecera fija, transparente arriba y compacta al bajar. Informe: `ksf-workspace/.superpowers/sdd/inginium-v2/build-report.md`.
  - Decisiones: el próximo curso se calcula en el build (`proximoCurso`) con la fecha de `fechas` y la hora de la primera sesión de `agenda` (hora de Madrid); hay que recompilar cuando pase el curso para que la home cambie. El h1 de la home sigue siendo «Formación continuada para profesionales sanitarios» (SEO); el título del curso es h2. Sin próximo curso, vuelve la cabecera de fotos rotatorias con «Últimas formaciones».
  - Pendiente: `sociedades` está vacío en todos los cursos (el bloque de la home no sale hasta que se rellene); nombres de patrocinador toscos se ven ahora en la ficha («SANOFI RGB», «Sanofi logotransp»…).
- **01/10/2026 · Logo oficial:** vector extraído del `.ai` de Joaquín. `src/assets/inginium-logo.svg` (palabra + cuadrado, en la cabecera y en `og.png`) y `src/assets/inginium-logo-lema.svg` (con «improving your future», en el pie); el texto va en `currentColor` (blanco sobre oscuro, tinta sobre claro) y el cuadrado en el lima oficial `#b5dc10`. Favicon con el cuadrado oficial. El lima de interfaz se alinea con el oficial: `#b5dc10` en todo el sitio (antes `#C1E313`).
- **01/10/2026 · Cabecera de ficha «pantalla partida» (opción B elegida por Joaquín entre tres maquetas):** `src/components/CursoHero.astro`. Izquierda en tinta: píldora de estado («Inscripción abierta» / «Activo» / «Finalizado · año»), especialidades y modalidad, título, fecha en grande en lima («13.11», con año, «hasta …» si es un rango, ciudad de `sede` y duración) y botones «Inscribirme» y «Ver programa». Derecha: el cartel completo sobre sus colores desenfocados; en móvil el cartel va arriba. Utilidades `fechaDestacada` y `duracionCorta` en `src/lib/proximo.ts`. Los títulos en mayúsculas del CMS se muestran algo más pequeños (siguen pendientes de pasar a minúsculas con mayúscula inicial).
- **Fase 2 (spec propia):** área de alumno en ksf-learning.net sobre `ksf-backend`.
