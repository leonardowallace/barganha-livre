import { NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const produtosRef = ref(rtdb, 'produtos');
    const snapshot = await get(produtosRef);
    
    if (!snapshot.exists()) {
      return NextResponse.json([]);
    }

    const data = snapshot.val();
    const categoriasSet = new Set<string>();
    
    Object.values(data).forEach((prod: any) => {
      if (prod.categoria) categoriasSet.add(prod.categoria);
    });

    const categoriasVivas = Array.from(categoriasSet).sort();
    
    // Mapeamento de nomes amigáveis (reutilizando a lógica do [categoria]/page.tsx)
    const CATEGORY_NAMES: Record<string, string> = {
      ofertas: 'Ofertas',
      eletronicos: 'Eletrônicos',
      casa: 'Casa',
      moda: 'Moda',
      saude: 'Saúde',
      estudos: 'Estudos',
      esportes: 'Esportes',
      beleza: 'Beleza',
      automotivo: 'Automotivo',
    };

    const result = categoriasVivas.map(id => ({
      id,
      name: CATEGORY_NAMES[id] || id.charAt(0).toUpperCase() + id.slice(1),
      path: id === 'ofertas' ? '/' : `/${id}`
    }));

    // Garante que 'ofertas' seja sempre o primeiro se existir
    result.sort((a, b) => (a.id === 'ofertas' ? -1 : b.id === 'ofertas' ? 1 : 0));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
