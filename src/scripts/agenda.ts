import { onPage } from './lifecycle';

/**
 * Progreso de lectura de la agenda: la línea de cada sección se rellena en lima hasta la marca de lectura (45 % del alto
 * de la ventana), las sesiones ya pasadas quedan marcadas y la última que cruzó la marca es el nodo activo.
 * Es estado, no adorno: también con movimiento reducido (sin transiciones). Sin JS la agenda se lee igual.
 */
export function iniciarAgenda(root: HTMLElement): () => void {
  const listas = [...root.querySelectorAll<HTMLElement>('[data-agenda-lista]')];
  let raf = 0;
  const pintar = () => {
    raf = 0;
    const marca = innerHeight * 0.45;
    let activo: HTMLElement | null = null;
    for (const lista of listas) {
      const relleno = lista.querySelector<HTMLElement>('[data-agenda-relleno]');
      const items = [...lista.querySelectorAll<HTMLElement>('[data-agenda-item]')];
      if (!lista.offsetParent) continue; // sección plegada
      const linea = relleno?.parentElement?.getBoundingClientRect();
      if (relleno && linea) relleno.style.setProperty('--p', String(Math.min(1, Math.max(0, (marca - linea.top) / Math.max(1, linea.height)))));
      for (const it of items) {
        const top = it.getBoundingClientRect().top + 14;
        const hecho = top <= marca;
        it.classList.toggle('is-hecho', hecho);
        if (hecho) activo = it;
      }
    }
    root.querySelectorAll('.is-activo').forEach((el) => { if (el !== activo) el.classList.remove('is-activo'); });
    activo?.classList.add('is-activo');
  };
  const pedir = () => { if (!raf) raf = requestAnimationFrame(pintar); };
  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', pedir);
  root.addEventListener('toggle', pedir, true);
  pintar();
  return () => { removeEventListener('scroll', pedir); removeEventListener('resize', pedir); root.removeEventListener('toggle', pedir, true); cancelAnimationFrame(raf); };
}

onPage(() => {
  const root = document.querySelector<HTMLElement>('[data-agenda]');
  return root ? iniciarAgenda(root) : undefined;
});
