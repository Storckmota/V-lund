// Corpo do site abaixo da hero: orquestra o sistema de projetos e o
// motion (GSAP + ScrollTrigger em below-fold-motion.js). Nenhum código
// aqui toca a primeira dobra. Sem JS, todo o conteúdo permanece visível:
// os estados iniciais de animação são aplicados somente via GSAP.

import { initBelowFoldMotion } from './below-fold-motion.js';

export function initBelowFold() {
  initBelowFoldMotion();
}
