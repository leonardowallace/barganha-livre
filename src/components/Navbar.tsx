'use client';

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { CATEGORIES_CONFIG } from '@/lib/categories';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ChevronDownIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const SearchIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

interface NavbarProps {
  initialCategories?: Array<{ id: string; name: string; path: string }>;
}

export default function Navbar({ initialCategories }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-800/50 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="font-extrabold text-2xl tracking-tighter text-blue-800 dark:text-blue-400">
              X <span className="text-yellow-500 font-black">Promo</span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative w-full group">
              <input
                type="text"
                placeholder="O que você está procurando hoje?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all duration-300 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none dark:text-gray-200 shadow-sm group-hover:shadow-md"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <SearchIcon />
              </div>
            </form>
          </div>

          {/* desktop links */}
          <div className="hidden lg:flex items-center space-x-1">
             <div className="relative group">
                <button className="flex items-center space-x-1.5 hover:bg-blue-50/80 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300">
                  <span>Categorias</span>
                  <span className="group-hover:rotate-180 transition-transform duration-200">
                    <ChevronDownIcon />
                  </span>
                </button>
                
                <div className="absolute right-0 mt-0 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    {CATEGORIES_CONFIG[0].categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={cat.path}
                        className="block px-5 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors font-medium"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <ThemeToggle />
          </div>

          {/* Mobile search toggle / theme toggle */}
          <div className="flex lg:hidden items-center space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Search & Categories Area */}
      <div className="lg:hidden border-t border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        {/* Mobile Search Input */}
        <div className="px-4 py-3 md:hidden">
          <form onSubmit={handleSearch} className="relative w-full group">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 rounded-full py-2 pl-10 pr-4 text-xs focus:outline-none dark:text-gray-200"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
          </form>
        </div>

        {/* Mobile Categories Scroll */}
        <div 
          className="overflow-x-auto whitespace-nowrap px-4 py-3" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
          <div className="flex space-x-2">
            <Link 
              href="/" 
              className="inline-block bg-blue-600 px-4 py-1.5 rounded-full text-[10px] font-bold text-white shadow-lg"
            >
              🔥 Ofertas
            </Link>
            {CATEGORIES_CONFIG[0].categories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.path}
                className="inline-block bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
