import { getImage } from 'astro:assets';

// Calidad por formato de las fotos de cabecera (HomeHero y SectionHero). Con la misma calidad, el AVIF pesaba
// un 15-35 % más que el WebP y el navegador elige el AVIF; a 45 pesa menos que el WebP a 60 (medido en dist).
export const CALIDAD_CABECERA = { avif: 45, webp: 60 } as const;
const ANCHOS = [960, 1600, 2400];
export const SIZES_CABECERA = '100vw';

/** srcset AVIF y WebP (sin ampliar la original) y un WebP de 1600 px como <img> de reserva. */
export async function fuentesCabecera(src: ImageMetadata) {
  const anchos = [...new Set([...ANCHOS.filter((w) => w < src.width), Math.min(src.width, ANCHOS.at(-1)!)])];
  const srcset = async (format: 'avif' | 'webp') => (await Promise.all(anchos.map(async (w) =>
    `${(await getImage({ src, width: w, format, quality: CALIDAD_CABECERA[format] })).src} ${w}w`))).join(', ');
  const base = await getImage({ src, width: Math.min(src.width, 1600), format: 'webp', quality: CALIDAD_CABECERA.webp });
  return { avif: await srcset('avif'), webp: await srcset('webp'), src: base.src, w: base.attributes.width as number, h: base.attributes.height as number };
}
