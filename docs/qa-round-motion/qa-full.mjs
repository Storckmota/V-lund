// QA completo da rodada: viewports, cenas, hovers, teclado, âncoras,
// reduced motion, sem JS, scroll reverso, reload no meio, console/pageerror.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(OUT, { recursive: true });
const URL = 'http://localhost:4173/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const VIEWPORTS = [
  [390, 844], [430, 932], [768, 1024], [1024, 768],
  [1366, 768], [1440, 900], [1920, 1080], [2560, 1440],
];

const report = { consoleErrors: [], pageErrors: [], overflow: [], checks: [] };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

async function newPage(w, h, opts = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  if (opts.reduce) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  }
  if (opts.noJs) await page.setJavaScriptEnabled(false);
  await page.evaluateOnNewDocument(() => {
    try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {}
  });
  page.on('console', (m) => { if (m.type() === 'error') report.consoleErrors.push(`[${w}x${h}] ${m.text()}`); });
  page.on('pageerror', (e) => report.pageErrors.push(`[${w}x${h}] ${e.message}`));
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 40000 });
  if (!opts.noJs) await page.evaluate(() => document.fonts.ready);
  await wait(600);
  return page;
}

async function crawl(page, backAndForth = false) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.4;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
  });
  await wait(500);
  if (backAndForth) {
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.4;
      for (let y = document.body.scrollHeight; y >= 0; y -= step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
    });
    await wait(500);
  }
}

async function checkOverflow(page, tag) {
  const ov = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  if (ov.sw > ov.cw + 1) report.overflow.push(`${tag}: ${ov.sw} > ${ov.cw}`);
}

/* ---- 1. todos os viewports: crawl ida e volta, overflow ---- */
for (const [w, h] of VIEWPORTS) {
  const page = await newPage(w, h);
  await crawl(page, true);
  await checkOverflow(page, `${w}x${h}`);
  if (w === 1440 || w === 390) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(500);
    await page.screenshot({ path: join(OUT, `full-${w}.png`), fullPage: true });
  }
  await page.close();
}

/* ---- 2. desktop 1440: cenas, estados, hovers ---- */
{
  const page = await newPage(1440, 900);
  await crawl(page);

  // tese: aproximação gradual para o scrub assentar antes da captura
  for (const [i, p] of [0.05, 0.4, 0.7, 0.96].entries()) {
    await page.evaluate(async (pr) => {
      const wrap = document.querySelector('.tese-pin').parentElement;
      const top = wrap.getBoundingClientRect().top + window.scrollY;
      const target = top + (wrap.offsetHeight - window.innerHeight) * pr;
      const start = window.scrollY;
      for (let k = 1; k <= 10; k += 1) {
        window.scrollTo(0, start + ((target - start) * k) / 10);
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo(0, target);
    }, p);
    await wait(1200);
    await page.screenshot({ path: join(OUT, `d-tese-${i + 1}.png`) });
  }

  // serviços: três estados
  for (let i = 0; i < 3; i += 1) {
    await page.evaluate((k) => {
      const it = document.querySelectorAll('[data-svc-item]')[k];
      window.scrollTo(0, it.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3);
    }, i);
    await wait(1100);
    const state = await page.evaluate(() => document.querySelector('[data-svc-stage]').dataset.svcState);
    report.checks.push(`svc item ${i} -> state ${state}`);
    await page.screenshot({ path: join(OUT, `d-svc-${i + 1}.png`) });
  }

  // projetos: ativo + hover coreografado
  for (let i = 0; i < 3; i += 1) {
    await page.evaluate((k) => {
      const it = document.querySelectorAll('[data-prj-case]')[k];
      window.scrollTo(0, it.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.25);
    }, i);
    await wait(1200);
    const act = await page.evaluate(() => document.querySelector('.prj-visual.is-active')?.dataset.prjVisual);
    report.checks.push(`prj case ${i} -> visual ${act}`);
    await page.screenshot({ path: join(OUT, `d-prj-${i + 1}.png`) });
    const link = await page.$('.prj-visual.is-active .prj-vis-link');
    if (link) {
      await link.hover();
      await wait(1000);
      await page.screenshot({ path: join(OUT, `d-prj-${i + 1}-hover.png`) });
      await page.mouse.move(5, 5);
      await wait(400);
    }
  }

  // processo: três capítulos
  for (let i = 1; i <= 3; i += 1) {
    await page.evaluate((k) => {
      const ch = document.querySelector(`[data-prc-ch="${k}"]`);
      window.scrollTo(0, ch.getBoundingClientRect().top + window.scrollY + 40);
    }, i);
    await wait(1000);
    await page.screenshot({ path: join(OUT, `d-prc-${i}.png`) });
  }

  // estúdio / cta / footer
  await page.evaluate(() => document.querySelector('.std').scrollIntoView({ block: 'center' }));
  await wait(900);
  await page.screenshot({ path: join(OUT, 'd-std.png') });
  await page.evaluate(() => document.querySelector('.ft-cta').scrollIntoView({ block: 'center' }));
  await wait(900);
  await page.screenshot({ path: join(OUT, 'd-cta.png') });
  const cta = await page.$('.ft-cta-link');
  await cta.hover();
  await wait(800);
  await page.screenshot({ path: join(OUT, 'd-cta-hover.png') });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(900);
  await page.screenshot({ path: join(OUT, 'd-ft.png') });

  await page.close();
}

/* ---- 3. âncoras + teclado ---- */
{
  const page = await newPage(1440, 900);
  for (const id of ['#projetos', '#servicos', '#estudio', '#contato', '#topo']) {
    await page.evaluate((sel) => {
      const link = document.querySelector(`a[href="${sel}"]`);
      link.click();
    }, id);
    await wait(2000);
    const pos = await page.evaluate((sel) => {
      const t = document.querySelector(sel);
      return { hash: location.hash, top: Math.round(t.getBoundingClientRect().top) };
    }, id);
    report.checks.push(`ancora ${id} -> hash ${pos.hash} topo ${pos.top}px`);
  }

  // teclado: tab pelos primeiros focáveis, garante foco visível e ordem
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(400);
  const tabbed = [];
  for (let i = 0; i < 18; i += 1) {
    await page.keyboard.press('Tab');
    await wait(120);
    tabbed.push(await page.evaluate(() => {
      const el = document.activeElement;
      return `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`;
    }));
  }
  report.checks.push(`tab order: ${tabbed.join(' > ')}`);

  // foco em item de serviço muda o palco?
  await page.evaluate(() => document.querySelector('[data-svc-item="c"]').focus());
  await wait(900);
  report.checks.push(`foco svc c -> state ${await page.evaluate(() => document.querySelector('[data-svc-stage]').dataset.svcState)}`);
  await page.screenshot({ path: join(OUT, 'd-svc-focus.png') });

  // foco em link de projeto ativa o palco?
  await page.evaluate(() => document.querySelectorAll('[data-prj-case] .prj-link')[2].focus());
  await wait(900);
  report.checks.push(`foco prj 3 -> visual ${await page.evaluate(() => document.querySelector('.prj-visual.is-active')?.dataset.prjVisual)}`);

  await page.close();
}

/* ---- 4. reload no meio da página ---- */
{
  const page = await newPage(1440, 900);
  await page.evaluate(() => {
    const el = document.querySelector('.prj');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 600);
  });
  await wait(800);
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(1800);
  const st = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    vis: document.querySelector('.prj-visual.is-active')?.dataset.prjVisual,
    svc: document.querySelector('[data-svc-stage]')?.dataset.svcState,
  }));
  report.checks.push(`reload no meio: y=${st.y} visual=${st.vis} svcState=${st.svc}`);
  await page.screenshot({ path: join(OUT, 'd-reload-mid.png') });
  await page.close();
}

