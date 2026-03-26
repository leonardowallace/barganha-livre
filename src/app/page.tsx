import ProductList from '@/components/ProductList';
import AdBanner from '@/components/AdBanner';

export default function Home() {
  return (
    <div className="pt-6 sm:pt-10">
// ... (hero section remains same)
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-3xl shadow-xl p-8 sm:p-14 mb-10 mx-4 sm:mx-0 text-white text-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 sm:mb-6 tracking-tight text-white drop-shadow-lg leading-tight">
            Descubra o Melhor do <br className="hidden sm:block" />
            <span className="text-yellow-400 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">Mercado Livre</span>
          </h1>
          <p className="text-base sm:text-xl text-blue-50 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-md px-2">
            Curadoria inteligente com os produtos mais desejados, melhores preços e promoções verificadas em tempo real.
          </p>
        </div>
      </div>

      {/* Banner de Anúncio Horizontal */}
      <div className="mb-10 mx-4 sm:mx-0">
        <AdBanner slot="home-top-horizontal" className="h-[90px] md:h-[120px]" />
      </div>

      <ProductList categoria="ofertas" title="Ofertas em Destaque" />
    </div>
  );
}
