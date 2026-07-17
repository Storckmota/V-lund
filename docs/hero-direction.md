# Direção da primeira dobra — "O V é o eixo"

## Conceito

O símbolo V da Vólund é a estrutura da primeira dobra, não um enfeite dela.
O preloader desenha os dois traços do V, revela o glifo e acende a brasa no
vértice. Em vez de sair da tela, o V viaja para a posição definitiva na hero
(FLIP) e vira a âncora monumental da composição. A brasa do vértice voa para
o eyebrow e vira o sinal funcional da tela. Preloader e hero são uma única
sequência: nada aparece no preloader sem consequência na hero.

## Interpretação da Vólund

Estúdio de presença digital que constrói a metade séria da presença de uma
marca: o site que recebe quem pesquisa e sustenta a decisão. A hero apresenta
o estúdio com tipografia editorial (Fraunces), superfície de papel e tinta,
e a marca como protagonista. Sem cases, sem portfólio, sem discurso.

## Origem da geometria

- O ângulo dos traços do preloader vem da proporção do símbolo:
  `atan((276/2)/316) ≈ 23.6°` → token `--v-angle: 23.6deg`.
- Escala de espaçamento em Fibonacci: 8, 13, 21, 34, 55, 89, 144
  (`--s-1`…`--s-7`), usada como estrutura silenciosa.
- Divisão da hero desktop próxima da áurea: coluna de copy `1.618fr`,
  campo do V `1fr`.
- A linha vertical do scroll cue segue a coluna do grid e atravessa a
  fronteira entre hero e próxima seção (continuidade real, não decoração).
- Nenhuma forma sem origem: só os traços do V, hairlines de grid e a brasa.

## Estrutura da composição

Desktop 1440: header (wordmark + Contato + CTA) · coluna esquerda com
eyebrow "Estúdio de presença digital", H1 em três linhas mascaradas,
apoio e CTA · campo direito com o V em tinta, cortado pela borda,
vértice apontando para o rodapé da dobra. Mobile 390/430: composição
própria — V cortado no topo direito em escala reduzida, copy em coluna
única, CTA em largura total, scroll cue central.

## Influências

- **Vivid Motion (dominante, hero)**: energia da primeira dobra, integração
  tipografia + interação, um único CTA forte, micro-detalhe funcional.
  Nada copiado: sem clock, sem cards de trabalho, sem client logos.
- **Yugen (dominante, direção de arte)**: contenção, jornada contínua
  entre abertura, hero e seção seguinte, whitespace com função.
- **Symbol Studio (pontual, preloader)**: ritmo curto e preciso da
  abertura, transição limpa para a hero, frases empilhadas com pausa.
- **Noteworthy (secundária)**: objetividade da copy de navegação, leveza,
  zero discurso corporativo.

## Preloader

Sequência CSS + vanilla (~1.8s total): dois traços a ±23.6° descem e se
encontram no vértice → o glifo V revela por clip-path de baixo para cima →
traços saem → brasa acende no vértice → handoff: o V faz FLIP até a âncora
da hero, a brasa faz FLIP até o ponto do eyebrow, o véu de papel dissolve e
as linhas do H1 sobem em máscara. Controle por sessão (`volund-intro`),
`prefers-reduced-motion` pula tudo, timeout de segurança no `<head>` remove
a intro mesmo se o módulo falhar. Sem porcentagem, sem spinner, sem texto.

## Campo visual

O V da hero e o bloco de copy são planos com paralaxe de ponteiro
(lerp em rAF, deslocamento máximo 16px / 6px em direções opostas).
Só com `hover: hover` e `pointer: fine`, nunca no touch, desligado com
reduced motion e sem JavaScript a composição fica estática e íntegra.
A interação reforça a marca (o V responde) sem virar protagonista.

## Transição para a próxima seção

A linha vertical do scroll cue atravessa a fronteira e aterrissa no bloco
"O Instagram é a vitrine. O site sustenta a decisão." — mesmo papel, mesmo
grid, mesma linguagem de revelação por máscara. As duas linhas do statement
escalonam na diagonal de leitura do V. Só o statement e o primeiro parágrafo
entram nesta missão; a seção completa fica para a próxima.

## GSAP

Não instalado. A timeline do preloader é determinística com CSS keyframes e
delays; o FLIP precisa de medição, resolvida com transform + transition em
vanilla. Nenhum requisito de sincronização excede isso.

## SKILL.md lidos

design, frontend-design, ui-ux-pro-max-skill-main, web-design-guidelines,
css-animations, gsap, impeccable, stop-slop.
