// PROJETOS — reprodução das mídias.
// Regra dura: scroll NÃO inicia vídeo. O IntersectionObserver só antecipa o
// download; play acontece por intenção: hover, foco de teclado ou toque.
// Desktop e mobile do mesmo projeto iniciam/param/resetam juntos; as durações
// são iguais na origem (15s), então terminam juntos sem seek de sincronismo.
// Sem loop: ao terminar, o vídeo fica no último frame. Só um projeto toca por
// vez. Reduced motion: sem reprodução (pôster + profundidade por CSS no hover).
//
// Estados no item, em data-prjv-state: idle | loading | ready | playing |
// resetting | error. O CSS lê esse atributo para cursor, sombra e pôster.
// Toda intenção carrega um token; sair do hover invalida o token e nenhum
// callback atrasado consegue iniciar ou esconder pôster depois disso.

const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initProjectPanels() {
  const section = document.querySelector('.prjv');
  if (!section) return;

  const items = $$('[data-prjv-item]', section);
  if (!items.length) return;

  // reduced motion: layout estático, pôsteres, profundidade no hover é CSS
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  section.classList.add('prjv-js');

  const vids = (item) => $$('[data-prjv-vid]', item);
  const setState = (item, state) => { item.dataset.prjvState = state; };

  let current = null;
  let session = 0;
  // touchMode: ativado no primeiro toque real. Desativa os handlers de hover
  // (mouse) — dispositivos touch controlam por toque. Desktop com mouse nunca
  // emite touchstart, então o hover continua ativo.
  let touchMode = false;

  items.forEach((item) => setState(item, 'idle'));

  const rewind = (v) => { try { v.currentTime = 0; } catch (e) { /* noop */ } };
  const isReady = (v) => v.readyState >= 3;

  // Primeiro frame decodificado de verdade. Sem isso o pôster sai antes de o
  // vídeo ter imagem e aparece um flash vazio.
  const firstFrame = (v) => new Promise((resolve) => {
    if ('requestVideoFrameCallback' in v) {
      v.requestVideoFrameCallback(() => resolve());
      return;
    }

    const done = () => { v.removeEventListener('timeupdate', done); resolve(); };
    v.addEventListener('timeupdate', done, { once: true });
    window.setTimeout(done, 400);
  });

  const preloadPair = (item) => {
    const media = vids(item);
    if (!media.length) return;
    if (item.dataset.prjvPreloaded === '1') return;
    item.dataset.prjvPreloaded = '1';

    media.forEach((v) => {
      v.preload = 'auto';
      v.load();
      v.addEventListener('canplaythrough', () => {
        if (item.dataset.prjvState !== 'idle') return;
        if (media.every(isReady)) setState(item, 'ready');
      });
    });
  };

  const start = (item) => {
    if (current && current !== item) stop(current);   // exclusividade
    current = item;

    const token = ++session;
    const media = vids(item);
    if (!media.length) return;

    preloadPair(item);
    media.forEach((v) => { v.pause(); rewind(v); });   // sempre da hero
    setState(item, media.every(isReady) ? 'ready' : 'loading');

    const waitPair = Promise.all(media.map((v) => (isReady(v)
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
        const ok = () => { cleanup(); resolve(); };
        const fail = () => { cleanup(); reject(new Error('media error')); };
        const cleanup = () => {
          v.removeEventListener('canplay', ok);
          v.removeEventListener('error', fail);
        };
        v.addEventListener('canplay', ok, { once: true });
        v.addEventListener('error', fail, { once: true });
      }))));

    waitPair
      .then(() => {
        // cursor já saiu, ou outro projeto assumiu: intenção morre aqui
        if (token !== session || current !== item) return undefined;
        media.forEach(rewind);
        return Promise.all(media.map((v) => v.play()));
      })
      .then(() => {
        if (token !== session || current !== item) return undefined;
        return Promise.all(media.map(firstFrame));
      })
      .then(() => {
        if (token !== session || current !== item) return;
        setState(item, 'playing');                     // só agora o pôster sai
      })
      .catch((err) => {
        if (token !== session) return;
        console.warn('[projetos] playback interrompido:', err && err.message);
        stop(item, 'error');
      });
  };

  const stop = (item, endState = 'idle') => {
    session += 1;                                      // mata intenção pendente
    const media = vids(item);

    setState(item, endState === 'error' ? 'error' : 'resetting');
    media.forEach((v) => v.pause());

    // o pôster volta no mesmo quadro; o seek acontece atrás dele
    window.requestAnimationFrame(() => {
      media.forEach(rewind);
      if (item.dataset.prjvState === 'resetting') {
        setState(item, media.length && media.every(isReady) ? 'ready' : 'idle');
      }
    });

    if (current === item) current = null;
  };

  // Aquecimento: bem antes da seção entrar em vista, o par baixa inteiro.
  // NUNCA reproduz — o hover encontra os dois já decodificáveis.
  const warm = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-seen');
      preloadPair(en.target);
      warm.unobserve(en.target);
    });
  }, { rootMargin: '1000px 0px 1000px 0px', threshold: 0 });
  items.forEach((item) => warm.observe(item));

  // primeiro toque real -> modo touch: encerra qualquer hover fantasma
  document.addEventListener('touchstart', () => {
    if (!touchMode) { touchMode = true; if (current) stop(current); }
  }, { capture: true, passive: true });

  items.forEach((item) => {
    const stage = item.querySelector('.prjv-stage') || item;

    // mouse: hover controla; ignorado em modo touch
    stage.addEventListener('pointerenter', (e) => { if (!touchMode && e.pointerType === 'mouse') start(item); });
    stage.addEventListener('pointerleave', (e) => { if (!touchMode && e.pointerType === 'mouse') stop(item); });

    // touch: toque no palco alterna play/pause; nunca intercepta o CTA
    stage.addEventListener('click', (e) => {
      if (!touchMode) return;
      if (e.target.closest('a')) return;
      if (current === item) stop(item); else start(item);
    });

    // foco de teclado produz o mesmo destaque que o hover
    item.addEventListener('focusin', () => start(item));
    item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) stop(item); });
  });

  // ao sair da seção, nada continua tocando em segundo plano (só pausa)
  const exitGuard = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (!en.isIntersecting && current === en.target) stop(en.target); });
  }, { threshold: 0 });
  items.forEach((item) => exitGuard.observe(item));

  // troca de aba: pausar; ao voltar não reinicia sozinho
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && current) stop(current);
  });
}
