// SERVIÇOS — sequência finita de cinco painéis (desktop).
// Cada painel entra por baixo com uma travessia CURTA, se resolve cedo e
// PERMANECE parado por um trecho longo de scroll para leitura antes de o
// próximo assumir. Finito: não volta ao primeiro, não avança sozinho, sem
// snap, sem captura de wheel. Ritmo por painel: entrada, resolução,
// permanência legível, saída (a cobertura do próximo painel).
// Mobile e reduced motion: fluxo vertical, com transformação real da
// Experiência web em vez de três palavras surgindo.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { adiado } from './scene-utils.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// quanto de wheel (em % da viewport) cada unidade de tempo da timeline
// consome. Governa o tempo real de leitura por painel.
const SCROLL_PER_UNIT = 100;

export function initServicesPanels() {
  const section = $('.svcp');
  if (!section) return;

  const panels = $$('[data-svcp-panel]', section);
  if (panels.length < 2) return;

  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: '(min-width: 900px)',
      motionOK: '(prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      const { desktop, motionOK } = ctx.conditions;
      if (!motionOK) return undefined;

      // adiado: ao cruzar 900px o contexto desktop ainda desfaz o pin
      if (!desktop) return adiado(() => sequenciaVertical(panels));

      section.classList.add('is-scene');
      const pin = $('[data-svcp-pin]', section);

      // empilhamento: o primeiro no lugar, os demais fora da viewport
      gsap.set(panels, { zIndex: (i) => i + 1 });
      gsap.set(panels.slice(1), { yPercent: 100 });

      // MOVE: travessia de entrada acompanhada pelo scroll. A SCROLL_PER_UNIT
      // fixa, MOVE governa quanto de wheel a subida consome: MOVE≈0.9 aproxima
      // a razão travessia:deslocamento de 1:1 (sobe ~uma viewport de scroll
      // para ~uma viewport de deslocamento), sem painel arremessado. HOLD:
      // permanência absoluta por painel; landing mantém o hold mais longo e
      // não é afetado por MOVE.
      const MOVE = 0.9;
      // permanência absoluta por painel. land recebe o hold mais longo: a cena
      // interna fica plenamente resolvida por um trecho antes de Experiência
      // começar a cobri-la.
      const HOLD = { open: 0.5, inst: 0.7, land: 1.15, exp: 0.6, floor: 0.55 };

      const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });

      // a abertura permanece legível antes de o institucional subir
      let cursor = HOLD.open;

      for (let i = 1; i < panels.length; i++) {
        const panel = panels[i];
        const prev = panels[i - 1];
        const kind = panel.dataset.svcpKind;

        // entrada: sobe e cobre progressivamente; o anterior recua de leve
        // (profundidade). power1.inOut = subida contínua com assentamento macio
        tl.to(panel, { yPercent: 0, duration: MOVE, ease: 'power1.inOut' }, cursor);
        tl.to(prev, { yPercent: -10, scale: 0.975, duration: MOVE, ease: 'power1.inOut' }, cursor);

        // revelação começa na chegada do painel e resolve cedo
        const revealAt = cursor + MOVE * 0.6;
        const revealEnd = revealPanel(panel, kind, tl, revealAt);

        // permanência: nada mais acontece durante o HOLD
        cursor = revealEnd + (HOLD[kind] ?? 0.5);
      }

      ScrollTrigger.create({
        trigger: pin,
        start: 'top top',
        end: `+=${Math.round(tl.duration() * SCROLL_PER_UNIT)}%`,
        pin: true,
        scrub: 0.6,
        animation: tl,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
        anticipatePin: 1,
        refreshPriority: 20,
      });

      // abertura entra antes de o pin travar
      const abertura = panels[0];
      gsap.from($$('.svcp-open-title .svcp-in', abertura), {
        yPercent: 116,
        duration: 0.95,
        stagger: 0.09,
        ease: 'power3.out',
        scrollTrigger: { trigger: pin, start: 'top 78%', once: true },
      });
      gsap.from([$('.svcp-label', abertura), $('.svcp-open-sub', abertura)], {
        autoAlpha: 0,
        y: 22,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: pin, start: 'top 78%', once: true },
      });

      return () => {
        section.classList.remove('is-scene');
        gsap.set(panels, { clearProps: 'all' });
      };
    },
  );
}

