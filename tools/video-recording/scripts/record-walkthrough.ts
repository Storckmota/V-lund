import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium, type BrowserContext, type Page } from 'playwright';

type ProfileName = 'desktop' | 'mobile';

interface Viewport {
  width: number;
  height: number;
}

interface Options {
  url: string;
  slug: string;
  desktop: Viewport;
  mobile: Viewport;
  duration: number;
  output: string;
  fps: number;
  force: boolean;
  mp4: boolean;
  keepRaw: boolean;
}

interface DocumentMetrics {
  scrollHeight: number;
  viewportHeight: number;
  distance: number;
}

const DEFAULTS = {
  slug: 'allure',
  desktop: '1440x900',
  mobile: '390x844',
  duration: '15',
  output: './output',
  fps: '30',
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const values: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) continue;

    const withoutPrefix = arg.slice(2);
    const [key, inlineValue] = withoutPrefix.split('=', 2);
    if (inlineValue !== undefined) {
      values[key] = inlineValue;
      continue;
    }

    const next = args[i + 1];
    if (!next || next.startsWith('--')) {
      values[key] = true;
      continue;
    }

    values[key] = next;
    i += 1;
  }

  const url = String(values.url || '');
  if (!url) {
    throw new Error('Missing required --url');
  }

  const slug = String(values.slug || DEFAULTS.slug);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error('--slug must use lowercase letters, numbers, and hyphens');
  }

  const duration = Number(values.duration || DEFAULTS.duration);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('--duration must be a positive number of seconds');
  }

  if (duration < 14 || duration > 17) {
    console.warn(`Warning: duration ${duration}s is outside the 14-17s Volund target.`);
  }

  const fps = Number(values.fps || DEFAULTS.fps);
  if (!Number.isInteger(fps) || fps <= 0) {
    throw new Error('--fps must be a positive integer');
  }

  return {
    url,
    slug,
    desktop: parseViewport(String(values.desktop || DEFAULTS.desktop), 'desktop'),
    mobile: parseViewport(String(values.mobile || DEFAULTS.mobile), 'mobile'),
    duration,
    output: path.resolve(process.cwd(), String(values.output || DEFAULTS.output)),
    fps,
    force: values.force === true || values.force === 'true',
    mp4: values.mp4 === true || values.mp4 === 'true',
    keepRaw: values['keep-raw'] === true || values['keep-raw'] === 'true',
  };
}

function parseViewport(value: string, label: string): Viewport {
  const match = value.match(/^(\d+)x(\d+)$/);
  if (!match) {
    throw new Error(`--${label} must use WIDTHxHEIGHT format, for example 1440x900`);
  }

  const viewport = {
    width: Number(match[1]),
    height: Number(match[2]),
  };

  if (viewport.width <= 0 || viewport.height <= 0) {
    throw new Error(`--${label} viewport dimensions must be positive`);
  }

  if (viewport.width % 2 !== 0 || viewport.height % 2 !== 0) {
    throw new Error(`--${label} viewport dimensions must be even for video encoding`);
  }

  return viewport;
}

function ensureExternalTools(): void {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  execFileSync('ffprobe', ['-version'], { stdio: 'ignore' });
}

function assertWritableTarget(filePath: string, force: boolean): void {
  if (fs.existsSync(filePath) && !force) {
    throw new Error(`Refusing to overwrite existing file without --force: ${filePath}`);
  }
}

async function waitForPreloader(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

  await page.evaluate(async () => {
    const selectors = [
      '[data-preloader]',
      '[aria-busy="true"]',
      '#preloader',
      '.preloader',
      '.loader',
      '.loading',
    ];

    const isVisible = (element: Element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && style.opacity !== '0'
        && rect.width > 0
        && rect.height > 0;
    };

    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const visibleLoaders = selectors
        .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
        .filter(isVisible);

      if (visibleLoaders.length === 0) return;
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }
  });
}

/**
 * Paginas com `scroll-behavior: smooth` ignoram o alvo de cada frame e o scroll
 * do walkthrough trava. O override vale apenas para a sessao de gravacao.
 */
async function disableSmoothScroll(page: Page): Promise<void> {
  await page.addStyleTag({
    content: 'html, body, * { scroll-behavior: auto !important; }',
  });
}

/**
 * Sites com cursor proprio deixam o ponto/anel parado em 0,0 no headless, e ele
 * entra no video como marcador colorido no canto superior. Some com ele antes
 * de qualquer captura e deixa dois frames passarem.
 */
