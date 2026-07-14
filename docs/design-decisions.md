# Decisões de design — Homepage Vólund v1

## Conceito

**"Publicação de estúdio"**: a homepage é lida como uma edição editorial contemporânea da Vólund. Masthead de jornal, marginália em Space Mono, hairlines estruturais, tipografia Fraunces como material principal e ritmo papel → tinta → papel → tinta. O conceito executa o "Editorial Operacional" do vault: estética de publicação, estrutura de sistema, voz crítica em pontos estratégicos.

## Lógica do hero

- Masthead VÓLUND (wordmark SVG) em largura total logo abaixo do header, como cabeçalho de publicação. Marca em tinta pura, sem efeito.
- Abaixo, grid assimétrico: coluna esquerda com labels operacionais (mono) e meta-informação; coluna direita com a headline aprovada em Fraunces, quebras controladas e "à altura" em itálico.
- CTA principal visível na primeira dobra (retângulo tinta, cantos retos) + hint de scroll para #projetos.
- Brasa no hero: filete (tick) sobre a headline + seta do CTA no hover. Dois usos.
- Sem objeto abstrato de fundo. A composição fica de pé parada.

## Sistema tipográfico

- Fraunces (`font-optical-sizing: auto`, 400/500 + itálico 400): display, headlines, números do método, footer lettering.
- Space Grotesk (400/500): corpo, navegação, botões.
- Space Mono (400): labels `[ assim ]`, índices, ficha técnica, rodapé operacional.
- Escala fluida com `clamp()`: display ~ clamp(2.6rem → 5.8rem); H2 ~ clamp(2rem → 3.6rem); corpo 1.0625rem/1.7. Largura de linha do corpo ≤ 34em.

## Grid e ritmo

- Container max 1400px, margens `clamp(1.25rem, 5vw, 5rem)`.
- Grid de 12 colunas percebido por alinhamentos e uma hairline vertical (coluna de marginália à esquerda em seções longas, herdada da apresentação comercial).
- Ritmo de fundo: papel (hero, contexto, projetos) → tinta (manifesto) → papel (serviços, como trabalhamos, método, capacidades, estúdio) → tinta (fechamento + footer contínuos).
- Cantos retos em tudo. Sem sombras, sem gradientes.

## Papel, tinta e brasa

- Papel `#FAF8F4` e tinta `#17150F` como únicos fundos.
- Brasa `#A03D2D` (sobre papel) / `#C45543` (sobre tinta) apenas em: tick de abertura de seção, link vivo do case, estado ativo/hover de links e CTA, número da etapa ativa do método. Máximo ~2 usos visíveis por tela.
- Logo nunca recebe brasa.

## Portfólio (um case real)

- Alluré Branding como projeto editorial de destaque: índice 01, labels, frase-tese, contexto, o que foi construído, consequência, ficha técnica em linhas e screenshot real do site no ar dentro de moldura hairline.
- Link vivo para `allure-pink.vercel.app` (externo, noopener).
- Sem métricas, sem depoimentos, sem segundo case inventado. O bloco `<article class="case">` é o formato replicável para novos cases (conteúdo estático para funcionar sem JavaScript; um arquivo `src/data/projects.js` seria renderização via JS e quebraria o critério de conteúdo visível sem JS).

## Motion principal (intensidade 4/5, sem bibliotecas)

- Sistema `data-reveal` com IntersectionObserver: linhas de headline com máscara (translateY dentro de overflow hidden), blocos com fade+rise, staggers curtos.
- Masthead do hero: reveal por clip-path.
- Ticks de brasa: scaleX ao entrar.
- Manifesto: parallax muito leve (transform, fator ~0.06, só desktop/pointer fine).
- Método: linha de progresso vertical (scaleY por scroll) e número da etapa corrente em brasa.
- Screenshot do case: reveal por clip-path + scale 1.02 no hover.
- Header ganha fundo/hairline após scroll.
- Guardrails: tudo dentro de `html.js` (sem JS, conteúdo 100% visível); `prefers-reduced-motion` desativa transforms e transitions; apenas transform/opacity; listeners com rAF e `{ passive: true }`; observers desconectados após revelar.

## Sistema de seções

Cada seção abre com o mesmo cabeçalho operacional: hairline, label mono `[ nome ]`, índice `NN`, depois H2 Fraunces. A variação fica na composição interna (lista editorial no contexto, index rows nos serviços, progressão no método, grid de labels nas capacidades). Identidade por seção sem quebrar o sistema.

## Estratégia mobile (composição própria)

- Hero: masthead em duas linhas óticas (SVG escala), headline com quebras próprias, CTA cedo, meta-informação reduzida.
- Nav: overlay tinta em tela cheia, Fraunces grande, fechamento por Escape/botão, focus trap.
- Case: screenshot primeiro, ficha técnica depois, menos hairlines (aprendizado Alluré).
- Método: números grandes à esquerda, sem sticky.
- Capacidades: grid 2 colunas → 1 coluna.
- Footer: blocos empilhados, wordmark gigante mantido.
- Hover nunca é a única via: link do case sempre visível, estados ativos por foco.

## Dependências

- **Vite** (dev/build). Zero dependências de runtime. GSAP/Lenis dispensados: todos os efeitos planejados são alcançáveis com CSS + IntersectionObserver, o que preserva peso, simplicidade e o critério "sem biblioteca inteira para um efeito".
- Fontes via Google Fonts com `preconnect` (mesma fonte da apresentação comercial).

## SEO/OG

- Title: "Vólund | Sites, landing pages e experiências web". Description aprovada na direção do briefing. `lang="pt-BR"`, JSON-LD Organization, favicon SVG (símbolo V), OG image gerada (1200×630, tinta + lockup). Canonical/sitemap aguardam domínio (pendência documentada).
