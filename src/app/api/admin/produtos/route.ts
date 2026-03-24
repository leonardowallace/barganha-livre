import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'produtos.json');

export interface ProdutoSalvo {
  id: string;
  mlb_id: string;
  title: string;
  price: number;
  image: string;
  permalink: string;
  categoria: string;
  score: number;
  data_adicionado: string;
}

function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, '[]', 'utf8');
  }
}

function verifyAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedPassword = process.env.ADMIN_PASSWORD || 'promox2026';
  
  if (!authHeader || authHeader !== `Bearer ${expectedPassword}`) {
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    initDB();
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao ler produtos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    initDB();
    const body = await request.json();
    let { url, categoria } = body;

    if (!url || !categoria) {
      return NextResponse.json({ error: 'URL e categoria são obrigatórios' }, { status: 400 });
    }

    url = url.split('#')[0]; // Limpar a URL removendo as tags pós-hash de campanhas

    let title = '';
    let price = 0;
    let image = '';
    
    // Web Scraping Fallback para URL Universal (Funciona para /p/ Catálogo e Itens Normais)
    try {
      const pageRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept-Language': 'pt-BR,pt;q=0.9'
        }
      });
      
      const html = await pageRes.text();
      
      const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i);
      const imageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i);
      const priceMatch1 = html.match(/<meta\s+itemprop="price"\s+content="([^"]+)"/i);
      const priceMatch2 = html.match(/"price":\s*(\d+(?:\.\d+)?)/i); 
      
      if (titleMatch) {
          title = titleMatch[1].replace(/\s*\|\s*Mercado\s*Livre\s*/i, '').trim();
      }
      
      if (imageMatch) image = imageMatch[1];
      
      if (priceMatch1) {
          price = parseFloat(priceMatch1[1]);
      } else if (priceMatch2) {
          price = parseFloat(priceMatch2[1]);
      }

    } catch (e) {
      console.error('Scraping error:', e);
    }

    if (!title || !image) {
      return NextResponse.json({ error: 'Não foi possível extrair a Imagem ou Título da URL. Verifique se o link está correto.' }, { status: 400 });
    }

    const { id: generatedId } = { id: Math.random().toString(36).substr(2, 9) };
    const mlbId = url.match(/MLB[-]?\d+/i)?.[0].replace('-','').toUpperCase() || generatedId;

    const novoProduto: ProdutoSalvo = {
      id: generatedId,
      mlb_id: mlbId,
      title,
      price,
      // Usar versão de melhor resolução se possível (Trocar W por O caso o ML traga em WEBP estático na tag OG)
      image: image.replace('-W.', '-O.'),
      permalink: url,
      categoria,
      score: 100,
      data_adicionado: new Date().toISOString()
    };

    const fileData = fs.readFileSync(DB_PATH, 'utf8');
    const produtos: ProdutoSalvo[] = JSON.parse(fileData);
    
    if (produtos.some(p => p.mlb_id === mlbId && p.categoria === categoria && p.mlb_id !== generatedId)) {
        return NextResponse.json({ error: 'Este produto já foi adicionado nesta categoria.' }, { status: 400 });
    }

    produtos.push(novoProduto);
    fs.writeFileSync(DB_PATH, JSON.stringify(produtos, null, 2), 'utf8');

    return NextResponse.json({ success: true, produto: novoProduto });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
  
      if (!id) {
        return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
      }
  
      const fileData = fs.readFileSync(DB_PATH, 'utf8');
      let produtos: ProdutoSalvo[] = JSON.parse(fileData);
      
      produtos = produtos.filter(p => p.id !== id);
      fs.writeFileSync(DB_PATH, JSON.stringify(produtos, null, 2), 'utf8');
  
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao remover produto' }, { status: 500 });
    }
}
