# Diagnóstico v2 → v3 (síntese)

Data: 2026-07-16 · Branch rejeitada: rebuild/frontend-v2 (26883fe)

## Problema central
A v2 é tecnicamente organizada, mas fragmentada: cada seção possui um
sistema visual próprio ("salas"). Não existe um gesto espacial ou cinético
que atravesse a página. O resultado parece peças de projetos diferentes.

## Sintomas confirmados
1. Hero, projetos, posicionamento, serviços, método, estúdio e footer
   usam composições independentes entre si.
2. Alternância papel/tinta (`.room-ink`) sem lógica narrativa: liga e
   desliga por seção, sem sentido de ciclo.
3. Hero tipograficamente grande, porém estática: quatro linhas deslocadas
   + imagem retangular; interação limitada.
4. Um único case real vira bloco editorial longo (contexto / o que foi
   construído / consequência + ficha), isolando o portfólio.
5. Depois do case, a página vira texto explicativo: posicionamento,
   momentos, serviços em acordeão, capacidades, método em palco sticky.
6. Footer de três colunas + masthead sangrando: outra proposta de design.
7. Recursos repetidos até perderem valor: headline gigante por seção,
   itálico Fraunces, números, reveals idênticos em cada parágrafo.
8. Nenhum campo visual compartilhado; nenhuma física de movimento única.
9. Falta a sensação de estúdio digital premium das referências
   (Vivid/Yugen): trabalho em escala, interação relevante, continuidade.

## Decisão para a v3
Descartar a arquitetura de salas. Reconstruir sobre uma espinha única:
um campo visual global (fragmentos em suspensão + brasa) que atravessa
preloader → hero → projetos → CTA → footer, com um único ciclo de
superfície (papel → mergulho na tinta no encerramento) e uma gramática
de motion de quatro primitivas. Três cases desde o início. Copy congelada,
redistribuída e registrada em docs/copy-content-map-v3.md.
