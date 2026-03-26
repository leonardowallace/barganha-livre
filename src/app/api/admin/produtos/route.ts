import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';

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
  
  if (!authHeader || authHeader !== `Bearer ${expectedPassword}`) {
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const produtosCol = collection(db, 'produtos');
    const q = query(produtosCol, orderBy('data_adicionado', 'desc'));
    const snapshot = await getDocs(q);
    const produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(produtos);
  } catch (error: any) {
    console.error('Firestore Read Error:', error);
    return NextResponse.json({ error: 'Erro ao ler produtos do Firestore: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('[PIPELINE] 1. Entrada do Link:', body.url);
    console.log('[PIPELINE] 2. Categoria:', body.categoria);

    let { url, categoria, title: providedTitle, price: providedPrice, image: providedImage } = body;

    if (!url || !categoria) {
      console.error('[PIPELINE] FALHA: URL ou Categoria ausentes.');
      return NextResponse.json({ error: 'URL e categoria são obrigatórios' }, { status: 400 });
    }

    // Normalização da URL
    const originalUrl = url;
    url = url.split('#')[0].split('?')[0]; 
    console.log('[PIPELINE] 3. URL Normalizada:', url);

    let title = providedTitle || '';
    let price = providedPrice || 0;
    let image = providedImage || '';
    
    // Extração robusta de ID (MLB ou UUID de Lista)
    let mlbId = url.match(/MLB[-]?(\d+)/i)?.[1];
    if (mlbId) {
      mlbId = `MLB${mlbId}`;
    } else {
      const listMatch = url.match(/lists\/([a-zA-Z0-9-]+)/i) || url.match(/sec\/([a-zA-Z0-9]+)/i);
      mlbId = listMatch ? listMatch[1] : `ID_${Math.random().toString(36).substr(2, 9)}`;
    }
    console.log('[PIPELINE] 4. ID Extraído:', mlbId);

    // Web Scraping fallback se não vier do cliente
    if (!title || !image) {
      console.log('[PIPELINE] 5. Tentando extração via servidor...');
      try {
        const pageRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        });
        console.log('[PIPELINE] 6. Status Scraper:', pageRes.status);
        const html = await pageRes.text();
        const titleMatch = html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i) || 
                           html.match(/content=["']([^"']+)["']\s+property=["']og:title["']/i);
        const imageMatch = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i) || 
                           html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
        const priceMatch = html.match(/itemprop=["']price["']\s+content=["']([^"']+)["']/i) || 
                           html.match(/"price":\s*(\d+(?:\.\d+)?)/i); 
        
        if (titleMatch) title = titleMatch[1].replace(/\s*\|\s*Mercado\s*Livre\s*/i, '').trim();
        if (imageMatch) image = imageMatch[1];
        if (priceMatch) price = parseFloat(priceMatch[1]);
        
        console.log('[PIPELINE] 7. Dados Extraídos:', { title, price, hasImage: !!image });
      } catch (e: any) {
        console.error('[PIPELINE] ERRO Scraper:', e.message);
      }
    }

    // Etapa 6 — FALLBACK (Cria mesmo se falhar extração, mas com dados mínimos)
    if (!title) title = "Produto Importado";
    if (!image) image = "https://placehold.co/400x400?text=ML";

    // Verificação de duplicata (opcional, pode ser relaxado se ID mudar)
    const produtosCol = collection(db, 'produtos');
    const q = query(produtosCol, where('mlb_id', '==', mlbId), where('categoria', '==', categoria));
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      console.log('[PIPELINE] Produto já existente:', mlbId);
      // Opcional: Atualizar em vez de retornar erro? Por enquanto mantemos erro para o usuário saber.
    }

    const novoProduto = {
      mlb_id: mlbId,
      title,
      price,
      image: image.replace('-W.', '-O.'),
      permalink: originalUrl, // Mantém o original para o redirecionamento de afiliado
      categoria,
      score: 100,
      data_adicionado: new Date().toISOString()
    };

    console.log('[PIPELINE] 8. Salvando no Firestore:', mlbId);
    const docRef = await addDoc(produtosCol, novoProduto);
    console.log('[PIPELINE] 9. SUCESSO! Link Afiliado será gerado no GET.');

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
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

    const docRef = doc(db, 'produtos', id);
    await deleteDoc(docRef);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao remover produto: ' + error.message }, { status: 500 });
  }
}
