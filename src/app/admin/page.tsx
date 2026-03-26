'use client';

import { useState, useEffect } from 'react';

const categorias = ['eletronicos', 'casa', 'moda', 'saude', 'estudos', 'esportes', 'beleza', 'automotivo'];

export default function AdminPage() {
  const [url, setUrl] = useState('');
  const [categoria, setCategoria] = useState('eletronicos');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [produtos, setProdutos] = useState<any[]>([]);

  // Simple Authenticator
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);

  const [loadingSync, setLoadingSync] = useState(false);
  const [syncMode, setSyncMode] = useState<'auto' | 'manual'>('auto');
  const [manualHtml, setManualHtml] = useState('');

  const fetchProdutos = async (pwd: string) => {
    try {
      const res = await fetch('/api/admin/produtos', {
        headers: { 'Authorization': `Bearer ${pwd}` }
      });
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => new Date(b.data_adicionado).getTime() - new Date(a.data_adicionado).getTime());
        setProdutos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const processVitrineHtml = (html: string) => {
    const marker = '_n.ctx.r=';
    const markerIdx = html.indexOf(marker);
    if (markerIdx === -1) throw new Error('Estrutura de dados não encontrada. Verifique se copiou o código correto.');

    const startIdx = markerIdx + marker.length;
    let depth = 0;
    let endIdx = -1;
    let foundStart = false;

    // Busca equilibrada de chaves para extrair o JSON do objeto global do ML
    for (let i = startIdx; i < html.length; i++) {
        if (html[i] === '{') { depth++; foundStart = true; }
        else if (html[i] === '}') {
          depth--;
          if (foundStart && depth === 0) { endIdx = i; break; }
        }
    }

    if (endIdx === -1) throw new Error('Erro ao delimitar dados. Tente copiar novamente.');

    const jsonStr = html.substring(startIdx, endIdx + 1);
    const data = JSON.parse(jsonStr);
    const polycards = data.appProps?.pageProps?.polycards || [];
    
    return polycards.map((p: any) => {
      const titleComp = p.components?.find((c: any) => c.type === 'title');
      const priceComp = p.components?.find((c: any) => c.type === 'price');
      const id = p.pictures?.pictures?.[0]?.id || p.metadata?.id || p.unique_id;
      return {
        id: id,
        title: titleComp?.title?.text || 'Produto',
        price: priceComp?.price?.current_price?.value || 0,
        image: id ? `https://http2.mlstatic.com/D_NQ_NP_${id}-O.webp` : '',
        permalink: p.metadata?.url + (p.metadata?.url_params || '') + (p.metadata?.url_fragments || '')
      };
    });
  };

  const handleSyncVitrine = async () => {
    setLoadingSync(true);
    setMsg({ text: 'Sincronizando...', type: 'info' });
    
    try {
      let items = [];

      if (syncMode === 'manual') {
        if (!manualHtml) throw new Error('Cole o código-fonte da página primeiro.');
        items = processVitrineHtml(manualHtml);
      } else {
        const urlVitrine = 'https://www.mercadolivre.com.br/social/rodriguesleonardo2022060705062/lists/765f49c4-4f0c-4da3-9d46-e3ffe7e32ce2?matt_tool=55704581&forceInApp=true';
        // Bypass via proxy AllOrigins para evitar 502 do servidor e restrições de rede
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlVitrine)}`;
        
        const resProxy = await fetch(proxyUrl);
        if (!resProxy.ok) throw new Error('Erro de conexão. Use o Modo Manual abaixo.');
        
        const proxyData = await resProxy.json();
        items = processVitrineHtml(proxyData.contents);
      }

      if (items.length === 0) throw new Error('Nenhum produto encontrado no código fornecido.');

      const resSave = await fetch('/api/admin/sync-vitrine', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({ items })
      });
      
      const finalData = await resSave.json();
      if (finalData.success) {
        setMsg({ text: `${finalData.message} (${items.length} itens)`, type: 'success' });
        setManualHtml('');
        fetchProdutos(password);
      } else {
        setMsg({ text: 'Erro ao salvar: ' + (finalData.error || 'Erro desconhecido'), type: 'error' });
      }
    } catch (error: any) {
      setMsg({ text: 'Falha: ' + (error.message || 'Erro de rede'), type: 'error' });
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
    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/admin/produtos', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({ url, categoria }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao adicionar');
      }

      setMsg({ text: 'Produto adicionado com sucesso!', type: 'success' });
      setUrl('');
      fetchProdutos(password);
    } catch (error: any) {
      setMsg({ text: error.message, type: 'error' });
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
                placeholder="Ex: https://produto.mercadolivre..." 
                className="w-full px-4 py-3.5 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 dark:bg-slate-800/50 dark:text-white transition-all outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Categoria</label>
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
            ) : 'Cadastrar Produto Manual'}
          </button>
        </form>
      </div>

      {/* Sincronização de Vitrine */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
              Vitrine Social Mercado Livre
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Importe produtos da sua lista de recomendações automaticamente.</p>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 border border-gray-200 dark:border-slate-700">
            <button 
              onClick={() => setSyncMode('auto')}
              type="button"
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${syncMode === 'auto' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              Automático
            </button>
            <button 
              onClick={() => setSyncMode('manual')}
              type="button"
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${syncMode === 'manual' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              Manual (Código)
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {syncMode === 'manual' ? (
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 p-4 rounded-2xl">
                <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  <strong>Bypass de Bloqueio:</strong> Se o modo automático falhar, entre na sua lista no ML pelo navegador, pressione <code>Ctrl+U</code>, selecione tudo (<code>Ctrl+A</code>), copie e cole aqui.
                </p>
              </div>
              <textarea
                value={manualHtml}
                onChange={(e) => setManualHtml(e.target.value)}
                placeholder="Cole aqui o código-fonte (HTML) da sua vitrine do Mercado Livre..."
                className="w-full h-40 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-4 text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-[10px]"
              />
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700 p-6 rounded-2xl text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">O sistema tentará buscar os produtos usando o link direto da sua vitrine social via proxy.</p>
            </div>
          )}

          <button
            onClick={handleSyncVitrine}
            disabled={loadingSync}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all ${
              loadingSync 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 active:scale-[0.98]'
            }`}
          >
            {loadingSync ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Sincronizando...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Vitrine Social
              </>
            )}
          </button>
        </div>
      </div>

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
