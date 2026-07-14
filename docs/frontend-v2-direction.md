# Direção v2 — conceito e arquitetura

Data: 2026-07-14. Base: `docs/frontend-v1-diagnosis.md`, vault Obsidian, apresentação 2026, quatro referências externas (mesmo peso).

## Conceito: **Composição em planos**

A v1 era uma folha contínua. A v2 é uma sequência de **salas com caráter próprio**, unificadas por papel, tinta e brasa. A tese visual: o conteúdo existe em **planos que se recortam e se deslocam** — tipografia em escala radical cortada pelas bordas da tela, imagem de projeto atravessando fronteiras de seção, texto que assume o espaço em vez de ocupar uma coluna central constante.

A estética continua editorial e arquitetônica — mas traduzida para o meio: escala responde ao viewport, planos respondem ao scroll, estados respondem ao cursor/toque. Nada de colchetes como sistema, nada de numeração universal, nada de pauta de hairlines.

## Princípios extraídos das referências (sem cópia literal)

- **Vivid Motion**: o trabalho aparece cedo e em escala dominante; categoria tipográfica gigante ao lado de imagem grande; confiança do fundo escuro contínuo.
- **Symbol Studio**: tipografia em escala que ultrapassa a moldura da tela como pontuação entre capítulos; narrativa institucional sem virar documento.
- **Yugen**: mudança de atmosfera entre seções; recortes diagonais/máscaras como assinatura de transição; imagem full-bleed com sobreposição tipográfica.
- **Noteworthy**: declaração editorial com itálico expressivo dentro da frase; trabalho espiando acima da dobra; personalidade em microdetalhes, não em ornamento.

## Arquitetura (7 movimentos, 5 sistemas compositivos)

1. **Header** — mínimo: wordmark, 3 âncoras, CTA. Vira barra compacta com fundo papel ao rolar. Mobile: overlay tinta em tela cheia.
2. **Hero — sistema 1: tipografia cinética em planos.** A headline aprovada É a composição: três linhas Fraunces em escala radical (clamp até ~11vw), deslocamentos assimétricos, "à altura" em itálico. O screenshot da Alluré entra parcialmente pela borda inferior direita, POR TRÁS da última linha — o trabalho literalmente sustenta a frase. Coluna estreita com subheadline + CTA WhatsApp. Filete de brasa como único sinal. Sem masthead gigante (o wordmark vive no header e no fechamento).
3. **Projetos — sistema 2: imersão em tinta.** Transição cromática papel→tinta. Case Alluré como experiência: nome do projeto em escala de manchete sobreposto à imagem; desktop com imagem sticky e narrativa rolando ao lado; crop mobile da Alluré em segundo plano deslocado (dois planos da mesma obra). Ficha técnica compacta em Space Mono — **única zona operacional da página**. Link vivo com brasa. Dados em `src/data/projects.js` para novos cases.
4. **Posicionamento — sistema 3: gesto tipográfico de borda.** Funde Contexto + Manifesto. "O Instagram é a vitrine. O site sustenta a decisão." em escala que corta nas bordas (linhas atravessam a tela), papel. Os três "momentos" do contexto viram uma progressão curta na margem. Brasa apenas em "a decisão" como elemento decisivo.
5. **Serviços + capacidades — sistema 4: índice interativo.** Três serviços como linhas de índice em Fraunces grande; acordeão acessível (botões reais, aria-expanded, primeiro aberto; conteúdo essencial visível sem hover). Capacidades complementares como inventário compacto dentro da mesma sala. Piso da entrega como fecho.
6. **Método (+ Como trabalhamos) — sistema 5: progressão espacial.** Palco sticky: a palavra da etapa (Fraunces gigante) substitui a anterior conforme o scroll avança, com indicador de progresso em brasa e descrição curta. Scroll nativo, sem pin forçado além da altura do conteúdo; fallback sem JS/reduced-motion: as seis etapas empilhadas visíveis. Mobile: lista vertical recomposta com linha de progresso única.
7. **Estúdio → Fechamento → Footer — retorno à tinta em escala radical.** Estúdio curto (lead + 4 princípios como notas de margem + pull "Presença digital não é decoração."). Transição para tinta: fechamento com headline aprovada + CTA + telefone. Footer como última composição: wordmark VÓLUND em corpo gigante SANGRANDO na borda inferior (não centralizado como a v1), navegação, contato, ano.

## Tese de motion: **revelar por recorte, deslocar planos**

- Entradas por `clip-path` (inset) — a "chapa" descobre o conteúdo. Uma lógica, poucas variações (recorte vertical para imagens, rise curto para texto).
- Parallax leve de planos (imagem do hero e crops do case, ±4–6%).
- Método: substituição de texto por scroll (IntersectionObserver + sticky).
- Hero responde ao cursor com deslocamento sutil do plano de imagem (desktop, desativado em touch/reduced-motion).
- Transições cromáticas entre salas via composição (seções ink reais, não animação de fundo).
- Sem: preloader, scrolljacking, fade universal, cursor custom, partículas, WebGL.
- Implementação: CSS + IntersectionObserver vanilla. Sem GSAP — nenhuma necessidade que justifique a dependência.

## Mobile como composição própria

- Hero: headline recomposta (quebras próprias), imagem da Alluré vira faixa inferior própria, CTA em largura total na dobra.
- Projetos: crop mobile da Alluré (asset real 390px) assume o protagonismo; ficha vira lista corrida.
- Método: sem sticky; linha de progresso vertical contínua com etapas.
- Serviços: acordeão nativo por toque, alvos ≥44px.
- Footer: wordmark sangrado recalculado, blocos empilhados.

## Uso da brasa (dosagem)

Hero (filete + hover do CTA), "a decisão" no posicionamento, indicador de progresso do método, links vivos/estados ativos. Nunca fundo, nunca marca, nunca texto corrido.

## Space Mono (dosagem)

Apenas: ficha técnica do case, inventário de capacidades, microdados do footer. Zero labels de seção, zero numeração universal.

## Copy

Congelada. Redistribuições e omissões registradas em `docs/copy-content-map.md`.
