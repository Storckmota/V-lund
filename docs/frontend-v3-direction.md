# Direção v3 — Matéria em Suspensão

**Conceito.** Tensão entre peso (tinta, Fraunces, massa, grid) e ar
(deslocamento, rastro, suspensão). A brasa é ignição pontual: traço,
marcador, estado ativo. Nunca glow, nunca gradiente.

**Campo compartilhado.** Um único canvas 2D global: lâminas de papel/tinta
(quadriláteros finos, recortes de serifa do V) em suspensão lenta e
ascendente, deslocadas pelo cursor com inércia e rastro breve. Intensidade
varia por seção (hero/CTA/footer fortes; leitura quase invisível). Cores
invertem no encerramento: tinta-sobre-papel vira papel-sobre-tinta.

**Hero.** Headline preservada em bloco composto + três lâminas de projeto
suspensas que respondem ao campo e antecipam o portfólio. Preloader
(fragmentos montam o V, brasa acende, fragmentos se dispersam) desemboca
na hero como uma única animação (~1,1s, só na primeira visita da sessão).

**Projetos.** Três cases quase-viewport em pilha contínua: superfície de
tinta em escala, nome grande sobreposto, informação mínima visível.
Alluré real; Projeto 02/03 placeholders sintéticos (isPlaceholder: true).

**Motion.** Quatro primitivas: suspensão, deslocamento+rastro, revelação
por máscara, traço de brasa (progresso do processo, seleção, estados).
Tokens centralizados. GSAP + ScrollTrigger; reduced-motion desliga tudo.

**Hero/footer.** Mesmo mecanismo em dois polos: o campo abre a página no
papel e a encerra na tinta; o masthead VÓLUND sofre deslocamento temporário
por fatias sob o cursor e sempre restaura o desenho original. Ciclo fechado.
