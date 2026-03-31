import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { categorizeProduct } from '@/lib/gemini';

export const maxDuration = 300; 

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key !== 'admin_fix_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const snapshot = await dbAdmin.ref('produtos').get();

        if (!snapshot.exists()) {
            return NextResponse.json({ success: false, message: 'Nenhum produto encontrado no banco.' });
        }

        const data = snapshot.val();
        const todos = Object.keys(data).map(id => ({ id, ...data[id] }));

        console.log(`[MANUTENÇÃO] Total no banco: ${todos.length} | Recategorizando para 7 grupos...`);

        let atualizados = 0;
        const log: { title: string; antes: string; depois: string }[] = [];

        for (let i = 0; i < todos.length; i++) {
            const prod = todos[i];
            const id = prod.id || prod.mlb_id;
            const title = prod.title || '';
            const catAntes = prod.categoria || '(sem categoria)';

            try {
                // Categoriza usando a nova lógica de 7 grupos
                const novaCat = await categorizeProduct(title);
                const catDepois = novaCat?.toLowerCase().trim();

                const updatedProd = {
                    ...prod,
                    categoria: catDepois,
                    data_adicionado: prod.data_adicionado || new Date().toISOString(),
                    mlb_id: prod.mlb_id || id,
                };

                const { id: _, ...salvar } = updatedProd;
                await dbAdmin.ref(`produtos/${id}`).set(salvar);

                log.push({ title: title.substring(0, 50), antes: catAntes, depois: catDepois });
                atualizados++;

            } catch (e: any) {
                log.push({ title: title.substring(0, 50), antes: catAntes, depois: `[ERRO] ${catAntes}` });
            }

            // Rate limit Gemini
            await new Promise(resolve => setTimeout(resolve, 4000));
        }

        const resumoCats = log.reduce((acc, item) => {
            const cat = item.depois.startsWith('[ERRO]') ? item.antes : item.depois;
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
            success: true,
            message: `Recategorização concluída. ${atualizados}/${todos.length} produtos atualizados no novo padrão.`,
            total_banco: todos.length,
            atualizados,
            distribuicao_categorias: resumoCats,
            detalhes: log,
        });

    } catch (e: any) {
        console.error('[MANUTENÇÃO] Erro crítico:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
