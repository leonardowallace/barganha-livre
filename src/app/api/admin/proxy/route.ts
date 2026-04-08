import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 });
  }

  try {
    console.log(`[PIPELINE-PROXY] Buscando: ${targetUrl}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[PIPELINE-PROXY] ML retornou erro: ${response.status}`);
      return NextResponse.json({ 
        success: false, 
        error: `Mercado Livre retornou status ${response.status}`,
        details: `HTTP ${response.status}`
      }, { status: 200 }); // Retorna 200 com success: false para evitar erro 500 no fetch
    }

    const html = await response.text();
    console.log(`[PIPELINE-PROXY] Sucesso! HTML carregado (${html.length} bytes)`);
    
    return NextResponse.json({
      success: true,
      html: html,
      url: response.url // Retorna a URL final após redirecionamentos
    });
  } catch (error: any) {
    const errorMsg = error.name === 'AbortError' ? 'Timeout na requisição' : error.message;
    console.error('[PIPELINE-PROXY-ERROR]:', errorMsg);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Falha na conexão com o Mercado Livre', 
      details: errorMsg 
    }, { status: 200 });
  }
}
