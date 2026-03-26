import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';

function verifyAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedPassword = process.env.ADMIN_PASSWORD || 'promox2026';
  return authHeader === `Bearer ${expectedPassword}`;
}

export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // 1. Tenta pegar itens do body (Client-Side Sync fallback)
    let body;
    try { body = await request.json(); } catch (e) { body = {}; }
    
    let items = body.items || [];

    // 2. Se não vierem itens, tenta buscar no Servidor (Server-Side Sync principal)
    if (items.length === 0) {
      console.log('[Sync] Iniciando busca no servidor...');
      const url = 'https://www.mercadolivre.com.br/social/rodriguesleonardo2022060705062/lists/765f49c4-4f0c-4da3-9d46-e3ffe7e32ce2?matt_tool=55704581&forceInApp=true';
      
      const response = await fetch(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        redirect: 'follow'
      });

      if (!response.ok) {
        console.error('[Sync] Erro HTTP:', response.status);
        throw new Error(`Mercado Livre retornou status ${response.status}. Tente novamente mais tarde.`);
      }

      const html = await response.text();
      console.log('[Sync] HTML recebido, tamanho:', html.length);
      
      const marker = '_n.ctx.r=';
      const markerIdx = html.indexOf(marker);
      
      if (markerIdx === -1) {
        console.error('[Sync] Marcador _n.ctx.r não encontrado no HTML.');
        throw new Error('A estrutura da página mudou ou o acesso foi bloqueado pelo ML.');
      }

      const startIdx = markerIdx + marker.length;
      
      // Busca balanceada de chaves para pegar o objeto JSON {}
      let depth = 0;
      let endIdx = -1;
      let foundStart = false;

      for (let i = startIdx; i < html.length; i++) {
        if (html[i] === '{') {
          depth++;
          foundStart = true;
        } else if (html[i] === '}') {
          depth--;
          if (foundStart && depth === 0) {
            endIdx = i;
            break;
          }
        }
      }

      if (endIdx === -1) {
        console.error('[Sync] Falha ao delimitar o objeto JSON.');
        throw new Error('Erro ao processar os dados da página.');
      }

      const jsonStr = html.substring(startIdx, endIdx + 1);
      const data = JSON.parse(jsonStr);
      console.log('[Sync] JSON parseado com sucesso.');
      
      const polycards = data.appProps?.pageProps?.polycards || [];
      console.log('[Sync] Total de polycards encontrados:', polycards.length);
      
      items = polycards.map((p: any) => {
        try {
          const titleComp = p.components?.find((c: any) => c.type === 'title');
          const priceComp = p.components?.find((c: any) => c.type === 'price');
          const id = p.pictures?.pictures?.[0]?.id || p.metadata?.id || p.unique_id || Math.random().toString(36).substr(2, 9);
          const permalink = p.metadata?.url || '';
          const params = p.metadata?.url_params || '';
          const fragments = p.metadata?.url_fragments || '';

          return {
            id: id,
            title: titleComp?.title?.text || 'Produto',
            price: priceComp?.price?.current_price?.value || 0,
            image: id ? `https://http2.mlstatic.com/D_NQ_NP_${id}-O.webp` : '',
            permalink: permalink + params + fragments
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
    }

    if (items.length === 0) {
      console.log('[Sync] Nenhum item válido após o mapeamento.');
      return NextResponse.json({ success: false, error: 'Nenhum produto encontrado.' });
    }

    // 3. Persistência no Firestore
    const produtosColRef = collection(db, 'produtos');
    const snapshot = await getDocs(produtosColRef);
    const existingMlbIds = new Set(snapshot.docs.map(doc => doc.data().mlb_id));

    const novosProdutos = items
      .filter((item: any) => !existingMlbIds.has(item.id))
      .map((item: any) => ({
        mlb_id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        permalink: item.permalink,
        categoria: 'Eletrônicos',
        score: 100,
        data_adicionado: new Date().toISOString()
      }));

    if (novosProdutos.length === 0) {
      return NextResponse.json({ success: true, message: 'Vitrine já atualizada.', count: 0 });
    }

    const batch = writeBatch(db);
    novosProdutos.forEach((prod: any) => {
      const newDocRef = doc(produtosColRef);
      batch.set(newDocRef, prod);
    });
    
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `${novosProdutos.length} novos produtos sincronizados!`,
      count: novosProdutos.length
    });

  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
