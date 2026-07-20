// Compara o "j" de "Projetos" em variações da Fraunces e no Space Grotesk.
import puppeteer from 'puppeteer-core';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 900 });

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,SOFT,WONK,wght@0,9..144,0..100,0..1,400;0,9..144,0..100,0..1,500;1,9..144,0..100,0..1,400&family=Space+Grotesk:wght@400;500&display=swap" rel="stylesheet">
<style>
 body{background:#FAF8F4;color:#17150F;margin:0;padding:28px 40px;font-family:"Fraunces",serif}
 .row{font-size:78px;line-height:1.15;white-space:nowrap}
 .tag{font:11px/1 "Space Grotesk",sans-serif;color:#8B8578;letter-spacing:.1em;text-transform:uppercase}
 .a{font-variation-settings:"WONK" 0,"SOFT" 0,"opsz" 144}
 .b{font-variation-settings:"WONK" 1,"SOFT" 0,"opsz" 144}
 .c{font-variation-settings:"WONK" 0,"SOFT" 0,"opsz" 9}
 .d{font-variation-settings:"WONK" 0,"SOFT" 0,"opsz" 60};
 .e{font-weight:500;font-variation-settings:"WONK" 0,"SOFT" 0,"opsz" 144}
 .f{font-family:"Space Grotesk",sans-serif;font-weight:500}
 .g{font-variation-settings:"WONK" 0,"SOFT" 100,"opsz" 144}
</style></head><body>
 <p class="tag">padrao (sem font-variation-settings)</p><div class="row" id="def">Projetos</div>
 <p class="tag">WONK 0 / opsz 144</p><div class="row a">Projetos</div>
 <p class="tag">WONK 1 / opsz 144</p><div class="row b">Projetos</div>
 <p class="tag">WONK 0 / opsz 9</p><div class="row c">Projetos</div>
 <p class="tag">WONK 0 / opsz 60</p><div class="row d">Projetos</div>
 <p class="tag">peso 500 / WONK 0 / opsz 144</p><div class="row e">Projetos</div>
 <p class="tag">SOFT 100 / opsz 144</p><div class="row g">Projetos</div>
 <p class="tag">Space Grotesk 500</p><div class="row f">Projetos</div>
</body></html>`;

await page.setContent(html, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: join(OUT, 'glifo-j.png'), fullPage: true });

console.log(await page.evaluate(() => {
  const el = document.getElementById('def');
  const cs = getComputedStyle(el);
  return `padrao: family=${cs.fontFamily} varset=${cs.fontVariationSettings} weight=${cs.fontWeight}`;
}));
await browser.close();
