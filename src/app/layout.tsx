import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';

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
    <html lang="pt-BR" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-[#020617] min-h-screen flex flex-col text-gray-900 dark:text-gray-100 antialiased transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <Navbar />
          <main className="flex-grow w-full max-w-7xl mx-auto pb-12">
            {children}
          </main>
          <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 py-10 mt-auto">
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
              <div className="mt-4 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-800 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-xs text-slate-400">
                  Os preços e a disponibilidade dos produtos são atualizados automaticamente a cada 5 horas e podem sofrer variações.
                </p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
