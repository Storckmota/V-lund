/* Renderiza cases adicionais a partir de src/data/projects.js.
   O primeiro case (static) já vive no HTML para funcionar sem JS. */
import { projects } from '../data/projects.js';

export function initProjects() {
  const section = document.querySelector('.projetos');
  if (!section) return;

  const extras = projects.filter((project) => !project.static);
  extras.forEach((project) => {
    section.insertAdjacentHTML('beforeend', renderCase(project));
  });
}

function renderCase(project) {
  const [nomeA, nomeB] = project.nome;
  const blocos = project.blocos
    .map(
      (bloco) => `
      <div class="case-block" data-reveal="rise">
        <h4>${bloco.titulo}</h4>
        <p>${bloco.texto}</p>
      </div>`
    )
    .join('');

  const ficha = project.ficha
    .map(
      ([dt, dd]) => `
      <div class="ficha-row"><dt>${dt}</dt><dd>${dd}</dd></div>`
    )
    .join('');

  return `
  <article class="case">
    <header class="case-opening">
      <div class="case-figure-main" data-reveal="clip" data-plane>
        <img src="${project.imagens.desktop}" width="1440" height="900" loading="lazy" decoding="async" alt="Site de ${nomeA} ${nomeB}">
      </div>
      ${project.imagens.mobile ? `
      <div class="case-figure-alt" data-reveal="clip" data-plane-slow>
        <img src="${project.imagens.mobile}" width="390" height="844" loading="lazy" decoding="async" alt="Site de ${nomeA} ${nomeB} em um celular">
      </div>` : ''}
      <h3 class="case-name"><span>${nomeA}</span> <span class="case-name-b">${nomeB}</span></h3>
    </header>
    <blockquote class="case-tese" data-reveal="rise">
      <p>${project.tese.replace('\n', '<br>')}</p>
    </blockquote>
    <div class="case-body">
      <div class="case-narrativa">${blocos}</div>
      <aside class="case-ficha" data-reveal="rise">
        <dl class="ficha">${ficha}</dl>
        <a class="case-live" data-evt="click_project" data-sec="projetos" href="${project.url}" target="_blank" rel="noopener">Ver o projeto no ar <span aria-hidden="true">→</span></a>
      </aside>
    </div>
  </article>`;
}
