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
    let { url, categoria, title: providedTitle, price: providedPrice, image: providedImage } = body;

    if (!url || !categoria) {
      return NextResponse.json({ error: 'URL e categoria são obrigatórios' }, { status: 400 });
    }

    url = url.split('#')[0];

    let title = providedTitle || '';
    let price = providedPrice || 0;
    let image = providedImage || '';
    
    // Web Scraping fallback se não vier do cliente
    if (!title || !image) {
      try {
        const pageRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept-Language': 'pt-BR,pt;q=0.9'
          }
        });
        const html = await pageRes.text();
        const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i);
        const imageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i);
        const priceMatch1 = html.match(/<meta\s+itemprop="price"\s+content="([^"]+)"/i);
        const priceMatch2 = html.match(/"price":\s*(\d+(?:\.\d+)?)/i); 
        
        if (titleMatch) title = titleMatch[1].replace(/\s*\|\s*Mercado\s*Livre\s*/i, '').trim();
        if (imageMatch) image = imageMatch[1];
        if (priceMatch1) price = parseFloat(priceMatch1[1]);
        else if (priceMatch2) price = parseFloat(priceMatch2[1]);
      } catch (e) {
        console.error('Scraping error:', e);
      }
    }

    if (!title || !image) {
      return NextResponse.json({ error: 'Não foi possível extrair os dados. O servidor do Mercado Livre bloqueou o acesso. Tente novamente em instantes.' }, { status: 400 });
    }

    const mlbId = url.match(/MLB[-]?\d+/i)?.[0].replace('-','').toUpperCase() || Math.random().toString(36).substr(2, 9);

    const produtosCol = collection(db, 'produtos');
    const q = query(produtosCol, where('mlb_id', '==', mlbId), where('categoria', '==', categoria));
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      return NextResponse.json({ error: 'Este produto já foi adicionado nesta categoria.' }, { status: 400 });
    }

    const novoProduto = {
      mlb_id: mlbId,
      title,
      price,
      image: image.replace('-W.', '-O.'),
      permalink: url,
      categoria,
      score: 100,
      data_adicionado: new Date().toISOString()
    };

    const docRef = await addDoc(produtosCol, novoProduto);

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
