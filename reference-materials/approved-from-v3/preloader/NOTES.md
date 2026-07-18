# Preloader v3 - notas de referência

## Dependências diretas

- `gsap`;
- `src/scripts/motion-tokens.js`;
- `src/styles/preloader.css`;
- markup `[data-preloader]`;
- símbolo SVG `#vsym`, preservado também como `volund-symbol.svg`;
- classes e elementos da hero: `.hero .ht-in`, `.hero [data-stage]`;
- classe `html.intro`;
- `sessionStorage` com a chave `volund-intro`;
- `prefers-reduced-motion`.

## Imports

- `import gsap from 'gsap';`
- `import { DUR, EASE } from './motion-tokens.js';`

## Partes acopladas

- A animação entrega diretamente para a hero da v3.
- O script procura `.hero .ht-in` e `.hero [data-stage]`.
- O CSS depende de tokens de camada, cor e motion da v3.
- O setup no `<head>` adiciona `html.intro` antes do carregamento do módulo.

## O que pode ser recuperado

- conceito geral do preloader;
- ritmo curto;
- montagem do V;
- entrada da marca;
- ponto de brasa no vértice;
- transição direta para a hero;
- lógica de primeira visita por `sessionStorage`;
- fallback de segurança por timeout;
- respeito a `prefers-reduced-motion`.

## O que precisa ser refeito

- integração com a nova hero;
- tokens de duração/easing sem depender dos tokens da v3;
- implementação sem carregar GSAP apenas por causa do preloader, salvo decisão futura;
- fallback visual definitivo;
- refinamento de timing e presença da marca.

## O que não deve ser reutilizado

- hero da v3;
- cases dentro da primeira dobra;
- canvas global;
- `field.js`;
- arquitetura Matéria em Suspensão;
- scripts de scroll da v3;
- dependência obrigatória de GSAP como baseline.

O preloader ainda precisa de refinamento antes de ser aprovado definitivamente.
