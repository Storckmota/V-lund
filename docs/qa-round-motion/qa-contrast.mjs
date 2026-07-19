// Contraste calculado sobre os pares reais do corpo do site.
import puppeteer from 'puppeteer-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += innerHeight * 0.4) {
    window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 800));

const rows = await page.evaluate(() => {
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (s) => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
  const bgOf = (el) => {
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
    '.tese-principal', '.tese-complemento', '.tese-cen', '.tese-close', '.tese-cen-intro',
    '.svc-kicker', '.svc-intro', '.svc-desc', '.svc-name', '.svc-idx',
    '.svc-more-lead', '.svc-more-terms', '.svc-more-close',
    '.prj-meta', '.prj-name', '.prj-seg', '.prj-sum', '.prj-link',
    '.prc-kicker', '.prc-lead', '.prc-ch-desc', '.prc-ch-list', '.prc-ch-num',
    '.std-kicker', '.std-texto', '.std-p-text', '.std-p-num',
    '.ft-cta-eyebrow', '.ft-cta-apoio', '.ft-cta-label', '.ft-tag', '.ft-label',
    '.ft-link', '.ft-num', '.ft-meta', '.ft-meta--desc', '.ft-top',
  ];
  return sels.map((s) => {
    const el = document.querySelector(s);
    if (!el) return { s, ratio: null, note: 'ausente' };
    const cs = getComputedStyle(el);
    const bg = bgOf(el);
    const m = cs.color.match(/[\d.]+/g).map(Number);
    const fg = m.length > 3 ? mix(m.slice(0, 3), m[3], bg) : m.slice(0, 3);
    const l1 = lum(fg); const l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = px >= 24 || (bold && px >= 18.66);
    return { s, ratio: Math.round(ratio * 100) / 100, px: Math.round(px), large, min: large ? 3 : 4.5 };
  });
});

const fails = rows.filter((r) => r.ratio !== null && r.ratio < r.min);
rows.forEach((r) => console.log(`${r.ratio ?? r.note}\t${r.px ?? ''}px\tmin ${r.min ?? ''}\t${r.s}${r.ratio && r.ratio < r.min ? '  <-- ABAIXO' : ''}`));
console.log(`\nabaixo do mínimo: ${fails.length}`);
await browser.close();
