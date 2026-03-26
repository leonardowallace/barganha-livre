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
      console.log('[Sync] Buscando dados diretamente no link SEC do ML...');
      const url = 'https://mercadolivre.com/sec/1Nsn5dh';
      
      const response = await fetch(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html'
        },
        redirect: 'follow'
      }).catch(err => {
          throw new Error(`Falha de rede servidor: ${err.message}. Tente sincronizar novamente (o Cliente agora fará o fallback automaticamente).`);
      });

      if (!response.ok) throw new Error(`ML retornou status ${response.status}`);

      const html = await response.text();
      const marker = '"polycards":';
      const markerIdx = html.indexOf(marker);
      
      if (markerIdx === -1) throw new Error('Dados de vitrine não encontrados na página (Marcador ausente).');

      const startBracketIdx = html.indexOf('[', markerIdx);
      let depth = 0;
      let endBracketIdx = -1;
      for (let i = startBracketIdx; i < html.length; i++) {
        if (html[i] === '[') depth++;
        else if (html[i] === ']') {
          depth--;
          if (depth === 0) {
            endBracketIdx = i;
            break;
          }
        }
      }

      if (endBracketIdx !== -1) {
        const rawArray = html.substring(startBracketIdx, endBracketIdx + 1);
        const polycards = JSON.parse(rawArray);
        
        // Mapeia para o formato interno do X Promo
        items = polycards.map((p: any) => {
          const titleComp = p.components?.find((c: any) => c.type === 'title');
          const priceComp = p.components?.find((c: any) => c.type === 'price');
          
          return {
            id: p.metadata?.id || p.unique_id,
            title: titleComp?.title?.text || 'Produto sem título',
            price: priceComp?.price?.current_price?.value || 0,
            image: (p.pictures?.[0] || '').replace('-I.', '-O.').replace('-W.', '-O.'),
            permalink: p.metadata?.url || 'https://www.mercadolivre.com.br'
          };
        });
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ message: 'Nenhum item encontrado para sincronizar.' });
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
