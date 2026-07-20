// QA final: viewports, âncoras, teclado, reduced motion, sem JS,
// reload no meio, resize, orientação, troca de aba, contraste, console.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { irPara } from './lib-scroll.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(OUT, { recursive: true });
const URL = 'http://localhost:4173/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWPORTS = [
  [390, 844], [430, 932], [768, 1024], [1024, 768],
  [1366, 768], [1440, 900], [1920, 1080], [2560, 1440],
];

const rel = { consoleErrors: [], pageErrors: [], overflow: [], checks: [], contraste: [] };
let PASSO = 'inicio';

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

async function abrir(w, h, opts = {}) {
  const page = await browser.newPage();
  await page.setViewport({
    width: w, height: h,
    hasTouch: !!opts.touch, isMobile: !!opts.touch,
  });
  if (opts.reduce) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  if (opts.noJs) await page.setJavaScriptEnabled(false);
  await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
  page.on('console', (m) => { if (m.type() === 'error') rel.consoleErrors.push(`[${w}x${h}] ${m.text()}`); });
  page.on('pageerror', (e) => rel.pageErrors.push(`[${PASSO}][${w}x${h}] ${e.message}`));
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 45000 });
  if (!opts.noJs) await page.evaluate(() => document.fonts.ready);
  await wait(700);
  return page;
}

async function percorrer(page, volta = false) {
  await page.evaluate(async () => {
    const passo = window.innerHeight * 0.35;
    for (let y = 0; y <= document.body.scrollHeight; y += passo) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
  });
  await wait(500);
  if (volta) {
    await page.evaluate(async () => {
      const passo = window.innerHeight * 0.35;
      for (let y = document.body.scrollHeight; y >= 0; y -= passo) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 70));
      }
    });
    await wait(500);
  }
}

async function checarOverflow(page, tag) {
  const o = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  if (o.sw > o.cw + 1) rel.overflow.push(`${tag}: ${o.sw} > ${o.cw}`);
}

/* 1. viewports: ida e volta, overflow */
for (const [w, h] of VIEWPORTS) {
  const touch = w <= 430;
  const page = await abrir(w, h, { touch });
  await percorrer(page, true);
  await checarOverflow(page, `${w}x${h}`);
  if (w === 1440 || w === 390) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(500);
    await page.screenshot({ path: join(OUT, `final-full-${w}.png`), fullPage: true });
  }
  await page.close();
}

/* 2. âncoras */
{
  const page = await abrir(1440, 900);
  for (const id of ['#servicos', '#projetos', '#estudio', '#contato', '#topo']) {
    await page.evaluate((s) => document.querySelector(`a[href="${s}"]`).click(), id);
    await wait(2400);
    const r = await page.evaluate((s) => {
      const t = document.querySelector(s);
      return { hash: location.hash, top: Math.round(t.getBoundingClientRect().top) };
    }, id);
    rel.checks.push(`ancora ${id} -> hash ${r.hash} topo ${r.top}px`);
  }
  await page.close();
}