// despacha para a revelação de cada painel e devolve o instante em que ele
// fica plenamente resolvido (para calcular a permanência)
function revealPanel(panel, kind, tl, at) {
  if (kind === 'inst') return revealInst(panel, tl, at);
  if (kind === 'land') return revealLand(panel, tl, at);
  if (kind === 'exp') return revealExp(panel, tl, at);
  if (kind === 'floor') return revealFloor(panel, tl, at);
  return revealGeneric(panel, tl, at);
}

// institucional: o painel textual inteiro acende como conjunto, por quatro
// batidas conduzidas pelo scroll. Amplitude cromática ampla: começa em muted
// CLARO (título incluso, não preto desde o início) e resolve em ink/brasa
// cheios, nada lavado. Fundo com deslocamento tonal mínimo dentro da família
// papel, só para reforçar a percepção. Sem glow, sem sombra, sem opacity perto
// de zero. Estado final legível como screenshot.
function revealInst(panel, tl, at) {
  const LIGHT = '#b8b0a1'; // muted claro: legível, porém contido
  const INK = '#17150f';
  const BODY = '#343029';
  const EMBER = '#a03d2d';

  const nameIn = $('.svcp-svc-name .svcp-in', panel);
  const desc = $('.svcp-svc-desc', panel);
  const emG = $('.inst-g--em', panel);
  const inkG = $$('.inst-g', panel).filter((g) => g !== emG);
  const emEl = emG ? (emG.querySelector('em') || emG) : null;

  // fundo: deslocamento tonal muito sutil dentro da família papel
  tl.fromTo(panel, { backgroundColor: '#f6f3ec' }, { backgroundColor: '#f0eadd', duration: 1.3, ease: 'none' }, at);

  // batida 1 — título: muted claro -> ink forte
  if (nameIn) tl.fromTo(nameIn, { color: LIGHT, yPercent: 12 }, { color: INK, yPercent: 0, duration: 0.55, ease: 'power3.out' }, at);
  // batida 2 — parágrafo ganha contraste e definição
  if (desc) tl.fromTo(desc, { color: LIGHT, autoAlpha: 0.65, y: 14 }, { color: BODY, autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' }, at + 0.24);
  // batida 3 — "Tudo o que a empresa é, reunido num": muted claro -> ink, por grupo
  const g3 = at + 0.5;
  tl.fromTo(inkG, { color: LIGHT, y: 8 }, { color: INK, y: 0, duration: 0.55, stagger: 0.16, ease: 'power2.out' }, g3);
  // batida 4 — "só endereço." conclui em brasa forte
  if (emG) {
    const emAt = g3 + inkG.length * 0.16;
    tl.fromTo(emG, { y: 8 }, { y: 0, duration: 0.55, ease: 'power2.out' }, emAt);
    tl.fromTo(emEl, { color: LIGHT }, { color: EMBER, duration: 0.6, ease: 'none' }, emAt);
    return emAt + 0.6;
  }
  return g3 + inkG.length * 0.16 + 0.55;
}

// landing: a sequência desce por etapas e converge a uma única ação, que
// depois permanece resolvida por um trecho longo
function revealLand(panel, tl, at) {
  const nameIn = $('.svcp-svc-name .svcp-in', panel);
  if (nameIn) tl.from(nameIn, { yPercent: 116, duration: 0.28, ease: 'power3.out' }, at);
  const meta = $('.svcp-svc-meta', panel);
  if (meta) tl.from(meta, { autoAlpha: 0, y: 12, duration: 0.24, ease: 'power2.out' }, at);
  const desc = $('.svcp-svc-desc', panel);
  if (desc) tl.from(desc, { autoAlpha: 0, y: 18, duration: 0.3, ease: 'power2.out' }, at + 0.08);

  const steps = $$('.funnel-step', panel);
  tl.from(steps, { autoAlpha: 0, x: -18, duration: 0.28, stagger: 0.07, ease: 'power2.out' }, at + 0.06);
  const action = $('.funnel-action', panel);
  if (action) tl.from(action, { autoAlpha: 0, scale: 0.9, duration: 0.32, ease: 'back.out(1.6)' }, at + 0.42);

  return at + 0.42 + 0.32;
}

// experiência: coreografia traduzida da cena da By Monologue, na linguagem da
// Vólund. 1 entrada do serviço; 2 liberação do palco (id recua, não some);
// 3 convergência da frase de direções opostas; 4 quadro tipográfico WEB nasce
// estreito (recorte vertical) e cresce por clip-path; 5 estado intermediário:
// a composição interna se reorganiza (WEB reposiciona e escala, papel -> tinta,
// detalhe em brasa); 6 iluminação da base e "comum." em brasa; resolução.
// Uma só timeline (a mestra), estados iniciais por gsap.set/fromTo explícitos —
// reversível e determinístico no scrub, no reload e no resize.
function revealExp(panel, tl, at) {
  const head = $('.exp-head', panel);
  const words = $$('.exp-head .exp-w', panel);
  const emW = words[words.length - 1];
  const inkW = words.slice(0, -1);
  const stage = $('.exp-stage', panel);
  const frame = $('.exp-frame', panel);
  const surface = $('.exp-surface', panel);
  const titleEl = $('.exp-title', panel);
  const titleLines = $$('.exp-title-in', panel);
  const mark = $('.exp-web-mark', panel);
  const band = $('.exp-band', panel);

  const MUTED = '#8b8375';
  const INK = '#17150f';
  const EMBER = '#a03d2d';
  const PAPER = '#faf8f4';
  const PAPERS = '#f4f0e8';

  // Ato 1 — TESE: a headline inteira aparece e acende em ordem de leitura.
  tl.fromTo(head, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power3.out' }, at);
  tl.fromTo(inkW, { color: MUTED }, { color: INK, duration: 0.55, stagger: 0.06, ease: 'none' }, at + 0.2);

  // Ato 2 — a estrutura RÍGIDA nasce: shell (footprint final) revela; a surface
  // é uma faixa estreita e comprimida no CENTRO, em papel, com sombra sutil; WEB
  // grande demais para ela (comprimida, desalinhada), em tinta. Ancorado no
  // centro. O `.exp-frame` fica oculto por CSS de cena até aqui — sem vazamento.
  const SH_LOW = '0 8px 24px -18px rgba(23, 21, 15, 0.25)';
  const SH_PEAK = '0 42px 96px -44px rgba(23, 21, 15, 0.5)';
  const SH_MIN = '0 20px 60px -50px rgba(23, 21, 15, 0.2)';
  const box = at + 0.6;
  tl.set(surface, { scaleX: 0.32, scaleY: 0.84, backgroundColor: PAPERS, boxShadow: SH_LOW, transformOrigin: 'center center' }, box);
  // título contido dentro das máscaras (linhas abaixo da borda) e em ink sobre
  // o papel claro da surface — ainda não legível, resolve conforme o quadro abre
  tl.set(titleEl, { color: INK }, box);
  tl.set(titleLines, { yPercent: 125 }, box);
  tl.set(mark, { scaleX: 0 }, box);
  tl.fromTo(frame, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out', immediateRender: false }, box);

  // ANTECIPAÇÃO: um leve recolher da surface (wind-up) transforma a espera em
  // preparação antes da expansão simétrica.
  tl.to(surface, { scaleX: 0.28, duration: 0.22, ease: 'sine.in' }, box + 0.12);

  // TRANSFORMAÇÃO CONTÍNUA E SIMÉTRICA: a surface cresce a partir do centro
  // (transform-origin center — bordas se afastam igualmente), sincronizada com a
  // reorganização de WEB (escala uniforme, sem deformar). Cromática começa CEDO
  // e ampla; sombra sobe na fase clara e cai ao entrar na tinta. Centro fixo.
  const grow = box + 0.34;
  const dur = 1.55;
  tl.to(surface, { scaleX: 1, scaleY: 1, duration: dur, ease: 'power1.inOut' }, grow);
  // título ganha espaço conforme o quadro abre: cada linha sobe de dentro da sua
  // máscara, com stagger só entre as duas linhas (nunca caractere a caractere)
  tl.to(titleLines, { yPercent: 0, duration: dur * 0.62, stagger: 0.12, ease: 'power2.out' }, grow + dur * 0.08);
  // cromática: começa cedo (dur*0.12), janela ampla e contínua, contraste sempre
  tl.to(surface, { backgroundColor: INK, duration: dur * 0.72, ease: 'none' }, grow + dur * 0.12);
  tl.to(titleEl, { color: PAPER, duration: dur * 0.72, ease: 'none' }, grow + dur * 0.12);
  // sombra: sobe na expansão clara, recua ao chegar na tinta
  tl.to(surface, { boxShadow: SH_PEAK, duration: dur * 0.42, ease: 'sine.inOut' }, grow);
  tl.to(surface, { boxShadow: SH_MIN, duration: dur * 0.5, ease: 'sine.inOut' }, grow + dur * 0.5);
  // "comum." conclui em brasa perto da resolução cromática
  if (emW) tl.fromTo(emW, { color: MUTED }, { color: EMBER, duration: 0.55, ease: 'none' }, grow + dur * 0.55);

  // LINHA BRASA como conclusão separada: pausa curta e então revela por escala
  // horizontal a partir do centro. Depois de tudo já resolvido.
  const brasa = grow + dur + 0.18;
  tl.fromTo(mark, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power2.out' }, brasa);

  // Ato 3 — CONCLUSÃO no eixo central: a composição sobe de leve e a conclusão
  // (nome + parágrafo, centralizados) entra. Depois de demonstrar, explica.
  const fin = brasa + 0.15;
  tl.to(stage, { y: -22, duration: 0.6, ease: 'power2.inOut' }, fin);
  tl.fromTo(band, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', immediateRender: false }, fin + 0.14);

  return fin + 0.14 + 0.6;
}

// fechamento: motion textual. O bloco entra por leve subida e então as
// palavras acendem em ordem de leitura, de muted para ink; "não são extras"
// ganha força no momento certo e a última linha conclui em brasa. Sem piscar,
// sem glow, sem letra a letra. Estado final legível como screenshot.
function revealFloor(panel, tl, at) {
  const lines = $$('.floor-line', panel);
  const allW = $$('.floor-line:not(.floor-line--em) .fw', panel);
  const emW = $$('.floor-line--em .fw', panel);

  const MUTED = '#8b8375';
  const INK = '#17150f';
  const EMBER = '#a03d2d';

  if (lines.length) tl.from(lines, { yPercent: 10, autoAlpha: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }, at);
  // progressão de contraste em ordem de leitura
  tl.fromTo(allW, { color: MUTED }, { color: INK, duration: 0.5, stagger: 0.045, ease: 'none' }, at + 0.24);
  // conclusão em brasa
  tl.fromTo(emW, { color: MUTED }, { color: EMBER, duration: 0.55, stagger: 0.05, ease: 'none' }, at + 0.72);

  const kicker = $('.svcp-floor-kicker', panel);
  if (kicker) tl.from(kicker, { autoAlpha: 0, y: 14, duration: 0.3, ease: 'power2.out' }, at + 0.2);
  const text = $('.svcp-floor-text', panel);
  if (text) tl.from(text, { autoAlpha: 0, y: 18, duration: 0.34, ease: 'power2.out' }, at + 0.3);

  return at + 0.72 + 0.55 + (emW.length - 1) * 0.05;
}

function revealGeneric(panel, tl, at) {
  const ins = $$('.svcp-in', panel);
  if (ins.length) tl.from(ins, { yPercent: 116, duration: 0.32, stagger: 0.06, ease: 'power3.out' }, at);
  return at + 0.4;
}

// mobile: cada painel entra no fluxo, sem pin. A Experiência web mantém a
// transformação real (sequência → reorganização), só que conduzida por
// entrada e por um segundo gatilho ao centralizar.
function sequenciaVertical(panels) {
  const tweens = [];
  const add = (t) => t && tweens.push(t);

  panels.forEach((panel) => {
    const kind = panel.dataset.svcpKind;

    const masks = $$('.svcp-mask .svcp-in', panel);
    if (masks.length) {
      add(gsap.from(masks, {
        yPercent: 116,
        duration: 0.85,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: panel, start: 'top 82%', once: true },
      }));
    }

    const resto = [
      $('.svcp-label', panel),
      $('.svcp-open-sub', panel),
      $('.svcp-svc-meta', panel),
      $('.svcp-svc-desc', panel),
      $('.svcp-floor-kicker', panel),
      $('.svcp-floor-text', panel),
    ].filter(Boolean);
    if (resto.length) {
      add(gsap.from(resto, {
        autoAlpha: 0,
        y: 22,
        duration: 0.75,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: panel, start: 'top 82%', once: true },
      }));
    }

    if (kind === 'land') {
      const bits = $$('.funnel-step, .funnel-action', panel);
      if (bits.length) {
        add(gsap.from(bits, {
          autoAlpha: 0,
          y: 20,
          duration: 0.7,
          stagger: 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: $('.svcp-svc-field', panel), start: 'top 86%', once: true },
        }));
      }
    }

    if (kind === 'inst') {
      const head = $('.svcp-svc-head', panel);
      const nameEl = $('.svcp-svc-name', panel);
      const descEl = $('.svcp-svc-desc', panel);
      const emG = $('.inst-g--em', panel);
      const inkG = $$('.inst-g', panel).filter((g) => g !== emG);
      const emEl = emG ? (emG.querySelector('em') || emG) : null;
      const st = gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 82%', once: true } });
      if (nameEl) st.fromTo(nameEl, { color: '#b8b0a1' }, { color: '#17150f', duration: 0.55, ease: 'power2.out' }, 0);
      if (descEl) st.fromTo(descEl, { color: '#b8b0a1' }, { color: '#343029', duration: 0.55, ease: 'power2.out' }, 0.08);
      st.fromTo(inkG, { color: '#b8b0a1' }, { color: '#17150f', duration: 0.55, stagger: 0.12, ease: 'power2.out' }, 0.18);
      if (emEl) st.fromTo(emEl, { color: '#b8b0a1' }, { color: '#a03d2d', duration: 0.6, ease: 'none' }, 0.4);
      add(st);
    }

    if (kind === 'floor') {
      const lines = $$('.floor-line', panel);
      if (lines.length) {
        add(gsap.from(lines, {
          autoAlpha: 0,
          y: 16,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: panel, start: 'top 78%', once: true },
        }));
      }
    }

    if (kind === 'exp') sequenciaExpMobile(panel, add);
  });

  return () => tweens.forEach((t) => t && t.scrollTrigger?.kill());
}

// experiência no mobile: mesma ideia adaptada. Convergência vertical (topo
// desce, base sobe); o quadro WEB nasce estreito e cresce por clip-path,
// reorganizando a composição interna (papel -> tinta, brasa marca). Sem imagem
// de projeto. Transformação simplificada, mas real. Estado final visível.
function sequenciaExpMobile(panel, add) {
  const head = $('.exp-head', panel);
  const frame = $('.exp-frame', panel);
  const surface = $('.exp-surface', panel);
  const titleEl = $('.exp-title', panel);
  const titleLines = $$('.exp-title-in', panel);
  const mark = $('.exp-web-mark', panel);
  const stage = $('.exp-stage', panel);

  add(gsap.from(head, {
    y: 18, autoAlpha: 0, duration: 0.7, ease: 'power3.out',
    scrollTrigger: { trigger: stage, start: 'top 86%', once: true },
  }));

  // surface estreita no centro com WEB grande demais (tensão) e, em resposta, a
  // surface cresce simétrica do centro (transform-origin center) e WEB se
  // reorganiza continuamente. Papel -> tinta gradual, sobreposto; brasa conclui.
  const tw = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 80%', once: true } });
  if (surface) {
    tw.fromTo(surface, { scaleX: 0.36, scaleY: 0.86, backgroundColor: '#f4f0e8', boxShadow: '0 8px 24px -18px rgba(23,21,15,0.25)', transformOrigin: 'center center' }, { scaleX: 1, scaleY: 1, duration: 1.1, ease: 'power1.inOut' }, 0.25);
    tw.to(surface, { backgroundColor: '#17150f', duration: 0.85, ease: 'none' }, 0.38);
    tw.to(surface, { boxShadow: '0 32px 74px -42px rgba(23,21,15,0.45)', duration: 0.5, ease: 'sine.inOut' }, 0.25);
    tw.to(surface, { boxShadow: '0 20px 60px -50px rgba(23,21,15,0.2)', duration: 0.55, ease: 'sine.inOut' }, 0.8);
  }
  // título revela por máscara, linha a linha, e cruza de ink (sobre papel) para
  // papel (sobre tinta) acompanhando a virada da surface
  if (titleEl) tw.set(titleEl, { color: '#17150f' }, 0.25);
  if (titleLines.length) tw.fromTo(titleLines, { yPercent: 125 }, { yPercent: 0, duration: 0.9, stagger: 0.12, ease: 'power2.out' }, 0.42);
  if (titleEl) tw.to(titleEl, { color: '#faf8f4', duration: 0.85, ease: 'none' }, 0.45);
  if (mark) tw.fromTo(mark, { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: 'power2.out' }, 1.4);
  add(tw);
}
