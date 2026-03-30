export interface Category {
  id: string;
  name: string;
  path: string;
}

export interface CategoryGroup {
  name: string;
  categories: Category[];
}

export const CATEGORIES_CONFIG: CategoryGroup[] = [
  {
    name: 'Tecnologia',
    categories: [
      { id: 'celulares', name: 'Celulares', path: '/celulares' },
      { id: 'informatica', name: 'Informática', path: '/informatica' },
      { id: 'eletronicos', name: 'Eletrônicos, Áudio & Vídeo', path: '/eletronicos' },
      { id: 'games', name: 'Games', path: '/games' },
      { id: 'cameras', name: 'Câmeras', path: '/cameras' }
    ]
  },
  {
    name: 'Casa & Construção',
    categories: [
      { id: 'casa', name: 'Móveis & Decoração', path: '/casa' },
      { id: 'eletrodomesticos', name: 'Eletrodomésticos', path: '/eletrodomesticos' },
      { id: 'ferramentas', name: 'Ferramentas', path: '/ferramentas' },
      { id: 'construcao', name: 'Construção', path: '/construcao' }
    ]
  },
  {
    name: 'Moda & Beleza',
    categories: [
      { id: 'moda', name: 'Roupas & Acessórios', path: '/moda' },
      { id: 'calcados', name: 'Calçados', path: '/calcados' },
      { id: 'relogios', name: 'Joias & Relógios', path: '/relogios' },
      { id: 'beleza', name: 'Beleza & Cuidado Pessoal', path: '/beleza' }
    ]
  },
  {
    name: 'Veículos',
    categories: [
      { id: 'veiculos', name: 'Veículos', path: '/veiculos' },
      { id: 'automotivo', name: 'Acessórios Automotivos', path: '/automotivo' }
    ]
  },
  {
    name: 'Família & Pet',
    categories: [
      { id: 'bebes', name: 'Bebês', path: '/bebes' },
      { id: 'brinquedos', name: 'Brinquedos', path: '/brinquedos' },
      { id: 'petshop', name: 'Pet Shop', path: '/petshop' }
    ]
  },
  {
    name: 'Lifestyle & Saúde',
    categories: [
      { id: 'esportes', name: 'Esportes & Fitness', path: '/esportes' },
      { id: 'saude', name: 'Saúde', path: '/saude' },
      { id: 'livros', name: 'Livros & Revistas', path: '/livros' },
      { id: 'musica', name: 'Instrumentos Musicais', path: '/musica' },
      { id: 'supermercado', name: 'Supermercado', path: '/supermercado' }
    ]
  },
  {
    name: 'Outros',
    categories: [
      { id: 'industria', name: 'Indústria & Comércio', path: '/industria' },
      { id: 'escritorio', name: 'Arte & Papelaria', path: '/escritorio' },
      { id: 'servicos', name: 'Serviços', path: '/servicos' }
    ]
  }
];
