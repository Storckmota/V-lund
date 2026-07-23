# /record-site-walkthrough

Abra `.claude/skills/website-walkthrough/SKILL.md` antes de agir. Ela tambem exige abrir:

- `.claude/skills/playwright-recording/SKILL.md`
- `.claude/skills/ffmpeg/SKILL.md`
- `.claude/skills/caveman/SKILL.md`

Peca ao usuario, se ainda nao estiver claro:

- URL;
- slug do projeto;
- viewport desktop;
- viewport mobile;
- duracao;
- diretorio de saida.

Use Allure como canario por padrao quando o usuario nao indicar outro projeto. Gere primeiro apenas o par desktop/mobile e os posters. Nao processe Leonardo, Alexander ou todos os projetos em massa antes de validar o canario.

Execute a partir de `tools/video-recording`:

```bash
npm run record:walkthrough -- --url "<URL>" --slug "<slug>" --desktop "<WIDTHxHEIGHT>" --mobile "<WIDTHxHEIGHT>" --duration "<segundos>" --output "<diretorio-de-saida>"
```

Use `--mp4` apenas quando MP4 fallback for pedido ou necessario. Use `--force` apenas com autorizacao explicita para sobrescrever assets gerados.

Apos gravar:

- confirme tecnicamente que os dois WebM existem;
- confirme tecnicamente que os dois posters existem;
- confirme com `ffprobe` duracao, dimensoes e codec;
- abra diretamente os arquivos gerados quando for necessario confirmar movimento;
- nao alterar o frontend automaticamente;
- pare depois de produzir e validar tecnicamente os assets;
- nao declarar aprovacao visual;
- entregue relatorio curto e factual.
