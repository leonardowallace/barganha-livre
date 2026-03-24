import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

const categories = [
  { name: 'Ofertas', path: '/' },
  { name: 'Eletrônicos', path: '/eletronicos' },
  { name: 'Casa', path: '/casa' },
  { name: 'Moda', path: '/moda' },
  { name: 'Saúde', path: '/saude' },
  { name: 'Estudos', path: '/estudos' },
  { name: 'Esportes', path: '/esportes' },
  { name: 'Beleza', path: '/beleza' },
  { name: 'Automotivo', path: '/automotivo' },
];

export default function Navbar() {
  return (
    <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-800/50 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="font-extrabold text-2xl tracking-tighter text-blue-800 dark:text-blue-400">
              Promo<span className="text-yellow-500">X</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center">
            <div className="ml-10 flex items-baseline space-x-1">
              {categories.map((cat) => (
                <Link
                  key={cat.path}
                  href={cat.path}
                  className="hover:bg-blue-50/80 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 px-3 py-2 rounded-full text-sm font-semibold transition-all duration-300"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center pl-2">
             <ThemeToggle />
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className="md:hidden overflow-x-auto whitespace-nowrap bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-3 border-b border-gray-100 dark:border-slate-800" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
        <div className="flex space-x-2">
          {categories.map((cat) => (
            <Link
              key={cat.path}
              href={cat.path}
              className="inline-block bg-gray-100/80 dark:bg-slate-800/80 px-4 py-1.5 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-slate-700 hover:text-blue-800 dark:hover:text-blue-400 transition-all duration-300"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
