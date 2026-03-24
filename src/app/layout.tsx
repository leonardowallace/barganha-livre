import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'PromoX - As melhores ofertas com links de afiliado',
  description: 'Plataforma automática de ofertas integrada ao Mercado Livre com os melhores preços',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col text-gray-900 antialiased`}>
        <Navbar />
        <main className="flex-grow w-full max-w-7xl mx-auto pb-12">
          {children}
        </main>
        <footer className="bg-slate-900 text-slate-300 py-10 mt-auto border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
              Promo<span className="text-yellow-400">X</span>
            </h2>
            <p className="mb-6 text-slate-400">As melhores recomendações em um só lugar.</p>
            <div className="w-full h-px bg-slate-800 mb-6"></div>
            <p className="text-sm">PromoX &copy; {new Date().getFullYear()} - Todos os direitos reservados</p>
            <p className="text-xs text-slate-500 mt-2 text-center max-w-md">
              Os links de compra neste site redirecionam para o Mercado Livre. Ao comprar através de nossos links, podemos receber uma comissão de afiliado sem custo adicional para você.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
