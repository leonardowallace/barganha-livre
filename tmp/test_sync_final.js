const url = 'https://www.mercadolivre.com.br/social/rodriguesleonardo2022060705062/lists/765f49c4-4f0c-4da3-9d46-e3ffe7e32ce2?matt_tool=55704581&forceInApp=true';

async function testSync() {
  console.log('--- Iniciando Teste de Sync Local ---');
  try {
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      }
    });

    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const html = await response.text();
    console.log('HTML capturado. Tamanho:', html.length);

    const marker = '_n.ctx.r=';
    const markerIdx = html.indexOf(marker);
    if (markerIdx === -1) throw new Error('Marcador não encontrado.');

    const startIdx = markerIdx + marker.length;
    let depth = 0;
    let endIdx = -1;
    let foundStart = false;

    for (let i = startIdx; i < html.length; i++) {
      if (html[i] === '{') {
        depth++;
        foundStart = true;
      } else if (html[i] === '}') {
        depth--;
        if (foundStart && depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx === -1) throw new Error('Fim do JSON não encontrado.');

    const jsonStr = html.substring(startIdx, endIdx + 1);
    const data = JSON.parse(jsonStr);
    const polycards = data.appProps?.pageProps?.polycards || [];

    console.log('Sucesso! Produtos encontrados:', polycards.length);
    if (polycards.length > 0) {
      console.log('Exemplo do primeiro produto:', {
        title: polycards[0].components?.find(c => c.type === 'title')?.title?.text,
        price: polycards[0].components?.find(c => c.type === 'price')?.price?.current_price?.value
      });
    }

  } catch (error) {
    console.error('Erro no teste:', error.message);
  }
}

testSync();
