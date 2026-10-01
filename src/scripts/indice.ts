import { onPage } from './lifecycle';

/**
 * Resalta en el índice la sección que se está leyendo: la última cuyo inicio ha cruzado el 40 % del alto de la ventana
 * (la primera si aún no ha cruzado ninguna; la última al llegar al final). IntersectionObserver avisa al entrar y salir
 * de las secciones en esa franja; el desplazamiento solo se escucha para el caso del final de página.
 */
export function iniciarIndice(nav: HTMLElement): () => void {
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('[data-indice-link]')];
  const secciones = links.map((l) => document.getElementById(l.dataset.indiceLink!)).filter((s): s is HTMLElement => !!s);
  if (!secciones.length) return () => {};
  const lista = nav.querySelector('ol');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let actual = '';
  const marcar = (id: string) => {
    if (id === actual) return;
    actual = id;
    links.forEach((l) => (l.dataset.indiceLink === id ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
    // En móvil, la pastilla activa se desplaza a la vista dentro de la tira (sin mover la página).
    const a = links.find((l) => l.dataset.indiceLink === id);
    if (a && lista && lista.scrollWidth > lista.clientWidth) lista.scrollTo({ left: a.parentElement!.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
  };
  const calcular = () => {
    const linea = innerHeight * 0.4;
    let id = secciones[0].id;
    for (const s of secciones) if (s.getBoundingClientRect().top <= linea) id = s.id;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) id = secciones[secciones.length - 1].id;
    marcar(id);
  };
  let raf = 0;
  const pedir = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; calcular(); }); };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(pedir, { rootMargin: '-40% 0px -59% 0px' }) : null;
  secciones.forEach((s) => io?.observe(s));
  // El final de la página no cruza ninguna franja: solo para ese caso se mira el desplazamiento.
  const ultima = secciones[secciones.length - 1].id;
  const alFinal = () => { if (actual === ultima || innerHeight + scrollY >= document.documentElement.scrollHeight - 4) pedir(); };
  if (!io) addEventListener('scroll', pedir, { passive: true });
  addEventListener('scroll', alFinal, { passive: true });
  calcular();
  return () => { io?.disconnect(); removeEventListener('scroll', pedir); removeEventListener('scroll', alFinal); cancelAnimationFrame(raf); };
}

onPage(() => {
  const nav = document.querySelector<HTMLElement>('[data-indice]');
  return nav ? iniciarIndice(nav) : undefined;
});
