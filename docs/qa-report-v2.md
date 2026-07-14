# QA — Reconstrução frontend v2

Data: 2026-07-14. Ambiente: build de produção (`vite build`) servido por `vite preview`, testado com Chromium/Playwright. O relatório da v1 permanece em `docs/qa-report.md` como registro histórico.

## Build

- `npm run build`: **passou**. Saída: `index.html` 27,2 kB (gzip 8,8 kB), CSS 22,2 kB (gzip ~5,2 kB), JS 7,3 kB (gzip ~2,9 kB). Zero dependências de runtime (sem GSAP, sem Tailwind, sem framework).

## Suíte automatizada (Playwright)

Larguras testadas: **390, 430, 768, 1024, 1440, 1920**.

| Verificação | Resultado |
| --- | --- |
| Overflow horizontal zero (`scrollWidth == clientWidth`) nas 6 larguras, após rolar a página inteira | passou |
| Console sem erros e sem `pageerror` nas 6 larguras | passou |
| Exatamente um `h1`; hierarquia H1→H2→H3→H4 sem saltos | passou |
| Nenhuma imagem quebrada; WebP reais da Alluré com `srcset`, `width/height` e `alt` descritivo | passou |
| 5 links de WhatsApp (header, menu, hero, fechamento, footer) para `wa.me/5527999555259` com mensagem, `target=_blank` e `rel=noopener` | passou |
| Link do case para `allure-pink.vercel.app` com `noopener` | passou |
| Menu mobile: abre com `aria-expanded`, foco entra no overlay, `Escape` fecha e devolve o foco ao botão | passou |
| Acordeão de serviços operável por teclado (`Enter` em `serv-b2` expande e remove `data-collapsed`) | passou |
| Âncoras `#projetos #servicos #estudio #contato` navegam com `scroll-padding-top` | passou |
| `prefers-reduced-motion`: sem animações, método vira lista estática com as 6 etapas visíveis, conteúdo 100% visível | passou |
| Sem JavaScript: headline visível, 6 etapas do método visíveis, painéis de serviços abertos, imagens sem clip | passou |
| Alvos de toque: linhas do acordeão ≥ 70px; links de menu/footer com padding | passou |
| Sem travessão longo na interface, sem preços, sem "Sudeste", sem placeholders, sem depoimentos/cases inventados | passou |

## Identidade e dosagem

- Brasa restrita a: filete do hero, hover de CTA/nav, "a decisão." no posicionamento, barra de progresso do método, "com você." no fechamento, estados ativos de links. Nunca fundo, nunca na marca.
- Space Mono restrito a: ficha técnica do case, inventário de capacidades, contador do método, microdados do footer, etiqueta do plano do hero. Zero labels de seção entre colchetes, zero numeração universal.
- Hairlines apenas onde têm função: linhas do índice de serviços, ficha do case, bordas dos princípios, base do header rolado.

## Screenshots

`docs/screenshots/frontend-v2/`: página inteira em 390/768/1440/1920 (`site-<largura>-hero/sNN`), menu mobile aberto (`spot-menu-390`), reduced motion (`site-1440-reduced-motion`), sem JS (`site-1440-nojs`), e detalhes (hero, case com dois planos, método, estúdio).

## Pendências herdadas (inalteradas nesta missão)

- Domínio definitivo → canonical/OG url/sitemap.
- Tracking (GA4/GTM) sem IDs reais; eventos anotados via `data-evt`/`data-sec`.
- E-mail, redes sociais, segundo case e depoimentos: sem material real confirmado.
- Decisão de copy sobre a frase do footer preservada em `docs/copy-content-map.md`.
