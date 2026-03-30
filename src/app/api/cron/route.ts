import { NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';

export async function GET(request: Request) {
  // Rota projetada para ser chamada por um Cron Job
  
  // OPCIONAL: Adicione uma verificação de chave secreta para segurança
  const urlParams = new URL(request.url).searchParams;
  const secret = urlParams.get('secret');
  
  // if (secret !== process.env.CRON_SECRET) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const produtosRef = ref(rtdb, 'produtos');
    const snapshot = await get(produtosRef);
    
    if (!snapshot.exists()) {
      return NextResponse.json({ message: 'Nenhum produto na base de dados.' });
    }

    const data = snapshot.val();
    let updatedCount = 0;
    const produtos = Object.keys(data).map(key => ({ id: key, ...data[key] }));

    for (const prod of produtos) {
      let novoPreco = prod.price;

      try {
        console.log(`[Cron] Verificando preço de: ${prod.title}`);
        
        const pageRes = await fetch(prod.permalink, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9'
          },
          cache: 'no-store'
        });
        
        const html = await pageRes.text();
        
        const priceMatch1 = html.match(/<meta\s+itemprop="price"\s+content="([^"]+)"/i);
        const priceMatch2 = html.match(/"price":\s*(\d+(?:\.\d+)?)/i); 
        
        if (priceMatch1) {
            novoPreco = parseFloat(priceMatch1[1]);
        } else if (priceMatch2) {
            novoPreco = parseFloat(priceMatch2[1]);
        }

        if (novoPreco > 0 && novoPreco !== prod.price) {
           const productRef = ref(rtdb, `produtos/${prod.id}`);
           await update(productRef, { price: novoPreco });
           updatedCount++;
        }

        // Delay para mitigar bots / bloqueios
        await new Promise(r => setTimeout(r, 1000));

      } catch (e) {
        console.error(`[Cron] Erro ao atualizar ${prod.id}:`, e);
      }
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Rotina de atualização finalizada.', 
        total_verificados: produtos.length,
        total_atualizados: updatedCount
    });

  } catch (error: any) {
    console.error('[Cron] Falha crítica:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no Cron' }, { status: 500 });
  }
}
