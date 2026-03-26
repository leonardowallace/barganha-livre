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

  return (
    <div className={`overflow-hidden flex justify-center items-center bg-gray-100/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 min-h-[100px] ${className}`}>
      {/* Placeholder visual se não houver anúncios reais carregando */}
      <ins
        className="adsbygoogle"
        style={style || { display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXX" // Substituir pelo ID Real
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      {/* Label de Anúncio discreta */}
      <div className="absolute top-0 right-0 p-1 text-[8px] uppercase text-gray-400 font-bold tracking-widest">Publicidade</div>
    </div>
  );
}
