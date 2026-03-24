import ProductList from '@/components/ProductList';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return [
    { categoria: 'eletronicos' },
    { categoria: 'casa' },
    { categoria: 'moda' },
    { categoria: 'saude' },
    { categoria: 'estudos' },
    { categoria: 'esportes' },
    { categoria: 'beleza' },
    { categoria: 'automotivo' },
  ];
}

const CATEGORY_NAMES: Record<string, string> = {
  eletronicos: 'Eletrônicos',
  casa: 'Casa e Decoração',
  moda: 'Moda e Acessórios',
  saude: 'Saúde e Bem-estar',
  estudos: 'Livros e Estudos',
  esportes: 'Esportes e Lazer',
  beleza: 'Beleza e Cuidado Pessoal',
  automotivo: 'Autopeças',
};

export default async function CategoryPage({ params }: { params: Promise<{ categoria: string }> }) {
  const resolvedParams = await params;
  const categoria = resolvedParams.categoria;
  
  if (!CATEGORY_NAMES[categoria]) {
    notFound();
  }

  return (
    <div className="pt-6">
      <div className="mx-4 sm:mx-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 mb-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">{CATEGORY_NAMES[categoria]}</h1>
        <p className="text-gray-600 text-lg">
          Explore os produtos mais populares e mais vendidos do Mercado Livre nesta categoria.
        </p>
      </div>
      <ProductList categoria={categoria} title={`Mais Vendidos - ${CATEGORY_NAMES[categoria]}`} />
    </div>
  );
}
