import ProductList from '@/components/ProductList';
import { notFound } from 'next/navigation';
import { getProdutos, CATEGORY_NAMES } from '@/lib/products';

// Habilitar a geração dinâmica para categorias que não estão no cache estático
export const dynamicParams = true;

export default async function CategoryPage({ params }: { params: Promise<{ categoria: string }> }) {
  const resolvedParams = await params;
  const categoria = resolvedParams.categoria;
  
  // Nome amigável da categoria
  const categoryName = CATEGORY_NAMES[categoria] || (categoria.charAt(0).toUpperCase() + categoria.slice(1));

  // Buscar produtos da categoria (sem limite conforme solicitado)
  const produtos = await getProdutos(categoria, undefined);

  // Se a categoria não existir em nossa lista mestra, damos notFound
  // Isso evita URLs lixo de serem indexadas
  if (!CATEGORY_NAMES[categoria]) {
    notFound();
  }

  return (
    <div className="pt-6">
      <div className="mx-4 sm:mx-0 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 sm:p-10 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
              {categoryName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">
              Confira as melhores ofertas e produtos selecionados em <span className="text-blue-600 dark:text-blue-400 font-semibold">{categoryName}</span>.
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <span className="text-blue-700 dark:text-blue-300 font-bold text-sm">
              {produtos.length} Produtos Encontrados
            </span>
          </div>
        </div>
      </div>
      
      <ProductList 
        categoria={categoria} 
        title={`Ofertas em ${categoryName}`} 
        initialData={produtos} 
      />
    </div>
  );
}
