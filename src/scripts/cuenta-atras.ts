import { gsap } from 'gsap';
import { onPage } from './lifecycle';
import { restante, fraseRestante } from '../lib/proximo';
import { countUp, killCounters } from './counters';

/** Cuenta atrás del próximo curso: días · horas · min, actualizada al cambiar cada minuto. Sin JS se ve la fecha. */
export function iniciarCuenta(root: HTMLElement): () => void {
  const inicio = Date.parse(root.dataset.inicio ?? '');
  const vis = root.querySelector<HTMLElement>('.cuenta-js');
  const frase = root.querySelector<HTMLElement>('[data-cuenta-frase]');
  const d = root.querySelector<HTMLElement>('[data-cuenta-d]');
  const h = root.querySelector<HTMLElement>('[data-cuenta-h]');
  const m = root.querySelector<HTMLElement>('[data-cuenta-m]');
  if (Number.isNaN(inicio) || !vis || !d || !h || !m) return () => {};
  let t: number | undefined;
  const pintar = () => {
    const ahora = Date.now();
    const r = restante(inicio, ahora);
    if (!r) { root.classList.remove('is-js'); vis.hidden = true; if (frase) frase.textContent = ''; return; }
    root.classList.add('is-js'); vis.hidden = false;
    d.textContent = String(r.dias); h.textContent = String(r.horas).padStart(2, '0'); m.textContent = String(r.min).padStart(2, '0');
    if (frase) frase.textContent = `${fraseRestante(r)} para el inicio.`;
    // Siguiente pintado justo al cambiar de minuto.
    t = window.setTimeout(pintar, 60_000 - (ahora % 60_000) + 50);
  };
  pintar();
  return () => window.clearTimeout(t);
}

/** Inclinación 3D del cartel siguiendo el puntero (solo puntero fino y sin movimiento reducido). */
function iniciarInclinacion(root: HTMLElement): () => void {
  const obj = root.querySelector<HTMLElement>('[data-tilt]');
  const cartel = obj?.querySelector<HTMLElement>('[data-tilt-cartel]');
  if (!obj || !cartel) return () => {};
  const mm = gsap.matchMedia();
  mm.add('(pointer: fine) and (prefers-reduced-motion: no-preference) and (min-width: 900px)', () => {
    const rx = gsap.quickTo(cartel, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(cartel, 'rotationY', { duration: 0.6, ease: 'power3' });
    gsap.set(cartel, { rotationX: 3, rotationY: -7, rotationZ: 0.6, transformPerspective: 1200 });
    const move = (e: PointerEvent) => {
      const r = obj.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      ry(gsap.utils.clamp(-12, 12, px * 16 - 4)); rx(gsap.utils.clamp(-10, 10, -py * 12 + 2));
      cartel.style.setProperty('--bx', `${(px + 0.5) * 100}%`); cartel.style.setProperty('--by', `${(py + 0.5) * 100}%`);
      obj.classList.add('is-activo');
    };
    const leave = () => { rx(3); ry(-7); obj.classList.remove('is-activo'); };
    root.addEventListener('pointermove', move); root.addEventListener('pointerleave', leave);
    // Entrada del cartel: se posa desde algo más de inclinación.
    gsap.from(cartel, { rotationY: -22, rotationX: 8, y: 30, autoAlpha: 0, duration: 1.1, ease: 'expo.out', delay: 0.1 });
    return () => { root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', leave); gsap.set(cartel, { clearProps: 'all' }); obj.classList.remove('is-activo'); };
  });
  return () => mm.revert();
}

onPage(() => {
  const root = document.querySelector<HTMLElement>('[data-proximo]');
  if (!root) return;
  const offs = [...[...root.querySelectorAll<HTMLElement>('[data-cuenta]')].map(iniciarCuenta), iniciarInclinacion(root)];
  // Cifras de la tira inferior: cuentan al cargar (están en la primera vista).
  const nums = [...root.querySelectorAll<HTMLElement>('[data-in-hero] .num')];
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) countUp(nums);
  return () => { offs.forEach((f) => f()); killCounters(nums); };
});
