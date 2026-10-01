import { gsap } from 'gsap';
import { onPage } from './lifecycle';

const PERIODO = 6;   // s entre cambios de foto
const FUNDIDO = 1.6; // s de fundido cruzado
const ESPERA_MAX = 4000; // ms máximos esperando a que cargue la foto siguiente

/** Promueve data-srcset/data-src a srcset/src para que el navegador descargue la capa. Devuelve su <img>. */
function load(capa: HTMLElement): HTMLImageElement | null {
  capa.querySelectorAll<HTMLSourceElement | HTMLImageElement>('[data-srcset], [data-src]').forEach((el) => {
    if (el.dataset.srcset) { el.setAttribute('srcset', el.dataset.srcset); delete el.dataset.srcset; }
    if (el.dataset.src) { el.setAttribute('src', el.dataset.src); delete el.dataset.src; }
  });
  return capa.querySelector('img');
}

export function initHomeHero(root: HTMLElement): () => void {
  const capas = [...root.querySelectorAll<HTMLElement>('[data-hero-layer]')];
  const pause = root.querySelector<HTMLButtonElement>('[data-hero-pause]');
  const glyph = pause?.querySelector<HTMLElement>('[data-hero-glyph]');
  const offs: Array<() => void> = [];
  // Todas las animaciones en curso: la rotación solapa el fundido y el movimiento de la foto anterior con el siguiente paso.
  let anims: gsap.core.Animation[] = [];
  let espera: number | undefined;
  let pausado = false;
  let vivo = true;

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    if (capas.length < 2) return;
    pausado = false; vivo = true;
    gsap.set(capas.slice(1), { autoAlpha: 0 });
    anims.push(gsap.fromTo(capas[0].querySelector('img'), { scale: 1.06 }, { scale: 1, duration: PERIODO + FUNDIDO, ease: 'none' }));

    /** Cuando la imagen está lista (o pasa el tiempo máximo) ejecuta fn. */
    const cuandoLista = (img: HTMLImageElement | null, fn: () => void) => {
      if (!img || img.complete) { fn(); return; }
      const fin = () => { window.clearTimeout(espera); img.removeEventListener('load', fin); img.removeEventListener('error', fin); if (vivo) fn(); };
      img.addEventListener('load', fin); img.addEventListener('error', fin);
      espera = window.setTimeout(fin, ESPERA_MAX);
    };

    const siguiente = (actual: number) => {
      const n = (actual + 1) % capas.length;
      cuandoLista(load(capas[n]), () => {
        const img = capas[n].querySelector('img');
        capas[actual].classList.remove('is-on'); capas[n].classList.add('is-on');
        const paso = gsap.timeline()
          .to(capas[actual], { autoAlpha: 0, duration: FUNDIDO, ease: 'power2.inOut' }, 0)
          .fromTo(capas[n], { autoAlpha: 0 }, { autoAlpha: 1, duration: FUNDIDO, ease: 'power2.inOut' }, 0)
          .fromTo(img, { scale: 1.06 }, { scale: 1, duration: PERIODO + FUNDIDO, ease: 'none' }, 0)
          // La foto de después se promueve a mitad de periodo para que ya esté lista al tocarle.
          .call(() => { if (vivo) load(capas[(n + 1) % capas.length]); }, undefined, PERIODO / 2)
          .call(() => { if (vivo) siguiente(n); }, undefined, PERIODO);
        paso.paused(pausado);
        anims = anims.filter((a) => a.progress() < 1); anims.push(paso);
      });
    };
    // La segunda foto se promueve a los 3 s; el primer cambio ocurre a los PERIODO s.
    const arranque = gsap.timeline()
      .call(() => load(capas[1]), undefined, PERIODO / 2)
      .call(() => siguiente(0), undefined, PERIODO);
    anims.push(arranque);

    if (pause) {
      pause.hidden = false;
      const alternar = () => {
        pausado = !pausado;
        anims.forEach((a) => a.paused(pausado));
        pause.setAttribute('aria-pressed', String(pausado));
        if (glyph) glyph.textContent = pausado ? '▶' : '❚❚';
      };
      pause.addEventListener('click', alternar);
      offs.push(() => pause.removeEventListener('click', alternar));
    }

    return () => {
      vivo = false; window.clearTimeout(espera);
      anims.forEach((a) => a.kill()); anims = [];
      gsap.killTweensOf(capas); capas.forEach((c) => gsap.set(c, { clearProps: 'all' }));
      gsap.set(capas.map((c) => c.querySelector('img')), { clearProps: 'all' });
      capas.forEach((c, i) => c.classList.toggle('is-on', i === 0));
      if (pause) pause.hidden = true;
    };
  });
  return () => { mm.revert(); offs.forEach((f) => f()); };
}

onPage(() => {
  const root = document.querySelector<HTMLElement>('[data-home-hero]');
  return root ? initHomeHero(root) : undefined;
});
