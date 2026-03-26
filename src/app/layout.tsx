import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';
import AdBanner from '@/components/AdBanner';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
// ... (metadata remains same)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <script 
          async 
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || 'G-KG1VQ2LYRK'}`}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || 'G-KG1VQ2LYRK'}');
            `,
          }}
        />
        {/* Google Adsense */}
        <script 
          async 
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${
            process.env.NEXT_PUBLIC_ADSENSE_ID?.startsWith('pub-') 
              ? `ca-${process.env.NEXT_PUBLIC_ADSENSE_ID}` 
              : (process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-0000000000000000')
          }`} 
          crossOrigin="anonymous">
        </script>
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-[#020617] min-h-screen flex flex-col text-gray-900 dark:text-gray-100 antialiased transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <Navbar />
          <div className="flex-grow flex flex-col lg:flex-row max-w-[1700px] mx-auto w-full group/layout">
            {/* Sidebar Esquerda (Anúncio) */}
            <aside className="hidden xl:block w-[180px] flex-shrink-0 pt-8 pl-4 opacity-80 hover:opacity-100 transition-opacity">
               <div className="sticky top-24">
                  <AdBanner slot="sidebar-left" style={{ display: 'block', height: '600px' }} className="h-[600px]" />
               </div>
            </aside>

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 xl:px-4">
              {children}
            </main>

            {/* Sidebar Direita (Anúncio) */}
            <aside className="hidden xl:block w-[180px] flex-shrink-0 pt-8 pr-4 opacity-80 hover:opacity-100 transition-opacity">
               <div className="sticky top-24">
                  <AdBanner slot="sidebar-right" style={{ display: 'block', height: '600px' }} className="h-[600px]" />
               </div>
            </aside>
          </div>
          <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 py-10 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
              <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
                X <span className="text-yellow-400">Promo</span>
              </h2>
              <p className="mb-6 text-slate-400">As melhores recomendações em um só lugar.</p>
              <div className="w-full h-px bg-slate-800 mb-6"></div>
              <p className="text-sm">X Promo &copy; {new Date().getFullYear()} - Todos os direitos reservados</p>
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
