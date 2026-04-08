'use client';

import { useState, useEffect } from 'react';
import { rtdb, auth } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { CATEGORY_NAMES } from '@/lib/products';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';

const categorias = ['automatico', ...Object.keys(CATEGORY_NAMES)];

export default function AdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [url, setUrl] = useState('');
  const [categoria, setCategoria] = useState('automatico');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [produtos, setProdutos] = useState<any[]>([]);
  const [vitrineUrl, setVitrineUrl] = useState('');

  const [loadingSync, setLoadingSync] = useState(false);
  const [syncMode, setSyncMode] = useState<'auto' | 'manual' | 'json'>('auto');
  const [manualHtml, setManualHtml] = useState('');
  const [jsonInput, setJsonInput] = useState('');

  const fetchProdutos = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/admin/produtos?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProdutos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  // Redirecionamento se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  // Polling automático a cada 10 segundos quando logado
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user) {
      fetchProdutos(); // Busca imediata
      interval = setInterval(() => {
        fetchProdutos();
      }, 10000); // 10 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  const processVitrineHtml = (html: string) => {
    console.log('Iniciando processamento de HTML...', html.length);
    
    // Tenta padrões comuns de injeção de dados do Mercado Livre
    const markers = [
      /_n\.ctx\.r\s*=\s*/,
      /window\.__PRELOADED_STATE__\s*=\s*/,
      /window\.state\s*=\s*/
    ];

    let marker = '';
    let markerIdx = -1;

    for (const m of markers) {
      const match = html.match(m);
      if (match) {
        marker = match[0];
        markerIdx = html.indexOf(marker);
        break;
      }
    }

    if (markerIdx === -1) {
      console.warn('Nenhum marcador de dados padrão encontrado.');
      // Tenta um buscador genérico de JSON grande (emergência)
      const matches = html.match(/{[^{]?"polycards":[ \t]*\[/g);
      if (!matches) throw new Error('Estrutura de dados não encontrada. Verifique se copiou o código correto da vitrine.');
      markerIdx = html.indexOf(matches[0]);
      marker = ''; // O match já inclui o início do objeto
    }

    const startIdx = markerIdx + marker.length;
    let depth = 0;
    let endIdx = -1;
    let foundStart = false;

    for (let i = startIdx; i < html.length; i++) {
        if (html[i] === '{') { depth++; foundStart = true; }
        else if (html[i] === '}') {
          depth--;
          if (foundStart && depth === 0) { endIdx = i; break; }
        }
    }

    if (endIdx === -1) throw new Error('Erro ao delimitar dados. Tente copiar novamente o código-fonte.');

    const jsonStr = html.substring(startIdx, endIdx + 1);
    const data = JSON.parse(jsonStr);
    
    // Tenta encontrar a lista de produtos em diferentes níveis da árvore
    const polycards = 
      data.appProps?.pageProps?.polycards || 
      data.polycards || 
      data.results || 
      data.items ||
      data.pdp_items ||
      data.more_items ||
      data.state?.polycards ||
      (data.components && data.components.find((c: any) => c.type === 'polycards')?.data?.polycards) ||
      [];

    console.log(`[PIPELINE-PARSER] Encontrados ${polycards.length} itens na base de dados.`);

    return polycards.map((p: any) => {
      try {
        const components = p.components || [];
        const titleComp = components.find((c: any) => c.type === 'title');
        const priceComp = components.find((c: any) => c.type === 'price');
        const id = p.pictures?.pictures?.[0]?.id || p.metadata?.id || p.unique_id || p.id || p.mlb_id || p.item_id;
        
        if (!id) return null;

        return {
          id: id,
          mlb_id: id.toString().startsWith('MLB') ? id : `MLB${id}`,
          title: titleComp?.title?.text || p.title || p.name || 'Produto Mercado Livre',
          price: Number(priceComp?.price?.current_price?.value || p.price || 0),
          image: id.toString().startsWith('http') ? id : `https://http2.mlstatic.com/D_NQ_NP_${id}-O.webp`,
          permalink: (p.metadata?.url || p.permalink || p.url || '') + (p.metadata?.url_params || '') + (p.metadata?.url_fragments || ''),
          score: 100
        };
      } catch (e) {
        return null;
      }
    }).filter((p: any) => p && p.id);
  };

  const handleSyncVitrine = async () => {
    setLoadingSync(true);
    setMsg({ text: 'Iniciando processo...', type: 'info' });
    
    try {
      let items = [];

      if (syncMode === 'json') {
        if (!jsonInput) throw new Error('Por favor, cole o JSON gerado pelo script primeiro.');
        try {
          items = JSON.parse(jsonInput);
        } catch (e) {
          throw new Error('Conteúdo inválido. Certifique-se de copiar exatamente o que o script gerou.');
        }
      } else if (syncMode === 'manual') {
        if (!manualHtml) throw new Error('Cole o código-fonte da página primeiro.');
        items = processVitrineHtml(manualHtml);
      } else {
        const urlToSync = vitrineUrl || 'https://www.mercadolivre.com.br/social/rodriguesleonardo2022060705062/lists/765f49c4-4f0c-4da3-9d46-e3ffe7e32ce2?matt_tool=55704581&forceInApp=true';
        let allItems: any[] = [];
        let resolvedUrl = urlToSync;
        
        // Aumentado para 50 páginas para remover limite prático (conforme pedido pelo usuário)
        for (let page = 1; page <= 50; page++) {
          setMsg({ text: `Buscando produtos da página ${page}...`, type: 'info' });
          
          let urlVitrine = resolvedUrl;
          const separator = urlVitrine.includes('?') ? '&' : '?';
          
          // O Mercado Livre usa ?page=N para vitrines sociais paginadas
          urlVitrine = `${urlVitrine}${separator}page=${page}`;
          
          let html = '';
          try {
            console.log(`[PIPELINE-FRONT] Sync Página ${page} via Proxy Interno...`);
            const res = await fetch(`/api/admin/proxy?url=${encodeURIComponent(urlVitrine)}`);
            const data = await res.json();

            if (data.success) {
              html = data.html;
              // Na primeira página, atualizamos a resolvedUrl com a URL final do proxy (resolve redirecionamentos de meli.la)
              if (page === 1 && data.url) {
                // Remove qualquer parâmetro 'page' ou 'offset' pré-existente para não conflitar
                resolvedUrl = data.url.replace(/([?&])(page|offset)=\d+&?/g, '$1').replace(/[?&]$/, '');
                console.log(`[PIPELINE-FRONT] URL resolvida e limpa: ${resolvedUrl}`);
              }
            } else {
              console.warn(`[PIPELINE-FRONT] Proxy falhou na página ${page}:`, data.error);
              // Se falhou na página 1, é erro crítico. Se falhou na 4, talvez apenas não tenha mais páginas.
              if (page === 1) throw new Error(data.error || 'Falha ao acessar vitrine');
              break; 
            }
          } catch (e: any) {
            console.error(`[PIPELINE-FRONT] Erro na requisição da página ${page}:`, e.message);
            if (page === 1) throw e;
            break;
          }

          if (html) {
            try {
              const pageItems = processVitrineHtml(html);
              if (pageItems.length === 0) break;
              const newItems = pageItems.filter((pi: any) => !allItems.some((ai: any) => ai.id === pi.id));
              if (newItems.length === 0 && page > 1) break;
              allItems = [...allItems, ...newItems];
              await new Promise(r => setTimeout(r, 600));
            } catch (e) { 
              console.warn(`[PIPELINE-FRONT] Erro ao processar HTML da página ${page}:`, e);
              if (allItems.length > 0) break; else throw e; 
            }
          } else break;
        }
        items = allItems;
      }

      if (items.length === 0) throw new Error('Nenhum produto identificado. Verifique os dados e tente novamente.');

      // SALVAMENTO SEQÜENCIAL (Um por Um)
      console.log(`Iniciando salvamento seqüencial de ${items.length} itens...`);
      let savedCount = 0;
      
      for (const item of items) {
        try {
          // Extração robusta do ID MLB real (10 dígitos se possível)
          const mlbMatches = (item.permalink || item.id || '').match(/MLB[-]?(\d+)/i);
          const rawId = mlbMatches ? mlbMatches[1] : '';
          const mlbId = rawId ? `MLB${rawId}` : (item.id || item.mlb_id);
          
          setMsg({ text: `Processando [${savedCount + 1}/${items.length}]: ${item.title.substring(0, 30)}...`, type: 'info' });
          
          if (categoria === 'automatico') {
            // Se for automático, envia para o backend para usar a IA Gemini
            const idToken = await user!.getIdToken();
            const syncRes = await fetch('/api/admin/sync-vitrine', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer promox2026` // Ou usar o token se preferir, mas como é admin interno...
              },
              body: JSON.stringify({ items: [item] }) // Envia 1 por 1 para evitar timeout
            });
            
            if (!syncRes.ok) {
              console.warn(`[Sync] Falha ao processar item ${mlbId} via IA. Tentando salvamento direto.`);
              // Fallback para salvamento direto se a IA falhar
              await set(ref(rtdb, `produtos/${mlbId}`), {
                ...item,
                mlb_id: mlbId,
                categoria: 'tecnologia', // fallback
                data_adicionado: new Date().toISOString()
              });
            }
          } else {
            // Se a categoria foi selecionada manualmente, salva direto no Firebase (rápido)
            const productRef = ref(rtdb, `produtos/${mlbId}`);
            await set(productRef, {
                mlb_id: mlbId,
                title: (item.title || 'Produto Mercado Livre').substring(0, 150),
                price: Number(item.price) || 0,
                image: (item.image || '').replace('-I.', '-O.'), // Força alta qualidade
                permalink: item.permalink || '',
                categoria: categoria,
                score: 100,
                data_adicionado: new Date().toISOString()
            });
          }
          
          savedCount++;
          // Se for via IA, o backend já tem o delay. Se for manual, damos um respiro.
          if (categoria !== 'automatico') {
            await new Promise(r => setTimeout(r, 100));
          }
        } catch (e) { 
          console.error('Erro ao salvar item individual:', e); 
        }
      }
      
      if (savedCount > 0) {
        setMsg({ text: `${savedCount} produtos sincronizados com sucesso!`, type: 'success' });
        setTimeout(() => fetchProdutos(), 1000); // Atualiza a lista
        setManualHtml('');
        setJsonInput('');
        fetchProdutos();
      } else {
        throw new Error('Falha ao salvar os produtos no banco de dados.');
      }
    } catch (error: any) {
      setMsg({ text: 'Falha: ' + (error.message || 'Erro inesperado'), type: 'error' });
    } finally {
      setLoadingSync(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Verificação de duplicata preventiva no frontend
    const mlbMatches = url.match(/MLB[-]?(\d+)/i);
    const mlbId = mlbMatches ? `MLB${mlbMatches[1]}` : null;
    
    if (mlbId && produtos.some(p => p.id === mlbId || p.mlb_id === mlbId)) {
        if (!confirm('Este produto já parece estar na sua lista. Deseja tentar atualizar os dados dele?')) {
            return;
        }
    }
    
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/admin/produtos', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}` 
        },
        body: JSON.stringify({ url, categoria }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao adicionar');
      }

      setMsg({ text: 'Produto adicionado com sucesso!', type: 'success' });
      setUrl('');
      
      // Limpa mensagem de sucesso após 3s
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      
      // Atualiza a lista PROGRAMATICAMENTE após o sucesso
      setTimeout(() => fetchProdutos(), 500);
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name !== 'AbortError') {
        setMsg({ text: error.message || 'Falha ao processar link', type: 'error' });
      } else {
        // No timeout, apenas limpa o estado de loading e URL
        setUrl('');
      }
    } finally {
      setLoading(false);
    }
  };

  const deletarProduto = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja remover "${title}"?`)) return;

    try {
      const idToken = await user!.getIdToken();
      const res = await fetch(`/api/admin/produtos?id=${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${idToken}`}
      });
      if (res.ok) {
        fetchProdutos();
      } else {
        alert('Erro ao deletar produto.');
      }
    } catch (e) {
      alert('Erro inesperado.');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const isEditor = role === 'editor';

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="flex justify-between items-center mb-10 border-l-4 border-blue-600 pl-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Painel X Promo</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest">Colaborador: {role === 'editor' ? 'Edição' : 'Visualização'}</p>
            <span className={`w-2 h-2 rounded-full ${role === 'editor' ? 'bg-green-500' : 'bg-blue-400 animate-pulse'}`}></span>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
        >
          Encerrar Sessão
        </button>
      </header>
      
      {isEditor && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 mb-12">
          <h2 className="text-xl font-bold mb-8 text-gray-800 dark:text-gray-100 flex items-center gap-2">
             <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
             Adicionar Novo Produto via Link
          </h2>
          
          {msg.text && (
            <div className={`p-4 mb-8 rounded-2xl text-sm font-semibold animate-fade-in border ${
              msg.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/30' : 
              msg.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800/30' :
              'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800/30'
            }`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Link do Mercado Livre</label>
                <input 
                  type="url" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Ex: https://produto.mercadolivre.com.br/MLB-..." 
                  className="w-full px-4 py-3.5 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 dark:bg-slate-800/50 dark:text-white transition-all outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Categoria na Vitrine</label>
                <select 
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                >
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'automatico' ? 'Automático (IA Gemini)' : (CATEGORY_NAMES[cat] || cat)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 px-6 rounded-2xl text-white font-black transition-all shadow-lg ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-[0.98]'
              } mt-2 flex items-center justify-center gap-3`}
            >
              {loading ? (
                 <><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processando Link...</>
              ) : 'Adicionar Produto à Vitrine'}
            </button>
          </form>
        </div>
      )}

      {/* Seção de Sincronia Automática (Opcional por enquanto) */}
      {isEditor && (
        <details className="mb-12 group">
          <summary className="cursor-pointer list-none flex items-center gap-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 text-sm font-medium transition-colors ml-4">
            <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            Opções Avançadas de Sincronização
          </summary>
          <div className="mt-6 bg-gray-50/50 dark:bg-slate-800/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex-grow">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  Sincronização em Massa
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Carregue todos os produtos de uma Vitrine Social do Mercado Livre automaticamente.</p>
                
                <div className="mt-6 flex flex-wrap gap-3 mb-6">
                  {(['auto', 'manual', 'json'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSyncMode(mode)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        syncMode === mode 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20' 
                          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 hover:border-blue-400'
                      }`}
                    >
                      {mode === 'auto' ? 'Automático (Link)' : mode === 'manual' ? 'Código-Fonte (HTML)' : 'JSON'}
                    </button>
                  ))}
                </div>

                {syncMode === 'auto' && (
                  <div className="mt-4 animate-fade-in">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Link da Vitrine (Opcional - usa padrão se vazio)</label>
                    <input 
                      type="url" 
                      value={vitrineUrl}
                      onChange={(e) => setVitrineUrl(e.target.value)}
                      placeholder="https://www.mercadolivre.com.br/social/..."
                      className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    />
                  </div>
                )}

                {syncMode === 'manual' && (
                  <div className="mt-4 animate-fade-in">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Código-Fonte HTML da Página</label>
                    <textarea 
                      value={manualHtml}
                      onChange={(e) => setManualHtml(e.target.value)}
                      placeholder="Acesse a vitrine, clique com o botão direito, 'Exibir código fonte', copie tudo e cole aqui..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                    />
                  </div>
                )}

                {syncMode === 'json' && (
                  <div className="mt-4 animate-fade-in">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">JSON de Produtos</label>
                    <textarea 
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='[{"mlb_id": "MLB...", "title": "...", "price": 100, ...}]'
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={handleSyncVitrine}
              disabled={loadingSync}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black transition-all shadow-lg ${
                loadingSync 
                  ? 'bg-blue-400 cursor-not-allowed text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-[0.98] text-white'
              }`}
            >
              {loadingSync ? (
                <><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sincronizando Produtos...</>
              ) : (
                <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Iniciar Sincronização em Massa</>
              )}
            </button>
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                  <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Como usar os modos de importação:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-800/20">
                      <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-tighter mb-1">Automático</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Insira o link da vitrine e o sistema buscará TODAS as páginas disponíveis de produtos via proxy (sem limite).</p>
                    </div>
                    <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100/50 dark:border-amber-800/20">
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tighter mb-1">Manual (Mais Seguro)</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Abra a vitrine no seu navegador, clique com o botão direito e em "Exibir Código Fonte". Copie TUDO (Ctrl+A, Ctrl+C) e cole aqui. Isso ignora bloqueios de proxy.</p>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          )}

      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-8 gap-4 px-1">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Seus Produtos ({produtos.length})</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie sua listagem atual no site.</p>
        </div>
        
        <button
           onClick={() => fetchProdutos()}
           className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95"
           title="Atualizar Lista"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        {produtos.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-3xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Nenhum produto cadastrado ainda.</p>
            <p className="text-sm text-gray-400 mt-1">Cadastre acima ou sincronize com seu perfil ML.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {produtos.map(p => (
              <div key={p.id} className="p-5 sm:p-8 flex items-center hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all group">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-white p-2 rounded-3xl border border-gray-100 group-hover:shadow-md transition-all">
                  <img src={p.image} alt={p.title} className="w-full h-full object-contain" />
                </div>
                
                <div className="ml-6 flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{p.categoria}</span>
                    <span className="text-[10px] text-gray-400 font-medium">Adicionado em: {new Date(p.data_adicionado).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight pr-4">{p.title}</h3>
                  <div className="text-2xl font-black text-green-600 dark:text-green-500 mt-2">R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                
                {isEditor && (
                  <button 
                    onClick={() => deletarProduto(p.id, p.title)}
                    className="w-12 h-12 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all active:scale-75"
                    title="Remover"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
