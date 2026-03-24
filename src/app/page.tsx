import ProductList from '@/components/ProductList';

export default function Home() {
  return (
    <div className="pt-6 sm:pt-10">
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-3xl shadow-xl p-8 sm:p-14 mb-10 mx-4 sm:mx-0 text-white text-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>
        
        <div className="relative z-10">
          <span className="inline-block py-1.5 px-3 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-sm font-bold tracking-wide mb-6 uppercase shadow-sm">
            Plataforma de Afiliados
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight text-white drop-shadow-md">
            Descubra o Melhor do <br className="hidden sm:block" />
            <span className="text-yellow-400 drop-shadow-lg">Mercado Livre</span>
          </h1>
          <p className="text-lg sm:text-xl text-white max-w-2xl mx-auto leading-relaxed font-medium drop-shadow">
            Curadoria automática das ofertas com maior número de vendas e relevância.
            Tudo em um só lugar, atualizado pra você.
          </p>
        </div>
      </div>

      <ProductList categoria="ofertas" title="Ofertas em Destaque" />
    </div>
  );
}
