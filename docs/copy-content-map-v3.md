# Mapa de conteúdo v2 → v3 (copy congelada)

Nenhum texto foi reescrito. Este documento registra redistribuições e
omissões temporárias. Conteúdo omitido permanece no repositório
(src/data/projects.js e histórico git da v2).

## Hero
| Texto | v2 | v3 | Nota |
|---|---|---|---|
| "Sites, landing pages e experiências web à altura da sua marca." | 4 linhas deslocadas | bloco composto de 3 linhas | mesmo texto, nova composição |
| "Estúdio de presença digital" (eyebrow) | hero | hero | mantido |
| Lead "Criamos páginas e experiências web…" | hero | hero | mantido |
| "ver o trabalho ↓" | hint da figura | hint das lâminas de projeto | mantido |

## Case Alluré
| Texto | v2 | v3 | Nota |
|---|---|---|---|
| Tese "A marca já tinha nível. O site não acompanhava." | blockquote | linha do case | mantido |
| Bloco "Contexto" | case | resumo do case | mantido integral |
| Bloco "O que foi construído" | case | **omitido da página** | preservado em src/data/projects.js; a v3 mostra a síntese "direção visual criada do zero · composição própria para o celular" (valores da antiga ficha) |
| Bloco "Consequência" | case | **omitido da página** | preservado em src/data/projects.js; motivo: reduzir o case editorial longo (diretriz v3 §11) |
| Ficha (formato/direção/mobile/status) | aside dl | condensada na linha meta "site institucional · one page · 2026 · no ar" | mesmos fatos |
| "Ver o projeto no ar →" | case | case | mantido |

## Posicionamento
Tudo mantido: manifesto, dois parágrafos de apoio, bloco "momentos"
(título + 3 itens + fecho). Mudança apenas de composição (colunas).

## Serviços
| Texto | v2 | v3 | Nota |
|---|---|---|---|
| 3 serviços + descrições | acordeão | lista tipográfica aberta | tudo visível sem interação |
| "O que entregamos." | h2 | h3 (título operacional do bloco) | mantido |
| Piso ("Design, clareza, SEO…") | mantido | mantido | |
| Capacidades (intro + 7 itens + fecho) | mantido | mantido, coda compacta | |

## Método + Estúdio
| Texto | v2 | v3 | Nota |
|---|---|---|---|
| Intro do método + 6 etapas | palco sticky com contador "01/06" | traço de brasa contínuo | textos idênticos; contador removido (elemento de UI, não copy) |
| "Um processo claro, do início à entrega." | mantido | mantido | |
| Estúdio (título, lead, pull, 4 princípios) | seção própria | conclusão do movimento Processo | textos idênticos; itálico do pull removido (contenção) |

## Fechamento + Footer
| Texto | v2 | v3 | Nota |
|---|---|---|---|
| Título, apoio, CTA, número | mantidos | mantidos | |
| Headings "Navegação" / "Contato" do footer | h2 visuais | **omitidos** | eram rótulos estruturais do footer 3 colunas; navegação e contato seguem presentes com aria-label |
| "© 2026 Vólund" + "estúdio de presença digital" | 2 parágrafos | 1 linha meta | mesmos fatos |

## Placeholders (Projeto 02 / Projeto 03)
Textos novos são apenas operacionais/sintéticos, autorizados pelo
briefing: nomes "Projeto 02/03", meta "conteúdo temporário", resumo
descrevendo o placeholder, e microtextos dentro das superfícies
sintéticas ("Objetos com origem.", "Pré-lançamento", "Entrar na lista").
Nenhum é copy institucional da Vólund.

## Pendências de publicação
- Remover `<meta name="robots" content="noindex, nofollow">` quando os
  dois placeholders forem substituídos por cases reais.
- Domínio definitivo, canonical e OG absolutos (pendência herdada da v1).
