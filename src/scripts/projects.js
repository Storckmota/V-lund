// Sistema de projetos. Cada case é um <article data-prj-case> no HTML
// (conteúdo estático: disponível sem JS e indexável). O contrato do
// componente está documentado no index.html, junto do markup — para um
// novo case, duplica-se o article com nome, categoria, ano, imagem
// principal, telas secundárias reais, link e (opcional) data-theme.
// Este módulo só faz o que precisa de JS: contador de cases e nada mais.
// O hover (telas secundárias, mudança de enquadramento) é CSS puro; em
// touch as telas aparecem no fluxo via .prj-strip.

export function initProjects() {
  const cases = document.querySelectorAll('[data-prj-case]');
  const count = document.querySelector('[data-prj-count]');
  if (count && cases.length) {
    count.textContent = String(cases.length).padStart(2, '0');
  }
}
