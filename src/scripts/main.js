import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/sections.css';
import '../styles/motion.css';
import '../styles/responsive.css';

import { initMenu } from './menu.js';
import { initMotion } from './motion.js';

// Sinaliza JS ativo: os estados iniciais de motion só existem a partir daqui.
document.documentElement.classList.add('js');

// Header ganha fundo depois que o masthead sai de cena.
const header = document.querySelector('[data-header]');
let ticking = false;

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    header.classList.toggle('scrolled', window.scrollY > 24);
    ticking = false;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

initMenu();
initMotion();

// Pontos de tracking futuros (GA4/GTM ainda sem IDs definidos):
// os elementos relevantes carregam data-evt/data-sec para o dataLayer.
