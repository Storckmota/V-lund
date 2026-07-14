# Auditoria de materiais — Site institucional Vólund

Data: 2026-07-13. Fontes: vault Obsidian (`reference-materials/obsidian-memory/`), apresentação comercial (`volund_apresentacao_2026.html`), quatro referências vivas, site publicado da Alluré.

## 1. Mensagem central

- Headline aprovada do hero: **"Sites, landing pages e experiências web à altura da sua marca."**
- Subheadline aprovada: "Criamos páginas e experiências web bem construídas e conectamos o que cada projeto precisa para mensurar resultados e organizar melhor a entrada comercial."
- CTA principal único: **"Falar sobre meu projeto"** (hero, após serviços, fechamento).
- Assinatura pública: **"Estúdio de presença digital"** (rodapé da apresentação).
- Tese editorial (apresentação): **"O Instagram é a vitrine; o site sustenta a decisão."** Apoio: "Antes de chamar no WhatsApp, quase todo mundo dá uma olhada. O site é o que responde por você nessa hora."
- Síntese interna (não publicar literalmente): design forte, presença digital e função clara, com inteligência adicional quando o projeto exige mais controle.

## 2. Identidade travada (03_Marca.md, adendo jul/2026)

- Nome: Vólund. Significado é interno; **nunca explicar no site**.
- Wordmark: VÓLUND em caps Fraunces 500, tracking 0.16em, opsz 24. Símbolo: V puro Fraunces opsz 144. Lockup principal: vertical (símbolo sobre nome).
- Cores: tinta `#17150F` · papel `#FAF8F4` · hairline `#E4E0D6` · muted `#8B8578` · corpo `#33302A` · brasa `#A03D2D` (sobre claro) / `#C45543` (sobre escuro).
- Brasa é sinal funcional: ~2 usos relevantes por tela; nunca em fundo cheio, texto corrido ou na marca. Marca só em tinta ou papel.
- Tipografia: Fraunces (display), Space Grotesk (corpo/UI), Space Mono (labels/índices).
- Conceito: **Editorial Operacional** (70% Editorial Arquitetônico, 20% Sistema Operacional Comercial, 10% Publicação Crítica Digital).
- SVGs extraídos da apresentação para `public/brand/volund-lockup.svg` (V + wordmark, viewBox 857×613) e `public/brand/volund-wordmark.svg` (viewBox 1594×381).

## 3. Copy aprovada disponível (15_Site/03_Copy_Aprovada/01_Homepage.md)

Seções com copy pronta: Hero, Contexto ("Cada empresa está num momento diferente no digital"), O que entregamos, Como trabalhamos ("Cada projeto começa entendendo o seu negócio"), Método (6 etapas: Leitura, Estrutura, Criação, Implementação, Conexões, Validação), Cases (moldura, sem conteúdo), Feedbacks (moldura, sem conteúdo), Fechamento ("Conte o que precisa resolver. A gente pensa o próximo passo com você.").

A apresentação traz microcopy adicional aprovada de fato (manifesto, descrições do case, passos do método em versão comercial).

## 4. Projetos reais encontrados

**Alluré Branding** — único case documentado e verificável:
- Cliente real de registro de marcas; site one-page premium, direção visual criada do zero, GSAP, mobile com composição própria.
- Link vivo: `https://allure-pink.vercel.app` (inspecionado e capturado para screenshots reais).
- Narrativa aprovada na apresentação: "A marca já tinha nível. O site não acompanhava." / "Agora o site sustenta a decisão." Ficha técnica: formato one page · nível premium · direção visual do zero · mobile próprio · status no ar.
- Sem métricas quantitativas reais: **nenhum resultado numérico será publicado**.

`Cliente_02_Dominio_Corporal.md` está vazio: não existe segundo case documentado. Decisão: **um case em formato editorial de destaque**, sem placeholders.

## 5. Depoimentos

Nenhum depoimento real registrado no vault. Regra da copy aprovada: ocultar a seção com menos de dois depoimentos. **Seção Feedbacks não será renderizada.**

## 6. Contatos confirmados

- WhatsApp: `+55 27 99955-5259` (apresentação), com mensagem pré-preenchida.
- E-mail: **não confirmado** em nenhum material → omitido.
- Instagram/redes: **nenhum handle confirmado** → omitidos do footer.
- Domínio definitivo: **não definido** → canonical/OG documentados como pendência.

## 7. Assets disponíveis

- SVG do lockup e do wordmark (extraídos da apresentação).
- Screenshots reais do site da Alluré (produzidos por inspeção do link vivo).
- Nenhuma fotografia própria; nenhuma imagem de banco será usada. O restante da página é tipografia, hairlines e composição CSS/SVG.

## 8. Elementos extraídos de cada referência (mesmo peso)

- **Symbol Studio**: narrativa institucional longa que não vira documento; serviços como sistema numerado; confiança tipográfica; alternância de escala entre blocos; projetos como prova no meio do argumento.
- **Vivid Motion**: trabalho aparecendo cedo e grande; primeira dobra de impacto imediato; hierarquia forte headline → prova; estados de hover com resposta clara; energia sem ruído.
- **Yugen Agency**: ritmo de jornada entre seções; cada seção com identidade própria dentro do mesmo sistema; transição controlada de atmosfera (papel ↔ tinta); tipografia expressiva que continua legível.
- **Noteworthy Studio**: objetividade; projeto como conteúdo central com contexto curto; personalidade em detalhes pequenos (labels, microcopy); ausência de discurso corporativo.

Regra aplicada: absorver nível de ambição e acabamento; nada de cópia de grid, cor, fonte, animação ou composição.

## 9. Riscos de parecer genérico (mitigações)

1. Três cards de serviço iguais → serviços como índice editorial 01/02/03 com hairlines e conteúdo expandido, sem ícones.
2. Timeline corporativa no método → progressão tipográfica numerada com Fraunces em grande escala.
3. Hero centralizado com botão → composição asimétrica com masthead, colunas e linha de brasa funcional.
4. Falta de imagem → tipografia como material principal (decisão da marca, não fallback).
5. Copy com cara de IA → copy aprovada preservada; travessões longos removidos; sem clichês de agência.

## 10. Decisões para mobile

- Composição própria: masthead do hero recalculado (escala fluida com clamp), navegação em overlay de tela cheia tinta-sobre-papel invertido, método em lista vertical com números grandes, case empilhado com screenshot primeiro, footer reorganizado em blocos.
- Hovers convertidos: preview do case sempre visível em touch; estados ativos por foco/tap.
- Aprendizado registrado da Alluré: reduzir linhas divisórias no mobile; masthead não pode competir com CTA.

## 11. Limitações e pendências registradas

- Domínio não definido (canonical, OG url, sitemap ficam com placeholder documentado, não inventado).
- Sem e-mail, sem redes, sem depoimentos, sem segundo case.
- Tracking (GA4/GTM) planejado no vault, mas sem IDs reais: não implementado nesta versão; pontos de evento anotados no código via `data-*`.
- Preços existem na apresentação, mas a regra comercial proíbe preço no site: **nada de valores, níveis Essencial/Avançado/Premium como tabela, ou "a partir de"**.
