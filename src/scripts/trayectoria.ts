import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage } from './lifecycle';

gsap.registerPlugin(ScrollTrigger);

/**
 * Trayectoria: en escritorio (≥1024 px) y sin movimiento reducido, la lista por años se convierte en una pista horizontal
 * que avanza con el scroll (sección fijada, scrub) y una barra lima de progreso. Fuera de esa condición, lista vertical.
 */
export function iniciarTrayectoria(root: HTMLElement): () => void {
  const pista = root.querySelector<HTMLElement>('[data-tray-pista]');
  const vp = root.querySelector<HTMLElement>('[data-tray-vp]');
  const barra = root.querySelector<HTMLElement>('[data-tray-barra]');
  if (!pista || !vp) return () => {};
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    root.classList.add('is-horizontal');
    const anios = [...root.querySelectorAll<HTMLElement>('[data-tray-anio]')];
    const distancia = () => Math.max(0, pista.scrollWidth - vp.clientWidth);
    const avance = gsap.to(pista, {
      x: () => -distancia(), ease: 'none',
      scrollTrigger: {
        trigger: root, start: 'top top', end: () => `+=${Math.round(distancia() * 0.75)}`, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        // Se recalcula antes que los disparadores de más abajo (el pin añade altura a la página).
        refreshPriority: 1,
        onUpdate: (self) => { if (barra) gsap.set(barra, { scaleX: self.progress }); },
      },
    });
    // El año que cruza el centro se ilumina en lima.
    anios.forEach((a) => ScrollTrigger.create({ trigger: a, containerAnimation: avance, start: 'left 60%', end: 'right 40%', toggleClass: 'is-actual' }));
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    return () => { root.classList.remove('is-horizontal'); anios.forEach((a) => a.classList.remove('is-actual')); };
  });
  return () => mm.revert();
}

onPage(() => {
  const root = document.querySelector<HTMLElement>('[data-trayectoria]');
  return root ? iniciarTrayectoria(root) : undefined;
});
