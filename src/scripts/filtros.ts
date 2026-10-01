import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { onPage } from './lifecycle';
import { leerFiltro, escribirFiltro, aplicarFiltro, type CursoFiltrable, type Filtro } from '../lib/filtros';
import { slugEspecialidad } from '../lib/cursos';

gsap.registerPlugin(Flip);

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

  const activos = document.getElementById('activos')!;
  const archivo = document.getElementById('archivo')!;
  const vacioActivos = activos.querySelector<HTMLElement>('.vacio')!;
  const limpiar = () => gsap.set(cards, { clearProps: 'transform,opacity,visibility' });
  const detener = () => { gsap.killTweensOf(cards); Flip.killFlipsOf(cards); };

  const pintar = (animar: boolean) => {
    anio.value = f.anio ? String(f.anio) : '';
    chips.forEach((c) => c.setAttribute('aria-pressed', String(!!f.especialidad && slugEspecialidad(f.especialidad) === c.dataset.esp)));
    const visibles = new Set(aplicarFiltro(lista, f).map((c) => c.id));
    const conAnimacion = animar && !reduce;
    if (conAnimacion) { detener(); limpiar(); }
    const estado = conAnimacion ? Flip.getState(cards) : null;
    for (const [id, el] of porId) el.hidden = !visibles.has(id);
    const hayFiltro = !!(f.especialidad || f.anio || f.q);
    // Con filtro, la sección de activos solo se oculta si no queda ningún resultado; si hay resultados solo en el archivo, avisa en su sitio.
    const nActivos = activos.querySelectorAll('.card:not([hidden])').length;
    activos.hidden = visibles.size === 0;
    archivo.hidden = !archivo.querySelector('.card:not([hidden])');
    vacioActivos.hidden = nActivos > 0;
    vacioActivos.textContent = hayFiltro ? 'Ningún curso activo coincide con el filtro.' : 'Pronto anunciaremos nuevos cursos.';
    resultado.textContent = !hayFiltro ? '' : visibles.size ? `${visibles.size} ${visibles.size === 1 ? 'curso' : 'cursos'}` : 'Ningún curso coincide con el filtro.';
    if (estado) Flip.from(estado, { duration: 0.45, ease: 'power2.out', absolute: true, scale: false,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.3 }),
      onComplete: limpiar });
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
  q.value = f.q;
  chips.forEach((c) => { c.closest<HTMLElement>('.chips')!.hidden = false; });
  pintar(false);
  // Entrada inicial propia (opacidad y desplazamiento, sin scale) para no chocar con Flip.
  if (!reduce) gsap.from(cards.filter((c) => !c.hidden), { opacity: 0, y: 24, duration: 0.6, ease: 'power3.out', stagger: { amount: 0.5 }, clearProps: 'transform,opacity,visibility' });
  return () => { clearTimeout(t); detener(); offs.forEach((x) => x()); };
});