async function hideCaptureArtifacts(page: Page): Promise<void> {
  await page.addStyleTag({
    // Só elementos que SÃO o cursor. Nada de `.cursor` solto ou `[data-cursor]`:
    // muitos sites marcam links e botoes com esses ganchos e o header sumiria.
    content: `
      .cursor-dot, .cursor-ring, .cursor-follower, .cursor-outline,
      .custom-cursor, #cursor, #custom-cursor {
        display: none !important;
      }
    `,
  });

  await page.evaluate(
    'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
  );
}

async function waitForFonts(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const fonts = document.fonts;
    if (fonts?.ready) {
      await fonts.ready;
    }
  });
}

async function waitForImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const waitForImage = (image: HTMLImageElement) => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const done = () => resolve();
        image.addEventListener('load', done, { once: true });
        image.addEventListener('error', done, { once: true });
        window.setTimeout(done, 5_000);
      });
    };

    await Promise.all(Array.from(document.images).map(waitForImage));
  });
}

/**
 * Voltar ao topo re-dispara intros e reveals da hero. Em vez de cravar um
 * tempo fixo, espera a viewport parar de mudar antes de abrir a captura.
 */
async function waitForVisualSettle(page: Page, timeoutMs = 15_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let previous = '';
  let stableRounds = 0;

  while (Date.now() < deadline) {
    const shot = (await page.screenshot({ type: 'jpeg', quality: 40 })).toString('base64');
    stableRounds = shot === previous ? stableRounds + 1 : 0;
    previous = shot;

    if (stableRounds >= 3) return;
    await page.waitForTimeout(400);
  }
}

async function measureDocument(page: Page): Promise<DocumentMetrics> {
  return page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    const scrollHeight = Math.max(
      body?.scrollHeight || 0,
      body?.offsetHeight || 0,
      html.scrollHeight,
      html.offsetHeight,
      html.clientHeight,
    );
    const viewportHeight = window.innerHeight;

    return {
      scrollHeight,
      viewportHeight,
      distance: Math.max(0, scrollHeight - viewportHeight),
    };
  });
}

async function warmLazyLoading(page: Page, metrics: DocumentMetrics): Promise<void> {
  if (metrics.distance <= 0) return;

  await page.evaluate(async ({ distance, viewportHeight }) => {
    const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const steps = Math.min(14, Math.max(2, Math.ceil(distance / viewportHeight)));

    for (let step = 1; step <= steps; step += 1) {
      window.scrollTo({ top: Math.round((distance * step) / steps), behavior: 'instant' as ScrollBehavior });
      await delay(160);
    }
  }, metrics);

  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
  await waitForImages(page);
}

function computeHoldMs(duration: number): number {
  const totalMs = Math.round(duration * 1000);
  return Math.min(1200, Math.max(700, Math.round(totalMs * 0.08)));
}

async function runNormalizedScroll(page: Page, metrics: DocumentMetrics, duration: number): Promise<void> {
  const totalMs = Math.round(duration * 1000);
  const holdMs = computeHoldMs(duration);
  const scrollMs = Math.max(1000, totalMs - holdMs * 2);

  await page.evaluate(async ({ distance, holdMs, scrollMs }) => {
    const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    await delay(holdMs);

    const start = performance.now();
    await new Promise<void>((resolve) => {
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / scrollMs);
        window.scrollTo({ top: Math.round(distance * progress), behavior: 'instant' as ScrollBehavior });

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      window.requestAnimationFrame(step);
    });

    window.scrollTo({ top: distance, behavior: 'instant' as ScrollBehavior });
    await delay(holdMs);
  }, { distance: metrics.distance, holdMs, scrollMs });
}

interface CaptureWindow {
  start: number;
  end: number;
  length: number;
  rate: number;
}

