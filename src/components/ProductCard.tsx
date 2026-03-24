import Image from 'next/image';

interface ProductCardProps {
  title: string;
  price: number;
  image: string;
  affiliate_url: string;
}

export default function ProductCard({ title, price, image, affiliate_url }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.5)] hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.7)] transition-all duration-500 flex flex-col h-full border border-gray-100/80 dark:border-slate-800/80 group overflow-hidden transform hover:-translate-y-1">
      <div className="relative w-full aspect-square p-6 bg-white dark:bg-slate-800/50 flex items-center justify-center overflow-hidden mix-blend-multiply dark:mix-blend-normal rounded-t-2xl">
        {/* Usamos unoptimized img para simplificar já que vem de domínios dinâmicos do ML */}
        <img
          src={image}
          alt={title}
          className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] dark:group-hover:bg-white/[0.02] transition-colors duration-500" />
      </div>
      <div className="p-5 flex flex-col flex-grow border-t border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h3 className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 mb-3 flex-grow font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300" title={title}>
          {title}
        </h3>
        <p className="text-2xl font-black text-gray-900 dark:text-white mb-5 tracking-tight">{formattedPrice}</p>
        <a
          href={affiliate_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 text-center shadow-lg shadow-blue-600/20 dark:shadow-blue-500/20 hover:shadow-blue-600/40 dark:hover:shadow-blue-500/40 active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Ver Oferta</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </a>
      </div>
    </div>
  );
}
