import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export interface ProdutoAfiliado {
  id: string;
  mlb_id: string;
  title: string;
  price: number;
  image: string;
  affiliate_url: string;
  categoria: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');

    const produtosCol = collection(db, 'produtos');
    
    let q;
    if (categoria && categoria !== 'ofertas') {
      q = query(
        produtosCol, 
        where('categoria', '==', categoria),
        orderBy('data_adicionado', 'desc')
      );
    } else {
      // Para "ofertas" ou sem categoria, mostramos os mais recentes de todos
      q = query(produtosCol, orderBy('data_adicionado', 'desc'));
    }

    const snapshot = await getDocs(q);
    
    const produtos = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      // Gerar link de afiliado (exemplo simplificado conforme regras do projeto)
      // Todo link deve ter tracking. Aqui convertemos o permalink.
      const affiliate_url = data.permalink.includes('?') 
        ? `${data.permalink}&matt_tool=55704581&matt_word=rodriguesleonardo2022060705062`
        : `${data.permalink}?matt_tool=55704581&matt_word=rodriguesleonardo2022060705062`;

      return {
        id: docSnap.id,
        mlb_id: data.mlb_id,
        title: data.title,
        price: data.price,
        image: data.image,
        affiliate_url: affiliate_url,
        categoria: data.categoria
      };
    });

    return NextResponse.json(produtos);
  } catch (error: any) {
    console.error('Public API Firestore Error:', error);
    return NextResponse.json([], { status: 200 }); // Retorna vazio em vez de erro para o front
  }
}
