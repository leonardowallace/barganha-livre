import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

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
    const body = await request.json();
    const { items = [] } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Aguardando envio de dados do navegador...' });
    }

    console.log(`[Sync] Processando ${items.length} itens.`);

    const results = await Promise.allSettled(items.map(async (item: any) => {
      if (!item || !item.id) return;
      
      const safeId = String(item.id)
        .split('/')
        .pop()
        ?.replace(/[^a-zA-Z0-9_-]/g, '') || Math.random().toString(36).substr(2, 9);

      const docRef = doc(db, 'produtos', safeId);
      
      await setDoc(docRef, {
        mlb_id: safeId,
        title: item.title || 'Produto sem título',
        price: Number(item.price) || 0,
        image: item.image || '',
        permalink: item.permalink || '',
        categoria: 'ofertas',
        score: 100,
        data_atualizacao: new Date().toISOString()
      }, { merge: true });
      
      return safeId;
    }));

    const count = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[Sync] Sincronizados ${count} de ${items.length} com sucesso.`);

    return NextResponse.json({ 
      success: true, 
      message: `${count} produtos sincronizados!`,
      count: count
    });

  } catch (error: any) {
    console.error('Sync Fatal Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro inesperado no servidor'
    }, { status: 500 });
  }
}
