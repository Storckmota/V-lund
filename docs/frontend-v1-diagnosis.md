# Diagnóstico da v1 — por que a direção visual foi rejeitada

Data: 2026-07-14. Fonte: build local da `main` (idêntico ao preview publicado em volund-black.vercel.app), capturado em 390, 768, 1440 e 1920 px.

## Veredito

A v1 é organizada, legível e tecnicamente correta — e visualmente monótona. É um documento editorial bem diagramado, não uma experiência digital. A página inteira usa **uma única fórmula compositiva** repetida nove vezes, o que anula qualquer tensão, surpresa ou senso de autoria. Um estúdio que vende direção visual não pode ter uma homepage que parece um relatório.

## Problemas confirmados na auditoria

1. **Fórmula única em todas as seções.** `[ label ] + índice 02/03/04… + headline em linhas + parágrafo + hairline`. Confirmado do Contexto (01) ao Fechamento (09). A estrutura do DOM é literalmente a mesma (`sec-head > label + sec-idx`) em nove seções.
2. **Labels entre colchetes e numeração como sistema universal.** `[ onde você está hoje ]`, `[ projetos selecionados ]`, `[ método ]`… aparecem em TODAS as seções, mais menu, footer e masthead. O recurso que deveria criar contraste virou papel de parede.
3. **Hairlines em excesso.** Toda seção abre com hairline, o método tem seis, a ficha do case tem quatro, o hero tem três. Deixaram de separar; viraram pauta de caderno.
4. **Página = apresentação empilhada.** O ritmo de scroll é: título, texto, linha; título, texto, linha. Exatamente a lógica de slides do PDF comercial, vertida na vertical.
5. **Portfólio não domina.** O único case real (Alluré) aparece na seção 3, com screenshot em ~58% da largura, competindo com três blocos de texto e uma ficha técnica em tabela. O trabalho é ilustração do argumento, não protagonista.
6. **Hero apresenta, não demonstra.** Masthead gigante + headline + parágrafo + dois botões + índice lateral. É uma capa de documento: diz o que a Vólund faz, mas não mostra capacidade criativa nenhuma na primeira dobra.
7. **Seções demais explicando ideias próximas.** Contexto (01), Como trabalhamos (05), Método (06), Capacidades (07) e Estúdio (08) repetem variações de "a gente lê o seu negócio antes de propor". Cinco seções para duas ideias.
8. **Experiência 100% linear.** Nenhuma sobreposição, nenhuma mudança de plano, nenhum elemento que atravesse fronteira de seção. Cada bloco começa e termina no mesmo container central.
9. **Sem contraste de caráter entre seções.** As duas seções ink (manifesto e fechamento) são a única variação — e usam a mesma composição das seções papel.
10. **Editorial aplicado literalmente.** Colchetes, índices, fichas, pauta: os artefatos do impresso foram transplantados sem tradução digital (interação, camadas, escala responsiva ao meio).
11. **Organização sem tensão.** Grid simétrico de 12 colunas, sempre o mesmo respiro, nenhum corte, nenhum elemento em escala radical além do masthead (que se repete idêntico no footer, anulando o efeito).
12. **Mobile = desktop comprimido.** Confirmado em 390px: mesmas seções, mesma ordem, mesmos labels e hairlines, tudo empilhado com clamp. Nenhuma recomposição real.

## O que a v1 tem de bom (reaproveitável)

- Identidade aplicada com fidelidade: paleta, Fraunces/Space Grotesk/Space Mono, brasa dosada.
- Copy aprovada respeitada na íntegra.
- Fundamentos técnicos: HTML semântico, skip-link, um único H1, âncoras, `prefers-reduced-motion`, SEO/OG/JSON-LD, SVGs da marca como `<symbol>`, screenshots reais da Alluré, links e WhatsApp corretos, build Vite limpo.
- Acessibilidade do menu mobile (aria-expanded, Escape, foco).

## Conclusão

Nada da composição da v1 deve sobreviver. Reaproveitar apenas: conteúdo, identidade, assets, metadados e utilidades técnicas. A reconstrução está registrada em `docs/frontend-v2-direction.md`.
