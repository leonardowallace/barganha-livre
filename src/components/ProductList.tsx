'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import SkeletonCard from './SkeletonCard';
import { ProdutoAfiliado } from '@/app/api/produtos/route';

interface ProductListProps {
  categoria: string;
  title: string;
}

export default function ProductList({ categoria, title }: ProductListProps) {
  const [produtos, setProdutos] = useState<ProdutoAfiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch(`/api/produtos?categoria=${encodeURIComponent(categoria)}`);
        if (!res.ok) {
          throw new Error('Falha ao carregar produtos');
        }
        const data = await res.json();
        setProdutos(data);
      } catch (err: any) {
        setError(err.message || 'Erro desconhecido ao carregar produtos do Mercado Livre.');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [categoria]);

  return (
    <div className="py-6 sm:py-10">
      <div className="flex items-center mb-6 sm:mb-8 px-4 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
          <span className="w-1.5 h-8 bg-blue-600 dark:bg-blue-500 rounded-full inline-block"></span>
          {title}
        </h2>
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
          : produtos.map((produto) => (
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
