import { onPage } from './lifecycle';

/** Resalta en el índice la sección que cruza la franja de lectura (IntersectionObserver). Al final de la página, la última. */
export function iniciarIndice(nav: HTMLElement): () => void {
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('[data-indice-link]')];
  const secciones = links.map((l) => document.getElementById(l.dataset.indiceLink!)).filter((s): s is HTMLElement => !!s);
  if (!secciones.length || !('IntersectionObserver' in window)) return () => {};
  const lista = nav.querySelector('ol');
  let actual = '';
  const marcar = (id: string) => {
    if (id === actual) return;
    actual = id;
    links.forEach((l) => (l.dataset.indiceLink === id ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
    // En móvil, la pastilla activa se desplaza a la vista dentro de la tira (sin mover la página).
    const a = links.find((l) => l.dataset.indiceLink === id);
    if (a && lista && lista.scrollWidth > lista.clientWidth) {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      lista.scrollTo({ left: a.parentElement!.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
    }
  };
  const io = new IntersectionObserver((es) => {
    const visibles = es.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
    if (visibles.length) marcar(visibles[visibles.length - 1].id);
  }, { rootMargin: '-35% 0px -60% 0px' });
  secciones.forEach((s) => io.observe(s));
  const alFinal = () => { if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) marcar(secciones[secciones.length - 1].id); };
  addEventListener('scroll', alFinal, { passive: true });
  return () => { io.disconnect(); removeEventListener('scroll', alFinal); };
}

onPage(() => {
  const nav = document.querySelector<HTMLElement>('[data-indice]');
  return nav ? iniciarIndice(nav) : undefined;
});
