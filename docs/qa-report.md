# QA — Homepage Vólund v1

Data: 2026-07-13. Ambiente: build de produção (`vite build`) servido por `vite preview`, testado com Chromium/Playwright em 1440×900, 768×1024 e 390×844.

## Build

- `npm run build`: **passou**. Saída: `index.html` 30,8 kB (gzip 8,9 kB), CSS 20 kB (gzip 4,6 kB), JS 3,2 kB (gzip 1,4 kB). Zero dependências de runtime.

## Suíte funcional automatizada (Playwright)

| Verificação | Resultado |
| --- | --- |
| Console sem erros ou warnings de página | passou |
| Exatamente um `h1`; hierarquia de headings sem saltos | passou |
| Âncoras `#inicio #projetos #servicos #estudio #contato #conteudo` | passou |
| 6 links de WhatsApp (header, menu, hero, meio, fechamento, footer), todos para `wa.me/5527999555259` com mensagem pré-preenchida, `target=_blank` e `rel=noopener` | passou |
| 2 links do case para `allure-pink.vercel.app` com `noopener` | passou |
| Imagens com `alt` descritivo e carregadas (WebP com `srcset`, `width/height`, `loading=lazy`) | passou |
| Sem travessão longo, sem `R$`, sem "a partir de", sem "Sudeste", sem placeholders, sem tabela de níveis | passou |
| `lang="pt-BR"`, title e meta description corretos | passou |
| Menu mobile: abre com `aria-expanded`, foco entra no overlay, `Escape` fecha e devolve o foco, link fecha e navega para a âncora | passou |
| Primeiro Tab foca o link "Pular para o conteúdo" | passou |
| Alvos de toque visíveis ≥ 42px | passou |
| Fraunces, Space Grotesk e Space Mono carregadas | passou |

## Responsividade e overflow

- `scrollWidth == clientWidth` (overflow horizontal zero) em 390, 768 e 1440. Larguras 430, 1024 e 1920 usam os mesmos ranges fluidos (`clamp`) sem breakpoint intermediário que possa quebrar.
- Screenshots completos em `docs/screenshots/` (hero + página inteira nas três larguras, menu aberto, reduced-motion, sem JS).
- Mobile tem composição própria: masthead reescalado, índice lateral reposicionado após o CTA, case com imagem primeiro, capacidades em 1 coluna, footer empilhado.

## Motion e acessibilidade

- `prefers-reduced-motion: reduce`: nenhuma transformação, nenhum conteúdo oculto (verificado com contexto `reducedMotion: 'reduce'`).
- Sem JavaScript: página 100% legível; estados iniciais de animação só existem sob `html.js` (verificado com `javaScriptEnabled: false`).
- Sem scrolljacking, sem bloqueio de scroll; smooth scroll apenas via CSS e só com motion habilitado.
- CTA visível na primeira dobra em 1440×900, 768×1024 e 390×844 (media query dedicada para viewports baixos de desktop).
- Foco visível (outline brasa) em todos os interativos; navegação inteira por teclado; hover nunca é a única via de informação (tag "visitar" fica sempre visível em telas touch).

## Observações e ressalvas conscientes

1. **Labels mono em `--muted` (#8B8578) sobre papel têm contraste ~3.4:1**, abaixo de AA para texto pequeno. É a cor de label da identidade registrada (mesmo uso da apresentação comercial) e os labels são marcadores auxiliares; todo conteúdo informativo ficou em `--ink`/`--body` (contraste ≥ 10:1). Textos informativos que estavam em muted (scroll-hint, frase do "piso" de serviços) foram elevados para `--body`.
2. Os avisos de contraste não se aplicam às seções em tinta: apoio em `rgba(241,237,226,.66)` sobre `#17150F` ≈ 7:1.

## Pendências reais para publicação

1. **Domínio definitivo não definido**: canonical, `og:url`, URL absoluta da OG image e `sitemap.xml` aguardam essa decisão (comentado no `<head>` e no `robots.txt`).
2. **Tracking**: GA4/GTM planejados no vault, sem IDs criados. Os elementos de conversão já carregam `data-evt`/`data-sec` (click_cta, click_whatsapp, click_project) para ligar o dataLayer sem retrabalho.
3. **Depoimentos**: seção omitida por decisão (não existem dois depoimentos reais registrados).
4. **Segundo case**: não existe material real; o bloco `article.case` está pronto para receber novos projetos.
5. **E-mail e redes sociais**: nenhum confirmado nos materiais; omitidos do footer até existirem.
6. Pesquisa de SEO (termo principal, intenção, distribuição homepage × página de Serviços) segue pendente conforme o vault; a base técnica está pronta.
