// Genera public/og.png (1200x630) con las fuentes de marca embebidas (Fontsource, base64),
// renderizando con Chromium para no depender de las fuentes instaladas en la máquina.
import { existsSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const fuente = (paquete: string, fichero: string) =>
  readFileSync(new URL(`../node_modules/${paquete}/files/${fichero}`, import.meta.url)).toString('base64');
const redHat = fuente('@fontsource-variable/red-hat-display', 'red-hat-display-latin-wght-normal.woff2');
const manrope = fuente('@fontsource-variable/manrope', 'manrope-latin-wght-normal.woff2');
const logo = readFileSync(new URL('../src/assets/inginium-logo.svg', import.meta.url), 'utf8');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Red Hat Display';font-weight:300 900;src:url(data:font/woff2;base64,${redHat}) format('woff2')}
@font-face{font-family:'Manrope';font-weight:200 800;src:url(data:font/woff2;base64,${manrope}) format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#0B0B2C;position:relative;overflow:hidden;color:#fff}
.logo{position:absolute;left:80px;top:64px;color:#fff}
.logo svg{height:64px;width:auto;display:block}
h1{position:absolute;left:80px;top:210px;width:900px;font:900 72px/1.12 'Red Hat Display';letter-spacing:-.01em}
h1 span{color:#C1E313}
p.f{position:absolute;left:80px;top:530px;font:700 26px/1 'Manrope';color:#A9B0C8}
</style></head><body>
<div class="logo">${logo}</div>
<h1>Formación continuada para <span>profesionales sanitarios</span></h1>
<p class="f">Inginium · inginium-ksf.com</p>
</body></html>`;

const ejecutable = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const navegador = await chromium.launch({ executablePath: ejecutable });
const page = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
// Márgenes mínimos de 48 px entre el logo y el titular, y entre el titular y el pie.
const caja = await page.evaluate(() => {
  const r = document.createRange(); r.selectNodeContents(document.querySelector('h1')!);
  const rects = [...r.getClientRects()];
  return {
    h1Arriba: Math.min(...rects.map((c) => c.top)), h1Abajo: Math.max(...rects.map((c) => c.bottom)), h1Derecha: Math.max(...rects.map((c) => c.right)),
    logoAbajo: document.querySelector('.logo svg')!.getBoundingClientRect().bottom, pieArriba: document.querySelector('p.f')!.getBoundingClientRect().top,
  };
});
const margenLogo = caja.h1Arriba - caja.logoAbajo;
const margenPie = caja.pieArriba - caja.h1Abajo;
if (margenLogo < 48) throw new Error(`El titular queda a ${Math.round(margenLogo)} px del logo (mínimo 48)`);
if (margenPie < 48) throw new Error(`El titular queda a ${Math.round(margenPie)} px del pie (mínimo 48)`);
if (1200 - caja.h1Derecha < 48) throw new Error(`El titular queda a ${Math.round(1200 - caja.h1Derecha)} px del borde derecho (mínimo 48)`);
await page.screenshot({ path: 'public/og.png' });
await navegador.close();
console.log(`public/og.png generado (margen logo-titular: ${Math.round(margenLogo)} px, titular-pie: ${Math.round(margenPie)} px)`);
