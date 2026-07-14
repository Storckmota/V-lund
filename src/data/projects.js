/* Registro modular de projetos.
   O primeiro projeto está marcado como `static: true` porque seu markup
   vive em index.html (conteúdo precisa existir sem JavaScript).
   Novos cases entram aqui e são renderizados por scripts/projects.js. */
export const projects = [
  {
    static: true,
    id: 'allure-branding',
    nome: ['Alluré', 'Branding'],
    tese: 'A marca já tinha nível.\nO site não acompanhava.',
    url: 'https://allure-pink.vercel.app',
    imagens: {
      desktop: '/projects/allure-home-1440.webp',
      desktopSmall: '/projects/allure-home-760.webp',
      mobile: '/projects/allure-mobile-390.webp',
    },
    blocos: [
      {
        titulo: 'Contexto',
        texto:
          'A Alluré Branding cuida de registro de marcas. O atendimento sempre foi de alto nível, mas o que existia na internet não mostrava isso. O pedido: um site à altura do que a cliente entrega pessoalmente.',
      },
      {
        titulo: 'O que foi construído',
        texto:
          'Um site de página única com direção visual criada do zero: tipografia com peso, texto organizado a partir do conteúdo real da Alluré, movimento contido e composição própria para o celular.',
      },
      {
        titulo: 'Consequência',
        texto:
          'O site tirou a Alluré do padrão do segmento e adiantou o ponto onde a confiança começa: o que dependia do primeiro atendimento agora acontece já na primeira visita.',
      },
    ],
    ficha: [
      ['formato', 'site one page'],
      ['direção visual', 'criada do zero'],
      ['mobile', 'composição própria'],
      ['status', 'no ar'],
    ],
  },
];
