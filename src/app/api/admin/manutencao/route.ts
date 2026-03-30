import { NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';
import { categorizeProduct } from '@/lib/gemini';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const force = searchParams.get('force') === 'true';

    if (key !== 'admin_fix_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let produtosParaProcessar: any[] = [];
        
        // 1. Tenta carregar do RTD primeiro
        const rtdbRef = ref(rtdb, 'produtos');
        const snapshot = await get(rtdbRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            produtosParaProcessar = Object.keys(data).map(id => ({ id, ...data[id] }));
        }

        // 2. Se o RTD estiver vazio, tenta carregar do JSON local (Seed)
        if (produtosParaProcessar.length === 0) {
            console.log('[MANUTENÇÃO] RTD Vazio. Tentando carregar de data/produtos.json...');
            const jsonPath = path.join(process.cwd(), 'data', 'produtos.json');
            if (fs.existsSync(jsonPath)) {
                const fileContent = fs.readFileSync(jsonPath, 'utf-8');
                produtosParaProcessar = JSON.parse(fileContent);
                console.log(`[MANUTENÇÃO] ${produtosParaProcessar.length} produtos carregados do JSON.`);
            }
        }

        let count = 0;
        let processed = 0;

        for (const prod of produtosParaProcessar) {
            processed++;
            const id = prod.id || prod.mlb_id;
            const title = prod.title || '';
            const description = prod.description || '';
            const currentCat = prod.categoria || 'ofertas';

            if (currentCat === 'ofertas' || force || !prod.id) {
                console.log(`[MANUTENÇÃO] Analisando (${processed}/${produtosParaProcessar.length}): ${title.substring(0, 30)}`);
                
                let newCat = await categorizeProduct(title, description);
                console.log(`[MANUTENÇÃO] Analisando: ${title.substring(0, 30)}... | Gemini sugeriu: ${newCat}`);
                
                // Garantir que a categoria salva seja sempre o ID minúsculo da nossa lista oficial
                if (newCat) {
                    newCat = newCat.toLowerCase().trim();
                }

                const updatedProd = {
                    ...prod,
                    categoria: newCat || currentCat,
                    data_adicionado: prod.data_adicionado || new Date().toISOString(),
                    mlb_id: prod.mlb_id || id // Garantir que mlb_id exista
                };

                // Remove o campo id do corpo do objeto antes de salvar se estiver usando a chave como path
                const { id: _, ...salvar } = updatedProd;
                await set(ref(rtdb, `produtos/${id}`), salvar);
                
                count++;
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        return NextResponse.json({ 
            success: true, 
            processed, 
            fixed: count,
            message: `Manutenção RTD concluída. ${count} produtos processados/injetados.`
        });
    } catch (e: any) {
        console.error('[MANUTENÇÃO] Erro:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
