/* Registro central dos três cases da v3.
   O markup dos cases vive em index.html (conteúdo precisa existir sem
   JavaScript); este arquivo é a fonte de verdade dos dados e o ponto
   único de substituição dos placeholders.

   Enquanto `isPlaceholder: true` existir em algum item:
   - a página carrega <meta name="robots" content="noindex, nofollow">;
   - o case não recebe link externo nem schema;
   - pendência de publicação registrada em docs/copy-content-map-v3.md. */

export const projects = [
  {
    id: 'allure-branding',
    name: 'Alluré Branding',
    slug: 'allure-branding',
    category: 'Site institucional',
    year: 2026,
    summary:
      'A Alluré Branding cuida de registro de marcas. O atendimento sempre foi de alto nível, mas o que existia na internet não mostrava isso. O pedido: um site à altura do que a cliente entrega pessoalmente.',
    line: 'A marca já tinha nível. O site não acompanhava.',
    services: ['site one page', 'direção visual criada do zero', 'composição própria para mobile'],
    media: {
      desktop: '/projects/allure-home-1440.webp',
      desktopSmall: '/projects/allure-home-760.webp',
      mobile: '/projects/allure-mobile-390.webp',
    },
    accent: '#111014',
    href: 'https://allure-pink.vercel.app',
    isPlaceholder: false,
    /* Conteúdo editorial completo preservado (não exibido integralmente
       na v3 — ver docs/copy-content-map-v3.md): */
    blocos: [
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
  },
  {
    id: 'projeto-02',
    name: 'Projeto 02',
    slug: 'projeto-02',
    category: 'E-commerce editorial',
    year: 2026,
    summary:
      'Espaço reservado para o próximo case. A composição usa material sintético criado no próprio repositório para validar o sistema do portfólio.',
    line: 'Conteúdo temporário.',
    services: ['direção visual', 'catálogo', 'composição própria para mobile'],
    media: { synthetic: true },
    accent: '#22301F',
    href: null,
    isPlaceholder: true,
  },
  {
    id: 'projeto-03',
    name: 'Projeto 03',
    slug: 'projeto-03',
    category: 'Landing page de lançamento',
    year: 2026,
    summary:
      'Espaço reservado para o próximo case. A composição usa material sintético criado no próprio repositório para validar o sistema do portfólio.',
    line: 'Conteúdo temporário.',
    services: ['landing page', 'argumento único', 'captura sem fricção'],
    media: { synthetic: true },
    accent: '#E7E1D4',
    href: null,
    isPlaceholder: true,
  },
];
