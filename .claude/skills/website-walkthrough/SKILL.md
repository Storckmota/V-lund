---
name: website-walkthrough
description: Use esta skill ao gravar, corrigir, comprimir ou integrar walkthroughs desktop e mobile de sites na vitrine de Projetos da Vólund. Ela exige gravação contínua da hero ao footer, posters limpos e playback iniciado exclusivamente por hover, foco ou toque.
user-invocable: true
---

# Website Walkthrough

Antes de gravar, corrigir, comprimir ou integrar walkthroughs da vitrine de Projetos da Volund, abrir tambem:

- `.claude/skills/playwright-recording/SKILL.md`
- `.claude/skills/ffmpeg/SKILL.md`
- `.claude/skills/caveman/SKILL.md`

Usar `tools/video-recording` para infraestrutura local. Nao alterar a secao Projetos, videos atuais, HTML, CSS ou JavaScript sem pedido explicito do usuario.

## Captura

* usar navegador real com Playwright;
* começar exatamente no topo da hero;
* aguardar preloader;
* aguardar `document.fonts.ready`;
* aguardar imagens e lazy loading;
* voltar ao topo antes da gravação;
* o primeiro frame válido deve ser a hero limpa;
* nenhuma faixa verde, rosa ou marcador pode aparecer;
* nenhum navegador, cursor ou controle pode entrar no vídeo;
* gravar um scroll contínuo;
* não criar slideshow de screenshots;
* não criar cortes entre seções;
* não usar zoom ou efeito Ken Burns;
* chegar obrigatoriamente ao footer;
* permanecer brevemente na hero e no footer.

## Desktop e mobile

* criar um vídeo desktop e um mobile por projeto;
* usar viewports reais;
* medir a altura real de cada documento;
* calcular a distância separadamente;
* usar a mesma duração total no par desktop/mobile;
* permitir que o mobile percorra mais pixels por segundo quando sua página for mais alta;
* não usar acelerações locais;
* não criar rajadas por seção;
* usar progresso temporal normalizado;
* garantir que os dois terminem no footer.

## Assets

* duração alvo entre 14 e 17 segundos;
* 30 fps constante;
* sem áudio;
* WebM otimizado;
* MP4 apenas como fallback;
* poster desktop e mobile extraídos do primeiro frame limpo;
* proporção do asset compatível com a superfície;
* zero `object-fit: cover`;
* zero `object-fit: fill`;
* zero distorção;
* zero crop usado para esconder erro.

## Projeto-canário

* antes de processar os seis vídeos, trabalhar apenas com Alluré;
* abrir o arquivo diretamente e confirmar movimento;
* integrar Alluré;
* confirmar manualmente que o hover funciona;
* somente depois aplicar o workflow a Leonardo e Alexander;
* nunca processar tudo em massa antes de validar o canário.

## Playback no frontend

* scroll nunca inicia vídeo;
* IntersectionObserver pode carregar metadados, mas nunca reproduzir;
* `pointerenter` e `focusin` iniciam;
* antes de tocar, definir desktop e mobile em `currentTime = 0`;
* ambos precisam começar na hero;
* aguardar os dois estarem prontos;
* iniciar os dois juntos;
* `pointerleave` e `focusout` pausam e resetam;
* posters retornam;
* nenhum loop;
* somente um projeto pode tocar;
* troca de aba pausa tudo;
* touch usa toque explícito, nunca autoplay.

## Composição

* exatamente duas superfícies:

  * desktop;
  * mobile;
* desktop e mobile lado a lado;
* mobile com presença real;
* zero overlap;
* zero terceiro retângulo;
* zero zoom no hover;
* sombra pode mudar discretamente;
* dimensões e enquadramento permanecem fixos.

## Aprovação

* build serve apenas para detectar erro técnico;
* não produzir QA extenso;
* não declarar aprovação visual;
* o usuário fará a auditoria manual;
* relatório curto e factual.
 
## Comando Local

Para gravar o canário sem alterar o frontend:

```bash
cd tools/video-recording
npm run record:walkthrough -- --url "http://127.0.0.1:4173/" --slug allure --desktop 1440x900 --mobile 390x844 --duration 15 --output "./output/allure"
```

Usar `--mp4` somente quando MP4 fallback for necessario. Usar `--force` somente quando o usuario autorizar sobrescrita de assets gerados.
