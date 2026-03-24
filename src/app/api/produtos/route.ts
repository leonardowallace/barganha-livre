import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'produtos.json');

export interface ProdutoAfiliado {
  id: string;
  title: string;
  price: number;
  image: string;
  affiliate_url: string;
  score: number;
}

function gerarLinkAfiliado(url: string): string {
  const MATT_TOOL = process.env.MATT_TOOL || '55704581';
  const MATT_WORD = process.env.MATT_WORD || 'rodriguesleonardo2022060705062';

  if (url.includes('matt_tool=')) {
    return url;
  }

  const separador = url.includes('?') ? '&' : '?';
  return `${url}${separador}matt_tool=${MATT_TOOL}&matt_word=${MATT_WORD}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get('categoria');

  if (!categoria) {
    return NextResponse.json({ error: 'Parâmetro categoria é obrigatório' }, { status: 400 });
  }

  try {
    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json([]);
    }

    const data = fs.readFileSync(DB_PATH, 'utf8');
    const todosProdutos = JSON.parse(data);

    let produtosFiltrados = todosProdutos;
    
    if (categoria !== 'ofertas') {
      produtosFiltrados = todosProdutos.filter((p: any) => p.categoria.toLowerCase() === categoria.toLowerCase());
    }

    const produtosResponse: ProdutoAfiliado[] = produtosFiltrados.map((item: any) => ({
      id: item.id || Math.random().toString(),
      title: item.title,
      price: item.price,
      image: item.image,
      affiliate_url: item.permalink ? gerarLinkAfiliado(item.permalink) : '#',
      score: item.score || 0
    }));

    // Ordenar do mais novo ou maior score
    produtosResponse.sort((a, b) => b.score - a.score);

    return NextResponse.json(produtosResponse);

  } catch (error) {
    console.error('Erro ao ler DB:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
