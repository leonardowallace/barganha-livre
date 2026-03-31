import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
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
  
  if (!authHeader) return false;

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : authHeader;

  return token === expectedPassword;
}

export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const snapshot = await dbAdmin.ref('produtos').limitToLast(100).get();
    
    if (!snapshot.exists()) {
      return NextResponse.json([]);
    }

    const data = snapshot.val();
    const produtos: ProdutoSalvo[] = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
    }));

    produtos.sort((a, b) => {
        const dateA = a.data_adicionado ? new Date(a.data_adicionado).getTime() : 0;
        const dateB = b.data_adicionado ? new Date(b.data_adicionado).getTime() : 0;
        return dateB - dateA;
    });

    return NextResponse.json(produtos);
  } catch (error: any) {
    console.error('[API] RTD Read Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    // Extração de ID MLB
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
      return NextResponse.json({ error: 'ID MLB não encontrado na URL.' }, { status: 400 });
    }

    // Busca dados básica
    let mlData: any = null;
    try {
      const resItem = await fetch(`https://api.mercadolibre.com/items/${mlbId}`);
      if (resItem.ok) mlData = await resItem.json();
    } catch (e) {}
    
    if (!mlData) {
      return NextResponse.json({ error: 'Falha ao obter dados do ML.' }, { status: 504 });
    }

    if (categoria === 'automatico') {
      const title = mlData.title || mlData.name || '';
      categoria = await categorizeProduct(title);
    }

    const novoProduto = {
      mlb_id: mlbId,
      title: (mlData.title || mlData.name || 'Produto').substring(0, 150),
      price: Number(mlData.price) || 0,
      image: (mlData.pictures?.[0]?.url || mlData.thumbnail || '').replace('-I.', '-O.'),
      permalink: mlData.permalink || url,
      categoria,
      score: 100,
      data_adicionado: new Date().toISOString()
    };

    await dbAdmin.ref(`produtos/${mlbId}`).set(novoProduto);

    return NextResponse.json({ success: true, id: mlbId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    await dbAdmin.ref(`produtos/${id}`).remove();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
