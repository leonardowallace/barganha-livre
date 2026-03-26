import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';

function verifyAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedPassword = process.env.ADMIN_PASSWORD || 'promox2026';
  
  if (!authHeader || authHeader !== `Bearer ${expectedPassword}`) {
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items } = body; // Recebe itens já buscados pelo client-side

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Nenhum item enviado para sincronização.' }, { status: 400 });
    }

    console.log('[Sync Server] Processando envio de produtos do cliente...');
    
    // 1. Verifica duplicatas no Firestore
    const produtosColRef = collection(db, 'produtos');
    const snapshot = await getDocs(produtosColRef);
    const existingMlbIds = new Set(snapshot.docs.map(doc => doc.data().mlb_id));

    const novosProdutos = items
      .filter((item: any) => !existingMlbIds.has(item.id || item.mlb_id))
      .map((item: any) => ({
        mlb_id: item.id || item.mlb_id,
        title: item.title,
        price: item.price,
        image: (item.thumbnail || item.image || '').replace('-I.', '-O.').replace('-W.', '-O.'),
        permalink: item.permalink,
        categoria: 'Eletrônicos',
        score: item.health || 100,
        data_adicionado: new Date().toISOString()
      }));

    if (novosProdutos.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Todos os produtos enviados já existem na base.',
        count: 0 
      });
    }

    // 2. Salva em lote (batch)
    const batch = writeBatch(db);
    novosProdutos.forEach((prod: any) => {
      const newDocRef = doc(produtosColRef);
      batch.set(newDocRef, prod);
    });
    
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `${novosProdutos.length} novos produtos sincronizados com sucesso!`,
      count: novosProdutos.length
    });

  } catch (error: any) {
    console.error('Sync Server Error:', error);
    return NextResponse.json({ error: 'Falha ao salvar no banco: ' + (error.message || 'Erro desconhecido') }, { status: 500 });
  }
}
