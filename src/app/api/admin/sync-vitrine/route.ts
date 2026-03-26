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
    const body = await request.json();
    const { items } = body;
    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Aguardando envio de dados do navegador...' });
    }

    // 3. Persistência no Firestore (Otimizada: ID do Documento = ID do MLB)
    // Isso evita duplicatas automaticamente e é muito mais rápido que buscar a lista toda
    const batch = writeBatch(db);
    let count = 0;

    items.forEach((item: any) => {
      if (!item.id) return;
      
      const docRef = doc(db, 'produtos', item.id);
      batch.set(docRef, {
        mlb_id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        permalink: item.permalink,
        categoria: 'ofertas', // Default para vitrine
        score: 100,
        data_atualizacao: new Date().toISOString()
      }, { merge: true });
      count++;
    });
    
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `${count} produtos sincronizados com sucesso!`,
      count: count
    });

  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
