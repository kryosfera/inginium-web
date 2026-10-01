// Orígenes: backups/webflow-2026/inginium-ksf/pages/_pages.json y plantillas CMS. Exactas antes que comodines.
export const REDIRECTS = [
  ['/courses', '/cursos'],
  ['/teachers', '/profesorado'],
  ['/about-us', '/acerca'],
  ['/contact-us', '/contacto'],
  ['/aviso-legal', '/legal/aviso-legal'],
  ['/politica-de-privacidad', '/legal/privacidad'],
  ['/blog', '/'], ['/events', '/'], ['/checkout', '/'], ['/paypal-checkout', '/'], ['/order-confirmation', '/'],
  ['/start-here', '/'], ['/changelog', '/'], ['/licenses', '/'], ['/style-guide', '/'], ['/401', '/'],
  ['/product', '/cursos'], ['/course', '/cursos'], ['/category', '/cursos'], ['/sku', '/cursos'],
  ['/teacher', '/profesorado'], ['/blog-category', '/'], ['/post', '/'], ['/event', '/'],
  ['/product/*', '/cursos'],
  ['/course/*', '/cursos'],
  ['/category/*', '/cursos'],
  ['/sku/*', '/cursos'],
  ['/teacher/*', '/profesorado'],
  ['/blog-category/*', '/'],
  ['/post/*', '/'],
  ['/event/*', '/'],
] as const satisfies ReadonlyArray<readonly [string, string]>;

/** Una regla por curso y por docente importados (van antes de REDIRECTS, que acaba en comodines). */
export function redireccionesDinamicas(cursos: string[], docentes: string[]): [string, string][] {
  return [
    ...cursos.map((s): [string, string] => [`/product/${s}`, `/cursos/${s}`]),
    ...docentes.map((s): [string, string] => [`/teacher/${s}`, `/profesorado/${s}`]),
  ];
}

/** Reglas en el formato `_redirects` de Cloudflare (una por línea). */
export function toRedirectsFile(rules: ReadonlyArray<readonly [string, string]>): string {
  const out: string[] = [];
  for (const [from, to] of rules) {
    out.push(`${from} ${to} 301`);
    if (!from.includes('*') && from !== '/') out.push(`${from}/ ${to} 301`);
  }
  return out.join('\n') + '\n';
}