function probeDuration(filePath: string): number {
  const value = execFileSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1',
    filePath,
  ], { encoding: 'utf8' }).trim();

  const duration = Number(value);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read duration from ${filePath}`);
  }

  return duration;
}

/**
 * A timeline do video bruto do Playwright nao acompanha o relogio do processo,
 * entao a janela de captura e ancorada no proprio conteudo: os dois ultimos
 * trechos estaticos sao a pausa na hero e a pausa no footer.
 */
function detectStillRanges(rawPath: string, rawDuration: number): Array<{ start: number; end: number }> {
  const result = spawnSync('ffmpeg', [
    '-v', 'info',
    '-i', rawPath,
    '-vf', 'freezedetect=n=-50dB:d=0.30',
    '-map', '0:v',
    '-f', 'null',
    '-',
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

  const output = `${result.stderr || ''}`;
  const ranges: Array<{ start: number; end: number }> = [];

  for (const match of output.matchAll(/freezedetect\.freeze_(start|end):\s*(-?[\d.]+)/g)) {
    const kind = match[1];
    const value = Number(match[2]);
    if (!Number.isFinite(value)) continue;

    if (kind === 'start') {
      ranges.push({ start: Math.max(0, value), end: rawDuration });
    } else if (ranges.length > 0) {
      ranges[ranges.length - 1].end = value;
    }
  }

  const merged: Array<{ start: number; end: number }> = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (previous && range.start - previous.end <= 0.4) {
      previous.end = Math.max(previous.end, range.end);
      continue;
    }
    merged.push({ ...range });
  }

  return merged;
}

function resolveCaptureWindow(rawPath: string, duration: number): CaptureWindow {
  const rawDuration = probeDuration(rawPath);
  const holdSeconds = computeHoldMs(duration) / 1000;
  const stillRanges = detectStillRanges(rawPath, rawDuration);

  const footerHold = stillRanges[stillRanges.length - 1];
  if (!footerHold) {
    throw new Error(`Could not locate the footer hold in ${rawPath}`);
  }

  if (footerHold.end < rawDuration - 1) {
    throw new Error(`Last still range does not reach the end of ${rawPath}; capture is unreliable`);
  }

  // Secoes sticky congelam a imagem no meio do scroll, entao a pausa da hero
  // nao e simplesmente a penultima: e a que fica a uma distancia de scroll do
  // footer.
  const scrollSeconds = Math.max(1, duration - holdSeconds * 2);
  const target = footerHold.start - scrollSeconds;
  const candidates = stillRanges.slice(0, -1);

  const heroHold = candidates.reduce<{ start: number; end: number } | undefined>((best, range) => {
    if (!best) return range;
    return Math.abs(range.end - target) < Math.abs(best.end - target) ? range : best;
  }, undefined);

  // Heros animadas (ex.: motion-on-scroll) nunca congelam, entao o freezedetect
  // nao acha a pausa inicial. O footer, esse sim, sempre para. Quando a hero nao
  // e detectavel, a janela e ancorada so no footer: a pausa do topo comeca
  // exatamente scrollSeconds + holdSeconds antes do footer parar.
  const heroReliable = heroHold && Math.abs(heroHold.end - target) <= 3.5;

  const end = Math.min(rawDuration, footerHold.start + holdSeconds);
  const start = heroReliable
    ? Math.max(heroHold.start, heroHold.end - holdSeconds)
    : Math.max(0, footerHold.start - scrollSeconds - holdSeconds);
  const length = end - start;

  if (length < 1) {
    throw new Error(`Capture window in ${rawPath} is too short (${length.toFixed(3)}s)`);
  }

  return { start, end, length, rate: duration / length };
}

function encodeWebm(rawPath: string, outputPath: string, window: CaptureWindow, duration: number, fps: number): void {
  execFileSync('ffmpeg', [
    '-y',
    '-i', rawPath,
    '-an',
    '-vf', buildRetimeFilter(window, fps),
    '-t', duration.toFixed(3),
    '-c:v', 'libvpx-vp9',
    '-b:v', '0',
    '-crf', '32',
    '-deadline', 'good',
    '-row-mt', '1',
    outputPath,
  ], { stdio: 'inherit' });
}

function buildRetimeFilter(window: CaptureWindow, fps: number): string {
  return [
    `trim=start=${window.start.toFixed(3)}:end=${window.end.toFixed(3)}`,
    `setpts=${window.rate.toFixed(6)}*(PTS-STARTPTS)`,
    `fps=${fps}`,
  ].join(',');
}

function encodeMp4(rawPath: string, outputPath: string, window: CaptureWindow, duration: number, fps: number): void {
  execFileSync('ffmpeg', [
    '-y',
    '-i', rawPath,
    '-an',
    '-vf', buildRetimeFilter(window, fps),
    '-t', duration.toFixed(3),
    '-c:v', 'libx264',
    '-crf', '22',
    '-preset', 'medium',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputPath,
  ], { stdio: 'inherit' });
}

function extractPoster(videoPath: string, outputPath: string): void {
  execFileSync('ffmpeg', [
    '-y',
    '-i', videoPath,
    '-frames:v', '1',
    '-quality', '82',
    outputPath,
  ], { stdio: 'inherit' });
}

function probeVideo(videoPath: string): string {
  return execFileSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,width,height,avg_frame_rate:format=duration',
    '-of', 'json',
    videoPath,
  ], { encoding: 'utf8' });
}

async function recordProfile(options: Options, profileName: ProfileName, viewport: Viewport): Promise<void> {
  const rawDir = path.join(options.output, '_raw');
  fs.mkdirSync(rawDir, { recursive: true });

  const baseName = `${options.slug}-${profileName}`;
  const rawPath = path.join(rawDir, `${baseName}-raw.webm`);
  const webmPath = path.join(options.output, `${baseName}.webm`);
  const mp4Path = path.join(options.output, `${baseName}.mp4`);
  const posterPath = path.join(options.output, `${baseName}-poster.webp`);

  for (const filePath of [rawPath, webmPath, posterPath, ...(options.mp4 ? [mp4Path] : [])]) {
    assertWritableTarget(filePath, options.force);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-infobars', '--hide-scrollbars'],
  });

  let context: BrowserContext | undefined;
  let contextClosed = false;

  try {
    context = await browser.newContext({
      viewport,
      isMobile: profileName === 'mobile',
      hasTouch: profileName === 'mobile',
      deviceScaleFactor: profileName === 'mobile' ? 3 : 1,
      recordVideo: {
        dir: rawDir,
        size: viewport,
      },
    });

    const page = await context.newPage();
    const video = page.video();

    // tsx/esbuild compila com keepNames, injetando chamadas __name no codigo
    // serializado para page.evaluate. Definir o helper na pagina evita o
    // ReferenceError sem alterar nada do site gravado.
    await page.addInitScript({
      content: 'globalThis.__name = globalThis.__name || (function (fn) { return fn; });',
    });

    // hosts em cold start podem passar dos 30s padrao do Playwright
    await page.goto(options.url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await waitForPreloader(page);
    await disableSmoothScroll(page);
    await hideCaptureArtifacts(page);
    await waitForFonts(page);
    await waitForImages(page);

    let metrics = await measureDocument(page);
    await warmLazyLoading(page, metrics);

    await page.evaluate("window.scrollTo({ top: 0, behavior: 'instant' })");
    await waitForFonts(page);
    await waitForImages(page);
    metrics = await measureDocument(page);

    await waitForVisualSettle(page);

    await runNormalizedScroll(page, metrics, options.duration);

    await context.close();
    contextClosed = true;

    const recordedPath = await video?.path();
    if (!recordedPath || !fs.existsSync(recordedPath)) {
      throw new Error(`Playwright did not produce a raw video for ${profileName}`);
    }

    fs.renameSync(recordedPath, rawPath);

    const captureWindow = resolveCaptureWindow(rawPath, options.duration);
    encodeWebm(rawPath, webmPath, captureWindow, options.duration, options.fps);
    extractPoster(webmPath, posterPath);

    if (options.mp4) {
      encodeMp4(rawPath, mp4Path, captureWindow, options.duration, options.fps);
    }

    if (!options.keepRaw) {
      fs.unlinkSync(rawPath);
    }

    console.log(`\n${profileName}:`);
    console.log(`  document: ${metrics.scrollHeight}px, viewport: ${metrics.viewportHeight}px, distance: ${metrics.distance}px`);
    console.log(`  capture window: ${captureWindow.start.toFixed(2)}s -> ${captureWindow.end.toFixed(2)}s (rate ${captureWindow.rate.toFixed(3)})`);
    console.log(`  webm: ${webmPath}`);
    console.log(`  poster: ${posterPath}`);
    if (options.mp4) console.log(`  mp4: ${mp4Path}`);
    console.log(probeVideo(webmPath));
  } finally {
    if (context && !contextClosed) {
      await context.close().catch(() => undefined);
    }
    await browser.close().catch(() => undefined);
  }
}

async function main(): Promise<void> {
  const options = parseArgs();
  ensureExternalTools();
  fs.mkdirSync(options.output, { recursive: true });

  console.log(`Recording ${options.slug} from ${options.url}`);
  console.log(`Output: ${options.output}`);
  console.log(`Duration: ${options.duration}s at ${options.fps}fps`);

  await recordProfile(options, 'desktop', options.desktop);
  await recordProfile(options, 'mobile', options.mobile);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
