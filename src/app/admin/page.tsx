'use client';

import { useState, useEffect } from 'react';
import { rtdb } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

const categorias = ['automatico', 'ofertas', 'eletronicos', 'casa', 'moda', 'saude', 'estudos', 'esportes', 'beleza', 'automotivo'];

export default function AdminPage() {
  const [url, setUrl] = useState('');
  const [categoria, setCategoria] = useState('automatico');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [produtos, setProdutos] = useState<any[]>([]);

  // Simple Authenticator
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);

  const [loadingSync, setLoadingSync] = useState(false);
  const [syncMode, setSyncMode] = useState<'auto' | 'manual' | 'json'>('auto');
  const [manualHtml, setManualHtml] = useState('');
  const [jsonInput, setJsonInput] = useState('');

  const fetchProdutos = async (pwd: string) => {
    if (!pwd) return;
    try {
      const res = await fetch('/api/admin/produtos', {
        headers: { 'Authorization': `Bearer ${pwd}` }
      });
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => new Date(b.data_adicionado).getTime() - new Date(a.data_adicionado).getTime());
        setProdutos(data);
      } else if (res.status === 401) {
        setAuthed(false);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  // Polling automático a cada 10 segundos quando logado
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authed && password) {
      fetchProdutos(password); // Busca imediata
      interval = setInterval(() => {
        fetchProdutos(password);
      }, 10000); // 10 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authed, password]);

  const processVitrineHtml = (html: string) => {
    console.log('Iniciando processamento de HTML...', html.length);
    
    // Tenta primeiro o padrão _n.ctx.r (mais comum em vitrines)
    let marker = '_n.ctx.r=';
    let markerIdx = html.indexOf(marker);
    
    // Se não achar, tenta window.__PRELOADED_STATE__ (comum em listagens)
    if (markerIdx === -1) {
      marker = 'window.__PRELOADED_STATE__ = ';
      markerIdx = html.indexOf(marker);
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
      [];
    
    console.log('Polycards encontrados:', polycards.length);

    return polycards.map((p: any) => {
      try {
        const components = p.components || [];
        const titleComp = components.find((c: any) => c.type === 'title');
        const priceComp = components.find((c: any) => c.type === 'price');
        const id = p.pictures?.pictures?.[0]?.id || p.metadata?.id || p.unique_id || p.id;
        
        if (!id) return null;

        return {
          id: id,
          title: titleComp?.title?.text || p.title || 'Produto Mercado Livre',
          price: priceComp?.price?.current_price?.value || p.price || 0,
          image: id ? (id.startsWith('http') ? id : `https://http2.mlstatic.com/D_NQ_NP_${id}-O.webp`) : '',
          permalink: (p.metadata?.url || p.permalink || '') + (p.metadata?.url_params || '') + (p.metadata?.url_fragments || '')
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
        const baseUrl = 'https://www.mercadolivre.com.br/social/rodriguesleonardo2022060705062/lists/765f49c4-4f0c-4da3-9d46-e3ffe7e32ce2?matt_tool=55704581&forceInApp=true';
        let allItems: any[] = [];
        
        for (let page = 1; page <= 5; page++) {
          setMsg({ text: `Buscando produtos da página ${page}...`, type: 'info' });
          const urlVitrine = page === 1 ? baseUrl : `${baseUrl}&page=${page}`;
          
          let html = '';
          try {
            console.log(`[PIPELINE-FRONT] Sync Página ${page} via Proxy Interno...`);
            const res = await fetch(`/api/admin/proxy?url=${encodeURIComponent(urlVitrine)}`);
            const data = await res.json();

            if (data.success) {
              html = data.html;
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
          
          setMsg({ text: `Salvando [${savedCount + 1}/${items.length}]: ${item.title.substring(0, 30)}...`, type: 'info' });
          
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
          
          savedCount++;
          await new Promise(r => setTimeout(r, 100)); 
        } catch (e) { 
          console.error('Erro ao salvar item individual:', e); 
        }
      }
      
      if (savedCount > 0) {
        setMsg({ text: `${savedCount} produtos sincronizados com sucesso!`, type: 'success' });
        setManualHtml('');
        setJsonInput('');
        fetchProdutos(password);
      } else {
        throw new Error('Falha ao salvar os produtos no banco de dados.');
      }
    } catch (error: any) {
      setMsg({ text: 'Falha: ' + (error.message || 'Erro inesperado'), type: 'error' });
    } finally {
      setLoadingSync(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/produtos', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => new Date(b.data_adicionado).getTime() - new Date(a.data_adicionado).getTime());
        setProdutos(data);
        setAuthed(true);
      } else {
        alert('Senha incorreta.');
        setPassword('');
      }
    } catch (error) {
      alert('Erro ao validar acesso.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthed(false);
    setPassword('');
    setUrl('');
    setMsg({ text: '', type: '' });
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
      const res = await fetch('/api/admin/produtos', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${password}` 
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
      setTimeout(() => fetchProdutos(password), 500);
      
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
      const res = await fetch(`/api/admin/produtos?id=${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${password}`}
      });
      if (res.ok) {
        fetchProdutos(password);
      } else {
        alert('Erro ao deletar produto.');
      }
    } catch (e) {
      alert('Erro inesperado.');
    }
  };

  if (!authed) {
    return (
      <div className="flex justify-center items-center min-h-[70vh] px-4">
        <form onSubmit={handleLogin} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 text-center w-full max-sm:max-w-full max-w-sm transition-all">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Área Restrita</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Digite a senha administrativa para acessar o X Promo.</p>
          
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl mb-6 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all text-center"
            placeholder="Senha de acesso"
            required
            autoFocus
            autoComplete="new-password"
            name={`admin-pass-${Date.now()}`}
          />
          
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl w-full transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
          >
            Acessar Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="flex justify-between items-center mb-10 border-l-4 border-blue-600 pl-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Painel X Promo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest mt-1">Gerenciamento de Vitrine</p>
        </div>
        <button 
          onClick={handleLogout} 
          className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
        >
          Encerrar Sessão
        </button>
      </header>
      
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
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
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

      {/* Seção de Sincronia Automática (Opcional por enquanto) */}
      <details className="mb-12 group">
        <summary className="cursor-pointer list-none flex items-center gap-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 text-sm font-medium transition-colors ml-4">
          <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          Opções Avançadas de Sincronização
        </summary>
        <div className="mt-6 bg-gray-50/50 dark:bg-slate-800/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                Sync Automático (Em breve)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sincronização em massa via Vitrine Social.</p>
            </div>
          </div>
          <button
            onClick={handleSyncVitrine}
            disabled={loadingSync}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-gray-400 border-2 border-dashed border-gray-200 dark:border-slate-800 cursor-not-allowed"
          >
            Sincronização Desativada Temporariamente
          </button>
        </div>
      </details>

      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-8 gap-4 px-1">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Seus Produtos ({produtos.length})</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie sua listagem atual no site.</p>
        </div>
        
        <button
           onClick={() => fetchProdutos(password)}
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
                
                <button 
                  onClick={() => deletarProduto(p.id, p.title)}
                  className="w-12 h-12 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all active:scale-75"
                  title="Remover"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
