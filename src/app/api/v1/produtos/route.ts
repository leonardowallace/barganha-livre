import { NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, query, limitToLast } from 'firebase/database';

export const dynamic = 'force-dynamic';

export interface ProdutoAfiliado {
  id: string;
  mlb_id: string;
  title: string;
  price: number;
  image: string;
  affiliate_url: string;
  categoria: string;
  data_adicionado?: string;
  permalink?: string;
}

function sanitizeAffiliateUrl(url: string): string {
  if (!url) return '';
  // Garante que o URL tenha protocolo absoluto para não ser tratado como caminho relativo
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');

    const produtosRef = ref(rtdb, 'produtos');
    const q = query(produtosRef); 
    const snapshot = await get(q);
    
    if (!snapshot.exists()) {
      return NextResponse.json([]);
    }

    const data = snapshot.val();
    let produtos = Object.keys(data).map(key => {
      const prod = data[key];
      const permalink = prod.permalink || '';
      const separator = permalink.includes('?') ? '&' : '?';
      const rawUrl = prod.affiliate_url || `${permalink}${separator}matt_tool=55704581&matt_word=rodriguesleonardo2022060705062`;
      const affiliate_url = sanitizeAffiliateUrl(rawUrl);

      return {
        id: key,
        ...prod,
        affiliate_url
      };
    });

    if (categoria && categoria !== 'ofertas' && categoria !== 'todos') {
      const catLower = categoria.toLowerCase();
      produtos = produtos.filter((p: any) => {
        if (!p.categoria) return false;
        const pCatLower = p.categoria.toLowerCase();
        // Match exato com o ID ou se o ID está contido no nome (ex: "celulares" em "Celulares e Telefones")
        return pCatLower === catLower || pCatLower.includes(catLower);
      });
    }

    produtos.sort((a: any, b: any) => {
      const timeA = a.data_adicionado ? new Date(a.data_adicionado).getTime() : 0;
      const timeB = b.data_adicionado ? new Date(b.data_adicionado).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json(produtos);
  } catch (error: any) {
    console.error('[API V1] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
