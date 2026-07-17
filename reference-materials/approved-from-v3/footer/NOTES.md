# Footer v3 - notas de referência

## Dependências diretas

- `gsap`;
- `src/scripts/motion-tokens.js`;
- `src/styles/close.css`;
- markup `[data-footer]` e `[data-mast]`;
- wordmark SVG `#wm`, preservado também como `volund-wordmark.svg`;
- tokens de superfície `surface-ink`;
- `prefers-reduced-motion`;
- consulta de ponteiro fino por media query.

## Imports

- `import gsap from 'gsap';`
- `import { reducedMotion, finePointer } from './motion-tokens.js';`

## Partes acopladas

- O CTA final e o footer compartilham a mesma superfície de tinta.
- O masthead usa seis fatias `.ft-slice` da mesma wordmark.
- A interação depende de ponteiro fino e de GSAP `quickTo`.
- Os links, contato e CTA usam rotas/IDs da v3.

## Comportamento aprovado

- composição geral do footer;
- masthead grande da Vólund no encerramento;
- movimento do masthead em resposta ao ponteiro;
- retorno das fatias ao desenho original;
- fallback estático para touch, teclado e reduced motion;
- transição visual entre CTA final e footer.

## Comportamento ainda sujeito a revisão

- intensidade exata do deslocamento;
- grid e proporção final do masthead;
- texto e estrutura final dos links;
- relação entre CTA e footer na nova narrativa;
- implementação sem GSAP, caso a próxima missão decida manter zero dependências de motion.

O telefone abaixo do botão do CTA final deve ser removido.

O footer deve permanecer funcional sem depender exclusivamente do ponteiro.

Os botões futuros não devem ser completamente quadrados nem em formato de pílula.

## O que não deve ser reutilizado

- canvas global;
- hero;
- cases;
- arquitetura completa da v3;
- sistema Matéria em Suspensão;
- scripts de scroll não necessários;
- telefone abaixo do botão do CTA final.
