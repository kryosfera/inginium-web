import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { onPage } from './lifecycle';

gsap.registerPlugin(Flip);

/** Vista previa por especialidad de la home: muestra hasta `max` cursos de la elegida y anima el cambio con Flip. */
export function iniciarExplora(root: HTMLElement): () => void {
  const max = Number(root.dataset.max) || 6;
  const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-exp]')];
  const items = [...root.querySelectorAll<HTMLElement>('[data-exp-item]')];
  const enlaces = root.querySelector<HTMLElement>('[data-exp-enlaces]');
  const grupo = root.querySelector<HTMLElement>('[data-exp-chips]');
  const todos = root.querySelector<HTMLAnchorElement>('[data-exp-todos]');
  const todosTxt = root.querySelector<HTMLElement>('[data-exp-todos-txt]');
  const estado = root.querySelector<HTMLElement>('[data-exp-estado]');
  if (!chips.length || !grupo) return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (enlaces) enlaces.hidden = true;
  grupo.hidden = false;

  const elegir = (chip: HTMLButtonElement) => {
    const slug = chip.dataset.exp ?? '';
    const nombre = chip.dataset.nombre ?? '';
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    const coinciden = items.filter((it) => !slug || (it.dataset.especialidades ?? '').split(' ').includes(slug));
    const mostrar = new Set(coinciden.slice(0, max));
    if (!reduce) { gsap.killTweensOf(items); Flip.killFlipsOf(items); gsap.set(items, { clearProps: 'transform,opacity,visibility' }); }
    const st = reduce ? null : Flip.getState(items);
    items.forEach((it) => { it.hidden = !mostrar.has(it); });
    if (todos) todos.href = slug ? `/cursos?especialidad=${slug}` : '/cursos';
    if (todosTxt) todosTxt.textContent = slug ? `Ver ${coinciden.length === 1 ? 'el curso' : `los ${coinciden.length} cursos`} de ${nombre}` : 'Ver todos los cursos';
    if (estado) estado.textContent = slug ? `${nombre}: ${Math.min(coinciden.length, max)} de ${coinciden.length} ${coinciden.length === 1 ? 'curso' : 'cursos'}` : '';
    if (st) {
      Flip.from(st, { duration: 0.55, ease: 'power3.out', absolute: true, scale: false,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }),
        onComplete: () => gsap.set(items, { clearProps: 'transform,opacity,visibility' }) });
    }
  };
  const offs = chips.map((c) => { const fn = () => elegir(c); c.addEventListener('click', fn); return () => c.removeEventListener('click', fn); });
  return () => { offs.forEach((f) => f()); gsap.killTweensOf(items); Flip.killFlipsOf(items); };
}

onPage(() => {
  const root = document.querySelector<HTMLElement>('[data-explora]');
  return root ? iniciarExplora(root) : undefined;
});
