import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'produtos.json');

const PRODUTOS_VITRINE = [
  { url: 'https://www.mercadolivre.com.br/creatina-monohidratada-250g-growth-supplements-sem-sabor-em-po/p/MLB19603205', categoria: 'saude' },
  { url: 'https://www.mercadolivre.com.br/kit-2-travesseiros-45x65-antialergico-lavavel-fibra-siliconada-toque-de-pluma/p/MLB43954645', categoria: 'casa' },
  { url: 'https://www.mercadolivre.com.br/massageador-pistola-muscular-profissional-6-velocidades-4-ponteiras-alivio-dores-relaxamento-bivolt-recarregavel-yin-yang-produtos-para-acupuntura/p/MLB29743591', categoria: 'saude' },
  { url: 'https://www.mercadolivre.com.br/cmera-inteligente-wi-fi-im5-sc-full-hd-branca-intelbras/p/MLB27705742', categoria: 'eletronicos' },
  { url: 'https://produto.mercadolivre.com.br/MLB-4363291889-capa-protetora-slim-com-s-pen-para-galaxy-samsung-z-fold7-_JM', categoria: 'eletronicos' },
  { url: 'https://www.mercadolivre.com.br/mouse-gamer-sem-fio-logitech-g-pro-2-lightspeed-preto/p/MLB43071650', categoria: 'eletronicos' },
  { url: 'https://www.mercadolivre.com.br/regua-extenso-eletrica-6-tomadas-filtro-linha-10a-cabo-2-metros/p/MLB48482467', categoria: 'eletronicos' },
  { url: 'https://produto.mercadolivre.com.br/MLB-5878840092-ventilador-torre-silencioso-fix-86cm-preto-3-velocidades-oscilante-16-cm-60-127v-_JM', categoria: 'casa' },
  { url: 'https://www.mercadolivre.com.br/colnia-turma-da-mnica-cebolinha-jequiti-25ml/p/MLB36931922', categoria: 'beleza' },
  { url: 'https://www.mercadolivre.com.br/bundle-nintendo-switch-2-mario-kart-world/p/MLB48935147', categoria: 'eletronicos' },
  { url: 'https://www.mercadolivre.com.br/livro-a-tormenta-de-espadas-as-crnicas-de-gelo-e-fogo-3-de-george-r-r-martin-vol-3-capa-mole-em-portugus-2019-editora-suma-de-letras/p/MLB19220798', categoria: 'estudos' },
  { url: 'https://www.mercadolivre.com.br/livro-o-festim-dos-corvos-de-rr-martin-george-vol-4-editora-schwarcz-sa-capa-mole-2019/p/MLB19220806', categoria: 'estudos' },
  { url: 'https://www.mercadolivre.com.br/a-danca-dos-dragoes-de-rr-martin-george-as-crnicas-de-gelo-e-fogo-vol-5-editora-suma-capa-mole-em-portugus-2020/p/MLB19220811', categoria: 'estudos' },
];

async function scrapeProduct(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      }
    });
    const html = await res.text();
    
    const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i);
    const imageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i);
    const priceMatch1 = html.match(/<meta\s+itemprop="price"\s+content="([^"]+)"/i);
    const priceMatch2 = html.match(/"price":\s*(\d+(?:\.\d+)?)/i);

    let title = '';
    let image = '';
    let price = 0;

    if (titleMatch) title = titleMatch[1].replace(/\s*\|\s*Mercado\s*Livre\s*/i, '').trim();
    if (imageMatch) image = imageMatch[1].replace('-W.', '-O.');
    
    if (priceMatch1) {
      price = parseFloat(priceMatch1[1]);
    } else if (priceMatch2) {
      price = parseFloat(priceMatch2[1]);
    }

    return { title, image, price };
  } catch (e) {
    console.error(`Erro ao scarpar ${url}:`, e);
    return null;
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedPassword = process.env.ADMIN_PASSWORD || 'promox2026';

  if (!authHeader || authHeader !== `Bearer ${expectedPassword}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, '[]', 'utf8');
    }

    const fileData = fs.readFileSync(DB_PATH, 'utf8');
    const produtosExistentes = JSON.parse(fileData);

    const body = await request.json().catch(() => ({}));
    // URL preservada para referência futura, embora os itens estejam no array acima
    const profileUrl = body.profileUrl || 'https://www.mercadolivre.com.br/social/rodriguesleonardo2022060705062';
    
    const novosProdutos = [];
    const erros = [];

    for (const item of PRODUTOS_VITRINE) {
      const mlbId = item.url.match(/MLB[-]?\d+/i)?.[0].replace('-', '').toUpperCase();
      
      // Evitar duplicidade
      if (produtosExistentes.some((p: any) => p.mlb_id === mlbId)) {
        continue;
      }

      const scraped = await scrapeProduct(item.url);
      
      if (scraped && scraped.title && scraped.image) {
        const novoProduto = {
          id: Math.random().toString(36).substr(2, 9),
          mlb_id: mlbId || `GEN-${Math.random().toString(36).substr(2, 5)}`,
          title: scraped.title,
          price: scraped.price,
          image: scraped.image,
          permalink: item.url,
          categoria: item.categoria,
          score: 100,
          data_adicionado: new Date().toISOString()
        };
        novosProdutos.push(novoProduto);
        produtosExistentes.push(novoProduto);
      } else {
        erros.push(item.url);
      }
      
      await new Promise(r => setTimeout(r, 500));
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(produtosExistentes, null, 2), 'utf8');

    return NextResponse.json({ 
      success: true, 
      adicionados: novosProdutos.length, 
      erros: erros.length > 0 ? erros : undefined 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno ao sincronizar' }, { status: 500 });
  }
}
