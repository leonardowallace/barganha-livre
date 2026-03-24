import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ProdutoSalvo } from '../admin/produtos/route';

const DB_PATH = path.join(process.cwd(), 'data', 'produtos.json');

export async function GET(request: Request) {
  // Rota projetada para ser chamada por um Cron Job (ex: GitHub Actions, cron-job.org, Vercel Cron)
  
  // OPCIONAL: Adicione uma verificação de chave secreta para segurança
  const urlParams = new URL(request.url).searchParams;
  const secret = urlParams.get('secret');
  
  // if (secret !== process.env.CRON_SECRET) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json({ message: 'Nenhum produto cadastrado para atualizar.' });
    }

    const fileData = fs.readFileSync(DB_PATH, 'utf8');
    const produtos: ProdutoSalvo[] = JSON.parse(fileData);
    
    if (produtos.length === 0) {
      return NextResponse.json({ message: 'Nenhum produto na base de dados.' });
    }

    let updatedCount = 0;

    // Fazer a varredura um a um com pequeno delay para não alarmar os bloqueios do Mercado Livre
    for (let i = 0; i < produtos.length; i++) {
      const prod = produtos[i];
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
           produtos[i].price = novoPreco;
           updatedCount++;
        }

        // Delay de 1 a 2 segundos entre requests para mitigar bans
        await new Promise(r => setTimeout(r, 1500));

      } catch (e) {
        console.error(`[Cron] Erro ao atualizar ${prod.id}:`, e);
      }
    }

    if (updatedCount > 0) {
        fs.writeFileSync(DB_PATH, JSON.stringify(produtos, null, 2), 'utf8');
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
