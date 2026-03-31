import { getProdutos } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

interface SearchPageProps {
  searchParams: { q?: string };
}

export default async function SearchPage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || '';
  const produtos = await getProdutos('todos', 100, query);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-600 selection:text-white">
      <main className="flex-grow pt-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="text-blue-600 dark:text-blue-400">Resultados para:</span>
              <span className="italic">"{query}"</span>
            </h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg">
              {produtos.length} {produtos.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </p>
          </header>

          {produtos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {produtos.map((produto) => (
                <div key={produto.id} className="transform transition-all duration-300 hover:scale-[1.02]">
                  <ProductCard 
                    title={produto.title}
                    price={produto.price}
                    image={produto.image || ''}
                    affiliate_url={produto.affiliate_url}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm mt-10">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Puxa, não encontramos nada...</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Tente buscar com termos mais genéricos ou confira nossas categorias principais na barra acima.
              </p>
              <div className="mt-8">
                <a href="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  Ver todas as ofertas
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

