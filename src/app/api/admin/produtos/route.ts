import { NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, set, remove, query, limitToLast } from 'firebase/database';
import { categorizeProduct } from '@/lib/gemini';

export interface ProdutoSalvo {
  id: string;
  mlb_id: string;
  title: string;
  price: number;
  image: string;
  permalink: string;
  categoria: string;
  score: number;
  data_adicionado: string;
}

function verifyAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedPassword = process.env.ADMIN_PASSWORD || 'promox2026';
  
  if (!authHeader) {
    console.error('[AUTH] Falha: Header Authorization ausente.');
    return false;
  }

  // Suporta tanto "Bearer senha" quanto apenas "senha"
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : authHeader;

  const isMatch = token === expectedPassword;

  if (!isMatch) {
    console.error(`[AUTH] Falha: Token incompatível.`);
  } else {
    console.log('[AUTH] Sucesso: Token validado.');
  }

  return isMatch;
}

export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const produtosRef = ref(rtdb, 'produtos');
    const q = query(produtosRef, limitToLast(100));
    const snapshot = await get(q);
    
    if (!snapshot.exists()) {
      return NextResponse.json([]);
    }

    const data = snapshot.val();
    const produtos: ProdutoSalvo[] = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
    }));

    // Ordenação manual: mais seguro para documentos legados
    produtos.sort((a, b) => {
        const dateA = a.data_adicionado ? new Date(a.data_adicionado).getTime() : 0;
        const dateB = b.data_adicionado ? new Date(b.data_adicionado).getTime() : 0;
        return dateB - dateA;
    });

    return NextResponse.json(produtos);
  } catch (error: any) {
    console.error('[API] RTD Read Error:', error);
    return NextResponse.json({ error: 'Erro ao ler produtos do RTD: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    let { url, categoria } = body;

    if (!url || !categoria) {
      return NextResponse.json({ error: 'URL e categoria são obrigatórios' }, { status: 400 });
    }

    console.log('[PIPELINE] 1. Recebido URL:', url);

    // Extração inteligente de IDs
    let mlbId = '';
    const urlObj = new URL(url);
    const wid = urlObj.searchParams.get('wid') || urlObj.searchParams.get('item_id');
    
    if (wid && wid.startsWith('MLB')) {
      mlbId = wid;
    } else {
      const match = url.match(/MLB[-]?(\d+)/i);
      if (match) mlbId = `MLB${match[1]}`;
    }

    if (!mlbId) {
      return NextResponse.json({ error: 'Nenhum ID do Mercado Livre identificado nesta URL.' }, { status: 400 });
    }

    console.log('[PIPELINE] 2. ID MLB Identificado:', mlbId);

    // Função auxiliar para fetch com timeout
    async function fetchWithTimeout(resource: string, options: any = {}) {
      const { timeout = 15000 } = options; 
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    }

    let mlData: any = null;

    try {
      const resItem = await fetchWithTimeout(`https://api.mercadolibre.com/items/${mlbId}`);
      if (resItem.ok) mlData = await resItem.json();
    } catch (e) {}

    if (!mlData) {
      try {
        const resProd = await fetchWithTimeout(`https://api.mercadolibre.com/products/${mlbId}`);
        if (resProd.ok) mlData = await resProd.json();
      } catch (e) {}
    }

    if (!mlData) {
      try {
        const pageRes = await fetchWithTimeout(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 10000
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i);
          const imageMatch = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
          const priceMatch = html.match(/"price":\s*(\d+(?:\.\d+)?)/i);
          if (titleMatch) {
            mlData = {
              title: titleMatch[1].trim(),
              price: priceMatch ? parseFloat(priceMatch[1]) : 0,
              thumbnail: imageMatch ? imageMatch[1] : '',
              permalink: url
            };
          }
        }
      } catch (e) {}
    }
    
    if (!mlData) {
      return NextResponse.json({ error: 'Falha ao obter dados do Mercado Livre. Verifique a URL.' }, { status: 504 });
    }

    if (categoria === 'automatico') {
      const title = mlData.title || mlData.name || '';
      const description = mlData.description || '';
      categoria = await categorizeProduct(title, description);
    }

    const novoProduto = {
      mlb_id: mlbId,
      title: (mlData.title || mlData.name || 'Produto Mercado Livre').substring(0, 150),
      price: Number(mlData.price) || (mlData.buy_box_winner?.price) || 0,
      image: (mlData.pictures?.[0]?.url || mlData.thumbnail || mlData.image || '').replace('-I.', '-O.'),
      permalink: mlData.permalink || url,
      categoria,
      score: 100,
      data_adicionado: new Date().toISOString()
    };

    // Salvamento no Realtime Database
    const productRef = ref(rtdb, `produtos/${mlbId}`);
    await set(productRef, novoProduto);

    return NextResponse.json({ success: true, id: mlbId });
  } catch (error: any) {
    console.error('[ERRO] Pipeline:', error.message);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar produto' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const productRef = ref(rtdb, `produtos/${id}`);
    await remove(productRef);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao remover produto: ' + error.message }, { status: 500 });
  }
}
