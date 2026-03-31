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
    name: 'Menu',
    categories: [
      { id: 'tecnologia', name: 'Tecnologia & Games', path: '/tecnologia' },
      { id: 'casa_eletro', name: 'Casa & Eletro', path: '/casa_eletro' },
      { id: 'construcao', name: 'Construção & Ferramentas', path: '/construcao' },
      { id: 'moda_beleza', name: 'Moda & Beleza', path: '/moda_beleza' },
      { id: 'saude_esportes', name: 'Saúde & Esportes', path: '/saude_esportes' },
      { id: 'lifestyle_kids', name: 'Lifestyle & Kids', path: '/lifestyle_kids' },
      { id: 'outros', name: 'Outros & Automotivo', path: '/outros' }
    ]
  }
];
