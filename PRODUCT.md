# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Profesional sanitario** (médicos, enfermería, higienistas dentales, residentes) que busca formación continuada acreditada en su especialidad: compara cursos, revisa programa, profesorado, fechas, modalidad y créditos CFC, y se inscribe o accede a la web propia del curso.
- **Laboratorio o empresa patrocinadora** (responsables de formación médica en farma y tecnología sanitaria) que evalúa a Inginium para patrocinar formación: mira trayectoria, calidad del programa y transparencia del patrocinio.
- **Comisión de Formación Continuada / evaluadores de acreditación**: Inginium es el portal donde se publicitan los cursos acreditados para que la comisión los evalúe; necesitan encontrar en cada ficha la información de la actividad completa y verificable (objetivos, destinatarios, programa con horarios y ponentes, profesorado, fechas, modalidad, créditos, patrocinio).

## Product Purpose
Portal de formación continuada para profesionales sanitarios, fruto del acuerdo entre Inginium y KSF Digital Healthcare, con profesionales vinculados a ESADE Business School. Publica los cursos acreditados (activos y archivo), enlaza a la web de inscripción o acceso de cada curso y documenta cada actividad para su evaluación. Éxito: un profesional encuentra y entiende un curso en segundos; un patrocinador ve una trayectoria seria; un evaluador encuentra todo lo que necesita sin pedirlo.

## Positioning
Formación patrocinada por la industria de la salud, con programas diseñados junto a sociedades científicas (SEGHNP, GETECCU, ASENEM, AEEH… según cada curso) y acreditada por la Comisión de Formación Continuada (créditos CFC por curso), producida por una agencia especializada en salud (KSF Digital Healthcare).

## Operating Context
- Cada curso tiene su propia web de inscripción o acceso (dominios propios, ksf-learning.net…); Inginium es el catálogo y la ficha de referencia, no el LMS.
- Fase 2 (fuera de este repo): área de alumno y verificación de credenciales en ksf-learning.net, sobre ksf-backend.
- El contenido se edita desde Claude en el repo (sin CMS); importado de Webflow.

## Capabilities and Constraints
- 39 cursos (1 activo, 38 en archivo), 20 docentes, 28 patrocinadores; imágenes de curso que son carteles con texto; 2 programas en PDF; programas en HTML con horarios y ponentes en la mayoría de cursos.
- Astro 5 estático en Cloudflare Workers; formulario de contacto con Turnstile y Resend; sin cookies.
- Textos: se pueden reescribir resúmenes y estructurar programas **solo con información ya presente** en cada ficha (no se inventan objetivos, avales, cifras ni ponentes).

## Brand Commitments
- Logo Inginium (gris + cuadrado lima con muesca) y lema «improving your future»; verde lima #C1E313 como acento; tinta #0B0B2C.
- Familia visual con ksf.es (catálogo KSF v9): tipografías Red Hat Display y Manrope; firma «Un proyecto de KSF Digital Healthcare · con ESADE Business School».
- Idioma: español.

## Evidence on Hand
- Por curso: títulos, fechas, sedes, modalidad, duración, créditos CFC, programas con ponentes, profesorado, carteles, logos de patrocinadores (src/content/cursos, src/data).
- Sociedades científicas: mencionadas en títulos y programas de los cursos (extraíbles; no se añaden otras).
- Acreditación CFC: créditos por curso.
- **No hay**: cifra de profesionales formados, testimonios, valoraciones, número de expediente de acreditación. No se inventan.

## Product Principles
1. La ficha de curso es el documento de referencia: completa, ordenada y verificable para el profesional y para la comisión.
2. Transparencia del patrocinio: siempre visible quién patrocina.
3. Encontrar antes que impresionar: el catálogo se explora por especialidad, año y estado sin fricción.
4. Rigor clínico en el tono: claro, preciso, sin promesas vacías.

## Accessibility & Inclusion
WCAG 2.2 AA (contraste, foco visible, navegación por teclado); movimiento respetando prefers-reduced-motion; funcional sin JavaScript.
