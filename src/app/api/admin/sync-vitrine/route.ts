import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { categorizeProduct } from '@/lib/gemini';

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

    console.log(`[Sync] Processando ${items.length} itens com categorização IA.`);

    const results: { id: string; categoria: string }[] = [];

    for (const item of items) {
      if (!item || !item.id) continue;

      const safeId = String(item.id)
        .split('/')
        .pop()
        ?.replace(/[^a-zA-Z0-9_-]/g, '') || Math.random().toString(36).substr(2, 9);

      const title = item.title || 'Produto sem título';

      // Categorização automática via IA — fallback para 'tecnologia' em caso de erro
      let categoria = 'tecnologia';
      try {
        categoria = await categorizeProduct(title);
        console.log(`[Sync] "${title.substring(0, 40)}" → categoria: ${categoria}`);
      } catch (e) {
        console.warn(`[Sync] Falha na IA para "${title.substring(0, 40)}". Usando fallback 'tecnologia'.`);
      }

      await dbAdmin.ref(`produtos/${safeId}`).set({
        mlb_id: safeId,
        title,
        price: Number(item.price) || 0,
        image: item.image || '',
        permalink: item.permalink || '',
        affiliate_url: item.affiliate_url || '',
        categoria,
        score: 100,
        data_adicionado: new Date().toISOString(),
      });

      results.push({ id: safeId, categoria });
    }

    // Rate limit do Gemini free tier: 15 req/min → mínimo 4s entre chamadas (só se for massa)
    if (items.length > 1) {
      await new Promise(r => setTimeout(r, 4500));
    }

    console.log(`[Sync] ${results.length} de ${items.length} produtos sincronizados.`);

    return NextResponse.json({
      success: true,
      message: `${results.length} produtos sincronizados com categorização IA!`,
      count: results.length,
      categorias: results.reduce((acc, r) => {
        acc[r.categoria] = (acc[r.categoria] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    });

  } catch (error: any) {
    console.error('[Sync] Erro fatal:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro inesperado no servidor'
    }, { status: 500 });
  }
}
