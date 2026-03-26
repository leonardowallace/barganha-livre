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
    const MATT_TOOL = process.env.MATT_TOOL || '55704581';
    const MATT_WORD = process.env.MATT_WORD || 'rodriguesleonardo2022060705062';
    
    // 1. Busca dados da vitrine social
    console.log('[Sync] Iniciando busca na API do ML...');
    let url = `https://vitrine.mercadolivre.com.br/api/infinit-scroll-vitrine-products?matt_tool=${MATT_TOOL}&matt_word=${MATT_WORD}&offset=0&limit=50`;
    
    // Tenta fetch com headers mais genéricos para evitar bot blocks
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://vitrine.mercadolivre.com.br/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      next: { revalidate: 0 } // Desabilitar cache do Next.js
    }).catch(err => {
        throw new Error(`Falha de rede (fetch failed) ao acessar ML: ${err.message}. Isso pode ser um bloqueio de IP do Netlify.`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro API ML (Status ${response.status}): ${errorText.substring(0, 50)}...`);
    }

    const data = await response.json();
    const items = data.results || [];

    if (items.length === 0) {
      return NextResponse.json({ message: 'Nenhum produto encontrado na vitrine social.' });
    }

    // 2. Prepara produtos para salvar no Firestore
    // Nota: db inicializará vazio se não houver configs, mas chamará o erro abaixo
    let existingMlbIds = new Set();
    try {
        const produtosCol = collection(db, 'produtos');
        const snapshot = await getDocs(produtosCol);
        existingMlbIds = new Set(snapshot.docs.map(doc => doc.data().mlb_id));
    } catch (dbErr: any) {
        throw new Error(`Conexão Firebase Falhou: ${dbErr.message}. IMPORTANTE: Verifique se as variáveis de ambiente (API_KEY, etc) foram adicionadas ao Netlify.`);
    }

    const novosProdutos = items
      .filter((item: any) => !existingMlbIds.has(item.id))
      .map((item: any) => ({
        mlb_id: item.id,
        title: item.title,
        price: item.price,
        image: item.thumbnail.replace('-I.', '-O.'),
        permalink: item.permalink,
        categoria: 'Eletrônicos',
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

    // 3. Salva no Firestore
    const batch = writeBatch(db);
    const produtosColRef = collection(db, 'produtos');
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
    console.error('Sync error detailing:', error);
    return NextResponse.json({ error: error.message || 'Erro desconhecido na sincronização' }, { status: 500 });
  }
}
