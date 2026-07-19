# Hero — direção vigente

## Conceito
Arquitetura inspirada na lógica estrutural da By Monologue, traduzida para a Vólund: copy contida no centro, wordmark VÓLUND monumental ocupando a base da dobra, fundo atmosférico vivo. Comportamento de fundo com sofisticação na linha da Vivid Motion, sem copiar o efeito de tecido.

## Estrutura
- Header: wordmark à esquerda, nav central (Projetos / Serviços / Estúdio, âncoras futuras), ação "Iniciar um projeto ↗" à direita. Nav central some no mobile.
- Copy central: eyebrow mono + brasa, headline Fraunces (~3.6rem, última frase em itálico), apoio 50ch, botão com seta.
- Monumento: `#vwordmark` em tinta, 97vw desktop / 112vw mobile, cortado na base (`margin-bottom` negativo).

## Fundo
`atmosphere.js`: canvas 2D com 5 campos radiais em tons de papel, deriva lenta (lissajous) + parallax sutil ao cursor (lerp, profundidades ±34px). Grão de papel estático via feTurbulence (opacity 0.05, multiply). Reduced-motion: quadro único estático. Pausa com aba oculta. Sem linhas, sem partículas, sem formas.

## Motion
Entrada CSS pura: copy em stagger (fade + rise), monumento sobe 18% com ease expo-out, atmosfera com fade longo. Botão: hover inverte para tinta, seta (brasa) desliza 4px.

## Brasa (2 usos por tela)
Ponto do eyebrow + seta do botão.

## Preloader
Sem GSAP (Web Animations API, `src/scripts/preloader.js`): fragmentos de tinta convergem, o V (`#vsym`, maior) se monta por máscara, sobe e dá lugar à marca — wordmark VÓLUND revelado por máscara + "Estúdio de Presença Digital" em mono — que abre direto a hero (pausada via `html.intro`). Sem brasa no preloader. CSS crítico inline no `<head>`. Primeira visita por sessão (`sessionStorage volund-intro`), reduced-motion pula, fallback 4s. Ritmo ~2.4s.

## Fundo reativo
`atmosphere.js`, canvas único (DPR ≤1.5): campos de papel (deriva + parallax) + superfície latente — microcélulas de tinta em posições irregulares (jitter ±5px, ~18% quase inertes), cada uma com peso, raio e tamanho próprios; repouso alpha 0.014–0.036. Ativação sem círculo: carimbos ao longo do gesto (rastro com decaimento 0.917), raio 150–235px por velocidade, lento revela mais detalhe, células despertas deslocam-se ≤2.6px para longe do foco. Pausa fora da viewport e com aba oculta; reduced-motion = quadro estático; mobile sem interação.

## Wordmark reativo
Monumento separado em 6 grupos de glifo (`.mw-g`, Ó = O + acento como unidade; acento aproximado da letra, translate 0,6). `monument.js`: mola amortecida por glifo — sobe ≤9px, inclina ≤0.85°, escala ≤1.012, raio 210px, smoothstep para vizinhos. Só ponteiro fino, sem reduced-motion; dorme quando ocioso/fora da viewport.

## Entrada coordenada
Header desce → eyebrow → linhas do H1 por máscara (`.hml`/`.hml-in`, expo) → apoio → CTA → monumento assenta (expo, 1.2s) → atmosfera acende. Tudo CSS, segurado por `html.intro` até o preloader entregar.

## CTA
`.btn-split`: botão dividido — corpo de tinta compacto (52px, raio 9px), texto papel, módulo quadrado de papel (42px, raio 5px) com seta em `--ember-light`; hover = módulo alarga para 52px + seta desliza 3px, botão parado. Um único link.

## Primeira transição
Hero → vitrine na mesma linguagem de máscara: linhas do título sobem do clip (`.rv--mask`, 0.95s expo-out, stagger 0.1s), apoio entra em fade+rise depois (`.rv-d2`). Disparo por IntersectionObserver (`reveal.js`).

## Próximo
Seções da nav (Projetos / Serviços / Estúdio) ainda não existem.
