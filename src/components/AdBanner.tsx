'use client';

import { useEffect } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  style?: React.CSSProperties;
  className?: string;
}

export default function AdBanner({ slot, format = 'auto', style, className }: AdBannerProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('Adsense error:', e);
    }
  }, []);

  // Mapeamento de nomes de slot para IDs numéricos do Adsense via Env
  const getNumericSlot = (name: string) => {
    switch (name) {
      case 'sidebar-left': return process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_LEFT;
      case 'sidebar-right': return process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_RIGHT;
      case 'home-top-horizontal': return process.env.NEXT_PUBLIC_ADSENSE_SLOT_HORIZONTAL;
      default: return null;
    }
  };

  const adSlot = getNumericSlot(slot) || slot;

  return (
    <div className={`overflow-hidden flex justify-center items-center bg-gray-100/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 min-h-[100px] ${className}`}>
      {/* Placeholder visual se não houver anúncios reais carregando */}
      <ins
        className="adsbygoogle"
        style={style || { display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-0000000000000000'}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      {!process.env.NEXT_PUBLIC_ADSENSE_ID && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/40 p-4 text-center">
            <div className="text-yellow-500 mb-2">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Configure <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">NEXT_PUBLIC_ADSENSE_ID</code> no Netlify para ativar anúncios.</p>
        </div>
      )}
      {/* Label de Anúncio discreta */}
      <div className="absolute top-0 right-0 p-1 text-[8px] uppercase text-gray-400 font-bold tracking-widest">Publicidade</div>
    </div>
  );
}
