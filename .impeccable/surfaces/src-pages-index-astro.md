---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/pages/cursos/index.astro","src/pages/cursos/[slug].astro"]
---

Alcance: rediseño v2 de inginium-web (home, /cursos, /cursos/<slug>, profesorado). Modo: Persuade en la home; Read en la ficha; Operate en /cursos.
Audiencia: profesional sanitario, patrocinador y Comisión de Formación Continuada (la ficha es el documento evaluable).

## Direction contract
THESIS: «El programa acreditado, hecho legible». La ficha de curso es un documento de referencia vivo (agenda interactiva, ficha de actividad) y la home un portal en marcha (próximo curso, trayectoria por años). Rechaza el catálogo de tarjetas genérico de plantilla LMS.
OWN-WORLD: tinta #0B0B2C y blanco frío #F5F7FA; lima #b5dc10 como señal (ahora, activo, CFC); carteles de curso como objetos físicos (tarjetas con sombra, ligera inclinación al pasar); mono IBM Plex para horas y datos; líneas de agenda verticales con nodos; Red Hat Display/Manrope.
STORY: el visitante ve primero el próximo curso con cuenta atrás y cómo inscribirse; después la trayectoria 2020–2026 por años; después especialidades; después aval (sociedades, CFC) y patrocinio transparente; cierre con dos caminos (Busco un curso / Quiero patrocinar).
FIRST VIEWPORT: cartel del próximo curso a gran escala sobre su propio fondo desenfocado, título, cuenta atrás días/horas en mono lima, sede y créditos, botón Inscribirme; tira inferior con «39 cursos · 13 especialidades · CFC».
SIGNATURE: (1) trayectoria horizontal por años con scroll fijado (pin + scrub) en escritorio, lista vertical en móvil; (2) agenda del programa como línea temporal con secciones plegables y nodo activo que sigue la lectura.
RISKS: carteles con texto compiten con titulares (no usarlos de fondo nítido); pin horizontal en móvil (desactivar); contenido sin programa estructurado (fallback al cuerpo).
