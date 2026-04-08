'use client';

import { useEffect, useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import SkeletonCard from './SkeletonCard';
import { ProdutoAfiliado } from '@/app/api/v1/produtos/route';

interface ProductListProps {
  categoria: string;
  title: string;
  initialData?: ProdutoAfiliado[];
}

export default function ProductList({ categoria, title, initialData }: ProductListProps) {
  const [produtos, setProdutos] = useState<ProdutoAfiliado[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'relevancia' | 'menor-preco' | 'maior-preco'>('relevancia');

  const produtosOrdenados = useMemo(() => {
    const list = [...produtos];
    if (sortBy === 'menor-preco') {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'maior-preco') {
      return list.sort((a, b) => b.price - a.price);
    }
    return list; // Relevância (ordem original)
  }, [produtos, sortBy]);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setLoading(false);
      return;
    }
    
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/produtos?categoria=${encodeURIComponent(categoria)}`, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Falha ao carregar produtos');
        }
        const data = await res.json();
        console.log(`[XPROMO] ${data.length} produtos recebidos.`);
        setProdutos(data);
      } catch (err: any) {
        console.error('[XPROMO] Erro ao carregar:', err.message);
        setError(err.message || 'Erro desconhecido ao carregar produtos do Mercado Livre.');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [categoria]);

  return (
    <div className="py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 px-4 sm:px-0 gap-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
          <span className="w-1.5 h-8 bg-blue-600 dark:bg-blue-500 rounded-full inline-block"></span>
          {title}
        </h2>

        {!loading && produtos.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Ordenar por:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white dark:bg-slate-800 border-none shadow-sm rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 py-1.5 pl-3 pr-8 focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none appearance-none transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' %3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25rem'
              }}
            >
              <option value="relevancia">Destaques</option>
              <option value="menor-preco">Menor Preço</option>
              <option value="maior-preco">Maior Preço</option>
            </select>
          </div>
        )}
      </div>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-8 mx-4 sm:mx-0 rounded-r-md shadow-sm" role="alert">
          <p className="font-medium">Ops! Tivemos um problema.</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 px-4 sm:px-0">
        {loading
          ? Array.from({ length: 15 }).map((_, i) => <SkeletonCard key={i} />)
          : produtosOrdenados.map((produto) => (
              <ProductCard
                key={produto.id}
                title={produto.title}
                price={produto.price}
                image={produto.image}
                affiliate_url={produto.affiliate_url}
              />
            ))}
        
        {!loading && produtos.length === 0 && !error && (
          <div className="col-span-full py-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
            <p className="text-lg font-medium">Nenhum produto encontrado para "{title}".</p>
            <p className="text-sm mt-2">Tente novamente mais tarde.</p>
          </div>
        )}
      </div>
    </div>
  );
}
