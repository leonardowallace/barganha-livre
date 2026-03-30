'use client';

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { CATEGORIES_CONFIG } from '@/lib/categories';
import { useState } from 'react';

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

interface NavbarProps {
  initialCategories?: Array<{ id: string; name: string; path: string }>;
}

export default function Navbar({ initialCategories }: NavbarProps) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-800/50 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="font-extrabold text-2xl tracking-tighter text-blue-800 dark:text-blue-400">
              X <span className="text-yellow-500 font-black">Promo</span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center">
            <div className="ml-10 flex items-center space-x-1">
              <Link
                href="/"
                className="hover:bg-blue-50/80 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 px-3 py-2 rounded-full text-sm font-bold transition-all duration-300"
              >
                Ofertas
              </Link>

              {CATEGORIES_CONFIG.map((group) => (
                <div 
                  key={group.name} 
                  className="relative group"
                  onMouseEnter={() => setOpenGroup(group.name)}
                  onMouseLeave={() => setOpenGroup(null)}
                >
                  <button className="flex items-center space-x-1 hover:bg-blue-50/80 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 px-3 py-2 rounded-full text-sm font-bold transition-all duration-300 group">
                    <span>{group.name}</span>
                    <span className="group-hover:rotate-180 transition-transform duration-200">
                      <ChevronDownIcon />
                    </span>
                  </button>
                  
                  <div className="absolute left-0 mt-0 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      {group.categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={cat.path}
                          className="block px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center pl-2 space-x-2">
             <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile menu - Horizontal Scroll Grouped */}
      <div className="lg:hidden overflow-x-auto whitespace-nowrap bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-3 border-b border-gray-100 dark:border-slate-800" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
        <div className="flex space-x-2">
          <Link href="/" className="inline-block bg-blue-600 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg mr-1">
            Ofertas
          </Link>
          {CATEGORIES_CONFIG.map((group) => 
            group.categories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.path}
                className="inline-block bg-gray-100/80 dark:bg-slate-800/80 px-4 py-1.5 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-slate-700 transition-all"
              >
                {cat.name}
              </Link>
            ))
          )}
        </div>
      </div>
    </nav>
  );
}
