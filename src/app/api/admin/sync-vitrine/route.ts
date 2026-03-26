import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, writeBatch, doc } from 'firebase/firestore';

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
    const MATT_TOOL = process.env.MATT_TOOL || '55704581';
    const MATT_WORD = process.env.MATT_WORD || 'rodriguesleonardo2022060705062';
    
    // 1. Busca dados da vitrine social
    const response = await fetch(`https://vitrine.mercadolivre.com.br/api/infinit-scroll-vitrine-products?matt_tool=${MATT_TOOL}&matt_word=${MATT_WORD}&offset=0&limit=50`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro API ML: ${response.status}`);
    }

    const data = await response.json();
    const items = data.results || [];

    if (items.length === 0) {
      return NextResponse.json({ message: 'Nenhum produto encontrado na vitrine social.' });
    }

    // 2. Prepara produtos para salvar
    const produtosCol = collection(db, 'produtos');
    const snapshot = await getDocs(produtosCol);
    const existingMlbIds = new Set(snapshot.docs.map(doc => doc.data().mlb_id));

    const novosProdutos = items
      .filter((item: any) => !existingMlbIds.has(item.id))
      .map((item: any) => ({
        mlb_id: item.id,
        title: item.title,
        price: item.price,
        image: item.thumbnail.replace('-I.', '-O.'),
        permalink: item.permalink,
        categoria: 'Eletrônicos', // Default category
        score: item.health || 100,
        data_adicionado: new Date().toISOString()
      }));

    if (novosProdutos.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'A vitrine já está sincronizada. Nenhum produto novo encontrado.',
        count: 0 
      });
    }

    // 3. Salva no Firestore (usando batch para eficiência)
    const batch = writeBatch(db);
    novosProdutos.forEach((prod: any) => {
      const newDocRef = doc(produtosCol);
      batch.set(newDocRef, prod);
    });
    
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `${novosProdutos.length} novos produtos sincronizados com sucesso!`,
      count: novosProdutos.length
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao sincronizar' }, { status: 500 });
  }
}