PASSO = 'teclado';
/* 3. teclado */
{
  const page = await abrir(1440, 900);
  await page.evaluate(() => window.scrollTo(0, 0));
  const ordem = [];
  for (let i = 0; i < 22; i += 1) {
    await page.keyboard.press('Tab');
    await wait(110);
    ordem.push(await page.evaluate(() => {
      const el = document.activeElement;
      const cls = (el.className || '').toString().split(' ')[0];
      return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`;
    }));
  }
  rel.checks.push(`tab: ${ordem.join(' > ')}`);
  // foco visível?
  rel.checks.push(await page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return `foco visivel: outline=${cs.outlineWidth} ${cs.outlineStyle}`;
  }));
  await page.close();
}

PASSO = 'reload';
/* 4. reload no meio */
{
  const page = await abrir(1440, 900);
  await irPara(page, '.prch', 0);
  const antes = await page.evaluate(() => Math.round(window.scrollY));
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(2000);
  const depois = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    ov: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  rel.checks.push(`reload no meio: antes=${antes} depois=${depois.y} overflowX=${depois.ov}`);
  await page.screenshot({ path: join(OUT, 'final-reload.png') });
  await page.close();
}

/* 5. resize / orientação / aba */
{
  const page = await abrir(1440, 900);
  await irPara(page, '.prjp', 0);
  await page.setViewport({ width: 1024, height: 768 });
  await wait(1400);
  await checarOverflow(page, 'resize-1024');
  await page.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await wait(1600);
  await checarOverflow(page, 'resize-390');
  await page.setViewport({ width: 844, height: 390, hasTouch: true, isMobile: true });
  await wait(1400);
  await checarOverflow(page, 'orientacao-844x390');
  await page.setViewport({ width: 1440, height: 900 });
  await wait(1600);
  await checarOverflow(page, 'volta-1440');
  const outra = await browser.newPage();
  await outra.goto('about:blank');
  await wait(1000);
  await page.bringToFront();
  await wait(1200);
  rel.checks.push(`apos aba: overflowX=${await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)}`);
  await outra.close();
  await page.close();
}

PASSO = 'reduced';
/* 6. reduced motion */
{
  const page = await abrir(1440, 900, { reduce: true });
  await percorrer(page);
  const st = await page.evaluate(() => {
    const sel = ['.tese-close', '.svcp-name', '.prjp-name', '.prch-card-name',
      '.estd-title', '.estd-topic-desc', '.cta-btn', '.ft-mark'];
    return {
      cenas: {
        tese: document.querySelector('.tese').classList.contains('is-scene'),
        svcp: document.querySelector('.svcp').classList.contains('is-scene'),
        prjp: document.querySelector('.prjp').classList.contains('is-scene'),
        prch: document.querySelector('.prch').classList.contains('is-scene'),
      },
      vis: sel.map((s) => {
        const el = document.querySelector(s);
        if (!el) return `${s} AUSENTE`;
        const cs = getComputedStyle(el);
        return `${s} op=${cs.opacity} vis=${cs.visibility}`;
      }),
    };
  });
  rel.checks.push(`reduced cenas: ${JSON.stringify(st.cenas)}`);
  rel.checks.push(...st.vis.map((v) => `reduced ${v}`));
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(400);
  await page.screenshot({ path: join(OUT, 'final-reduced-full.png'), fullPage: true });
  await checarOverflow(page, 'reduced');
  await page.close();
}

PASSO = 'nojs';
/* 7. sem JavaScript */
{
  const page = await abrir(1440, 900, { noJs: true });
  const st = await page.evaluate(() => {
    const sel = ['.tese-close', '.svcp-name', '.prjp-name', '.prjp-flow', '.prch-card-name',
      '.estd-topic-desc', '.estd-preview', '.cta-btn', '.ft-mark'];
    return sel.map((s) => {
      const el = document.querySelector(s);
      if (!el) return `${s} AUSENTE`;
      const cs = getComputedStyle(el);
      return `${s} op=${cs.opacity} vis=${cs.visibility} disp=${cs.display}`;
    });
  });
  rel.checks.push(...st.map((v) => `no-js ${v}`));
  await page.screenshot({ path: join(OUT, 'final-nojs-full.png'), fullPage: true });
  await checarOverflow(page, 'no-js');
  await page.close();
}

PASSO = 'contraste';
/* 8. contraste */
{
  const page = await abrir(1440, 900);
  await percorrer(page);
  const linhas = await page.evaluate(() => {
    const lum = ([r, g, b]) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const parse = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
    const bgDe = (el) => {
      let n = el;
      while (n && n !== document.documentElement) {
        const bg = getComputedStyle(n).backgroundColor;
        if (bg && !bg.includes('rgba(0, 0, 0, 0)')) return parse(bg);
        n = n.parentElement;
      }
      return [250, 248, 244];
    };
    const mix = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));
    const sels = [
      '.tese-principal', '.tese-cen', '.tese-close', '.tese-cen-intro',
      '.svcp-label', '.svcp-open-sub', '.svcp-name', '.svcp-desc', '.svcp-floor-text',
      '.prjp-meta', '.prjp-name', '.prjp-sum', '.prjp-link',
      '.prch-label', '.prch-card-name', '.prch-card-desc', '.prch-card-tags', '.prch-end-title',
      '.estd-label', '.estd-title', '.estd-text', '.estd-topic-name', '.estd-topic-desc',
      '.estd-preview figcaption',
      '.cta-eyebrow', '.cta-text', '.cta-btn',
      '.ft-tag', '.ft-label', '.ft-link', '.ft-num', '.ft-meta', '.ft-meta--desc', '.ft-top',
    ];
    return sels.map((s) => {
      const el = document.querySelector(s);
      if (!el) return { s, nota: 'ausente' };
      const cs = getComputedStyle(el);
      const bg = bgDe(el);
      const m = cs.color.match(/[\d.]+/g).map(Number);
      const fg = m.length > 3 ? mix(m.slice(0, 3), m[3], bg) : m.slice(0, 3);
      const l1 = lum(fg); const l2 = lum(bg);
      const r = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const px = parseFloat(cs.fontSize);
      const grande = px >= 24 || (parseInt(cs.fontWeight, 10) >= 700 && px >= 18.66);
      return { s, r: Math.round(r * 100) / 100, px: Math.round(px), min: grande ? 3 : 4.5 };
    });
  });
  linhas.forEach((l) => {
    if (l.nota) return;
    if (l.r < l.min) rel.contraste.push(`ABAIXO ${l.r} (min ${l.min}, ${l.px}px) ${l.s}`);
  });
  rel.checks.push(`contraste: ${linhas.filter((l) => !l.nota).length} medidos, ${rel.contraste.length} abaixo`);
  await page.close();
}

/* 9. capturas por seção (desktop + mobile) */
{
  const page = await abrir(1440, 900);
  await percorrer(page);
  for (const [nome, sel] of [
    ['sec-tese', '.tese'], ['sec-svcp', '.svcp'], ['sec-prjp', '.prjp'],
    ['sec-prch', '.prch'], ['sec-estd', '.estd'], ['sec-cta', '.cta'], ['sec-ft', '.ft'],
  ]) {
    await irPara(page, sel, 0);
    await page.screenshot({ path: join(OUT, `final-${nome}.png`) });
  }
  await page.close();
}
{
  const page = await abrir(390, 844, { touch: true });
  await percorrer(page);
  for (const [nome, sel] of [
    ['m-tese', '.tese'], ['m-svcp', '.svcp'], ['m-prjp', '.prjp'],
    ['m-prch', '.prch'], ['m-estd', '.estd'], ['m-cta', '.cta'], ['m-ft', '.ft'],
  ]) {
    await irPara(page, sel, 0);
    await page.screenshot({ path: join(OUT, `final-${nome}.png`) });
  }
  await page.close();
}

await browser.close();
writeFileSync(join(OUT, 'relatorio.json'), JSON.stringify(rel, null, 2));
console.log(JSON.stringify(rel, null, 2));
