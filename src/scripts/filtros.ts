import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage } from './lifecycle';
import { leerFiltro, escribirFiltro, aplicarFiltro, type CursoFiltrable, type Filtro } from '../lib/filtros';
import { slugEspecialidad } from '../lib/cursos';

gsap.registerPlugin(Flip, ScrollTrigger);

onPage(() => {
  const form = document.querySelector<HTMLFormElement>('form.filtros');
  const datos = document.getElementById('filtro-datos');
  if (!form || !datos) return;
  const { especialidades, anios } = JSON.parse(datos.textContent!) as { especialidades: string[]; anios: number[] };
  const cards = [...document.querySelectorAll<HTMLElement>('.card[data-id]')];
  const porId = new Map(cards.map((el) => [el.dataset.id!, el]));
  const lista: CursoFiltrable[] = cards.map((el) => ({
    id: el.dataset.id!, titulo: el.dataset.texto!, resumen: '',
    especialidades: especialidades.filter((e) => (el.dataset.especialidades ?? '').split(' ').includes(slugEspecialidad(e))),
    anio: el.dataset.anio ? Number(el.dataset.anio) : null, estado: el.dataset.estado as 'activo' | 'finalizado',
  }));
  const q = form.querySelector<HTMLInputElement>('input[name="q"]')!;
  const anio = form.querySelector<HTMLSelectElement>('select[name="anio"]')!;
  const chips = [...form.querySelectorAll<HTMLButtonElement>('[data-esp]')];
  const resultado = form.querySelector<HTMLElement>('.resultado')!;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let f: Filtro = leerFiltro(new URLSearchParams(location.search), especialidades, anios);

  const pintar = (animar: boolean) => {
    q.value = f.q; anio.value = f.anio ? String(f.anio) : '';
    chips.forEach((c) => c.setAttribute('aria-pressed', String(!!f.especialidad && slugEspecialidad(f.especialidad) === c.dataset.esp)));
    const visibles = new Set(aplicarFiltro(lista, f).map((c) => c.id));
    const estado = animar && !reduce ? Flip.getState(cards) : null;
    for (const [id, el] of porId) el.hidden = !visibles.has(id);
    document.querySelectorAll<HTMLElement>('#activos, #archivo').forEach((s) => { s.hidden = !s.querySelector('.card:not([hidden])'); });
    const hayFiltro = !!(f.especialidad || f.anio || f.q);
    // Las tarjetas ocultas/mostradas cambian la maquetación: recalcula los disparadores de revelado (si no, las que suben quedarían invisibles).
    ScrollTrigger.refresh();
    resultado.textContent = !hayFiltro ? '' : visibles.size ? `${visibles.size} ${visibles.size === 1 ? 'curso' : 'cursos'}` : 'Ningún curso coincide con el filtro.';
    if (estado) Flip.from(estado, { duration: 0.45, ease: 'power2.out', absolute: true, onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.3 }) });
  };
  const aplicar = () => {
    const qs = escribirFiltro(f);
    history.replaceState(history.state, '', qs ? `/cursos?${qs}` : '/cursos');
    pintar(true);
  };

  const offs: (() => void)[] = [];
  const on = (el: EventTarget, ev: string, fn: EventListener) => { el.addEventListener(ev, fn); offs.push(() => el.removeEventListener(ev, fn)); };
  let t: number | undefined;
  on(q, 'input', () => { clearTimeout(t); t = window.setTimeout(() => { f = { ...f, q: q.value.trim().slice(0, 80) }; aplicar(); }, 180); });
  on(anio, 'change', () => { f = { ...f, anio: anio.value ? Number(anio.value) : null }; aplicar(); });
  on(form, 'submit', (e) => { e.preventDefault(); });
  chips.forEach((c) => on(c, 'click', () => {
    const e = especialidades.find((x) => slugEspecialidad(x) === c.dataset.esp) ?? null;
    f = { ...f, especialidad: f.especialidad === e ? null : e }; aplicar();
  }));
  pintar(false);
  return () => { clearTimeout(t); offs.forEach((x) => x()); };
});
