// PROJETOS — Rodada B v2: direção de arte da galeria em tinta.
// Constrói o entorno editorial da seção escura e coreografa seu motion. NUNCA
// toca o sistema de mídia: .prjv-scene e descendentes (vídeo/pôster/estados/
// cursor/sombra/escala) seguem em projects-panels.js, congelados. Aqui só:
//   - camadas de fundo (atmosfera ambiental, limiar de entrada, saída);
//   - máscaras de texto (headline e nomes) e seus reveals;
//   - cruza-fade dos campos de luz por projeto ativo.
// Reduced motion: monta as camadas no estado final e não vincula nada ao scrub.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Envolve grupos de texto em linhas-máscara (overflow) com inner deslocável.
// groups: array de strings; cada uma vira uma linha própria. Preserva a copy.
function maskGroups(el, groups) {
  el.textContent = '';
  const inners = [];
  groups.forEach((text) => {
    const line = document.createElement('span');
    line.className = 'prjv-mline';
    const inner = document.createElement('span');
    inner.textContent = text;
    line.appendChild(inner);
    el.appendChild(line);
    inners.push(inner);
  });
  return inners;
}

export function initProjectsEditorial() {
  const section = document.querySelector('.prjv');
  if (!section) return;

  const intro = section.querySelector('.prjv-intro');
  const eyebrow = section.querySelector('.prjv-eyebrow');
  const title = section.querySelector('.prjv-title');
  const items = [...section.querySelectorAll('.prjv-item')];

  section.classList.add('prjv-ed');

  // --- camadas de fundo (atmosfera + limiar + saída) -----------------------
  const atmos = document.createElement('div');
  atmos.className = 'prjv-atmos';
  atmos.setAttribute('aria-hidden', 'true');
  const atmosVp = document.createElement('div');
  atmosVp.className = 'prjv-atmos-vp';
  atmos.appendChild(atmosVp);

  // 'intro' = brasa Vólund (abertura e encerramento). Cores de cliente só nos cases.
  const ambByPrj = {};
  ['intro', 'allure', 'leonardo', 'aringleb'].forEach((prj) => {
    const amb = document.createElement('div');
    amb.className = `prjv-amb prjv-amb--${prj}`;
    atmosVp.appendChild(amb);
    ambByPrj[prj] = amb;
  });

  const lead = document.createElement('div');
  lead.className = 'prjv-lead';
  lead.setAttribute('aria-hidden', 'true');

  const tail = document.createElement('div');
  tail.className = 'prjv-tail';
  tail.setAttribute('aria-hidden', 'true');

  section.prepend(atmos);
  section.appendChild(lead);
  section.appendChild(tail);

  // --- máscaras de texto ----------------------------------------------------
  // headline centralizada em linha única (quebra natural só no mobile), sobe
  // por máscara como um bloco.
  let titleInners = [];
  if (title) {
    titleInners = maskGroups(title, [(title.textContent || '').trim()]);
  }

  // nome de cada case em máscara de linha única
  const caseData = items.map((item) => {
    const name = item.querySelector('.prjv-name');
    const nameInners = name ? maskGroups(name, [(name.textContent || '').trim()]) : [];
    return {
      item,
      meta: item.querySelector('.prjv-meta'),
      nameInners,
      body: item.querySelector('.prjv-body'),
      cta: item.querySelector('.prjv-cta'),
    };
  });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // CSS entrega o estado final (texto, atmosfera, limiar)

  // --- limiar de entrada: papel de Serviços recua, tinta inunda ------------
  gsap.fromTo(lead,
    { scaleY: 1 },
    {
      scaleY: 0,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 30%', scrub: true },
    });

  // --- saída: papel de Processo retorna pela base --------------------------
  gsap.fromTo(tail,
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'bottom bottom', end: 'bottom top', scrub: true },
    });

  // --- campos de luz: cruza-fade; brasa Vólund é o estado default ----------
  const setAmbient = (activePrj) => {
    Object.entries(ambByPrj).forEach(([prj, el]) => {
      gsap.to(el, { autoAlpha: prj === activePrj ? 1 : 0, duration: 1.2, ease: 'power2.out' });
    });
  };
  // abertura já nasce na brasa da Vólund (nenhuma cor de cliente antes do case)
  Object.values(ambByPrj).forEach((el) => gsap.set(el, { autoAlpha: 0 }));
  gsap.set(ambByPrj.intro, { autoAlpha: 1 });

  // --- abertura: brasa Vólund estabelecida, eyebrow surge, headline sobe ----
  gsap.set(eyebrow, { yPercent: 44, autoAlpha: 0 });
  gsap.set(titleInners, { yPercent: 120 });

  gsap.timeline({ scrollTrigger: { trigger: intro || section, start: 'top 82%', once: true } })
    .to(eyebrow, { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: 'power2.out' }, 0)
    .to(titleInners, { yPercent: 0, duration: 0.98, ease: 'expo.out' }, 0.16);

  // --- reveal editorial por case: meta → nome (máscara) → corpo → CTA ------
  // variação pequena e controlada, não idêntica entre os três projetos.
  const variants = {
    allure:   { ease: 'expo.out',  nameDur: 0.9,  stagger: 0.1  },
    leonardo: { ease: 'power4.out', nameDur: 0.98, stagger: 0.12 },
    aringleb: { ease: 'expo.out',  nameDur: 1.04, stagger: 0.14 },
  };

  caseData.forEach(({ item, meta, nameInners, body, cta }) => {
    const v = variants[item.dataset.prj] || variants.allure;
    const soft = [meta, body, cta].filter(Boolean);

    gsap.set(soft, { y: 20, autoAlpha: 0 });
    gsap.set(nameInners, { yPercent: 118 });

    gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 76%', once: true } })
      .to(meta, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 0)
      .to(nameInners, { yPercent: 0, duration: v.nameDur, ease: v.ease }, 0.1)
      .to([body, cta].filter(Boolean), {
        y: 0, autoAlpha: 1, duration: 0.62, ease: 'power3.out', stagger: v.stagger,
      }, 0.24);
  });

  // Gatilhos por bloco: a cor do cliente só acende quando o case entra na
  // região de leitura (start 'top 52%', logo antes do centro). Nas bordas
  // externas — acima de Alluré e abaixo de Alexander — volta a brasa Vólund.
  const last = items.length - 1;
  items.forEach((item, i) => {
    const prj = item.dataset.prj;
    ScrollTrigger.create({
      trigger: item,
      start: 'top 52%',
      end: 'bottom 48%',
      onEnter: () => setAmbient(prj),
      onEnterBack: () => setAmbient(prj),
      onLeaveBack: i === 0 ? () => setAmbient('intro') : undefined,
      onLeave: i === last ? () => setAmbient('intro') : undefined,
    });
  });

  // --- resposta ambiental ao hover/foco -------------------------------------
  // A galeria ilumina melhor a obra em foco: ganho discreto (~15%) de luz e
  // leve expansão do halo do case. Listeners passivos e independentes; NÃO
  // tocam o player (sem preventDefault/stopPropagation), só a camada ambiental.
  const boost = (prj, on) => {
    const el = ambByPrj[prj];
    if (!el) return;
    gsap.to(el, {
      scale: on ? 1.06 : 1,
      filter: on ? 'saturate(1.05) brightness(1.16)' : 'saturate(1.02) brightness(1)',
      duration: on ? 0.4 : 0.55,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  items.forEach((item) => {
    const stage = item.querySelector('.prjv-stage') || item;
    const prj = item.dataset.prj;
    stage.addEventListener('pointerenter', () => boost(prj, true));
    stage.addEventListener('pointerleave', () => boost(prj, false));
    item.addEventListener('focusin', () => boost(prj, true));
    item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) boost(prj, false); });
  });
}