/* ---- 5. reduced motion ---- */
{
  const page = await newPage(1440, 900, { reduce: true });
  await crawl(page);
  const st = await page.evaluate(() => {
    const els = ['.tese-close', '.svc-name', '.prj-name', '.prc-ch-name', '.std-p-text', '.ft-cta-link', '.ft-mark'];
    return {
      teseScene: document.querySelector('.tese').classList.contains('is-scene'),
      prcScene: document.querySelector('.prc').classList.contains('is-scene'),
      visible: els.map((s) => {
        const el = document.querySelector(s);
        const cs = getComputedStyle(el);
        return `${s} op=${cs.opacity} vis=${cs.visibility}`;
      }),
    };
  });
  report.checks.push(`reduced: teseScene=${st.teseScene} prcScene=${st.prcScene}`);
  report.checks.push(...st.visible.map((v) => `reduced ${v}`));
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(400);
  await page.screenshot({ path: join(OUT, 'reduced-full.png'), fullPage: true });
  await checkOverflow(page, 'reduced-1440');
  await page.close();
}

/* ---- 6. sem JavaScript ---- */
{
  const page = await newPage(1440, 900, { noJs: true });
  const st = await page.evaluate(() => {
    const els = ['.tese-close', '.svc-name', '.prj-name', '.prj-media-main', '.prc-ch-name', '.std-p-text', '.ft-cta-link'];
    return els.map((s) => {
      const el = document.querySelector(s);
      if (!el) return `${s} AUSENTE`;
      const cs = getComputedStyle(el);
      return `${s} op=${cs.opacity} vis=${cs.visibility} disp=${cs.display}`;
    });
  });
  report.checks.push(...st.map((v) => `no-js ${v}`));
  await page.screenshot({ path: join(OUT, 'nojs-full.png'), fullPage: true });
  await checkOverflow(page, 'nojs-1440');
  await page.close();
}

/* ---- 7. mobile 390: seções ---- */
{
  const page = await newPage(390, 844);
  await crawl(page);
  const sections = [
    ['m-tese', '.tese'], ['m-svc', '.svc-index'], ['m-prj', '.prj-index'],
    ['m-prc', '[data-prc-ch="1"]'], ['m-std', '.std'], ['m-cta', '.ft-cta'], ['m-ft', '.ft-base'],
  ];
  for (const [name, sel] of sections) {
    await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start' }), sel);
    await wait(900);
    await page.screenshot({ path: join(OUT, `${name}.png`) });
  }
  // os três projetos no fluxo
  for (let i = 0; i < 3; i += 1) {
    await page.evaluate((k) => document.querySelectorAll('[data-prj-case]')[k].scrollIntoView({ block: 'start' }), i);
    await wait(900);
    await page.screenshot({ path: join(OUT, `m-prj-${i + 1}.png`) });
  }
  await page.close();
}

await browser.close();
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
