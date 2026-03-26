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

  const handleSyncVitrine = async () => {
    setLoadingSync(true);
    setMsg({ text: 'Sincronizando com sua vitrine do Mercado Livre via navegador...', type: 'info' });
    
    try {
      const urlSEC = 'https://mercadolivre.com/sec/1Nsn5dh';
      
      // 1. Busca HTML via Navegador (Bypass Timeout do Servidor e Bloqueio de IP)
      // Nota: Fetch direto pode dar CORS, então usamos um truque se necessário, 
      // mas vamos tentar o fetch normal primeiro com o link SEC.
      const resML = await fetch(urlSEC, { redirect: 'follow' });
      const html = await resML.text();
      
      const marker = '"polycards":';
      const markerIdx = html.indexOf(marker);
      if (markerIdx === -1) throw new Error('Dados de vitrine não encontrados na página.');

      const startBracketIdx = html.indexOf('[', markerIdx);
      let depth = 0;
      let endBracketIdx = -1;
      for (let i = startBracketIdx; i < html.length; i++) {
        if (html[i] === '[') depth++;
        else if (html[i] === ']') {
          depth--;
          if (depth === 0) {
            endBracketIdx = i;
            break;
          }
        }
      }

      if (endBracketIdx === -1) throw new Error('Falha ao processar lista de produtos.');

      const rawArray = html.substring(startBracketIdx, endBracketIdx + 1);
      const polycards = JSON.parse(rawArray);
      
      const items = polycards.map((p: any) => {
        const titleComp = p.components?.find((c: any) => c.type === 'title');
        const priceComp = p.components?.find((c: any) => c.type === 'price');
        return {
          id: p.metadata?.id || p.unique_id,
          title: titleComp?.title?.text || 'Produto',
          price: priceComp?.price?.current_price?.value || 0,
          image: (p.pictures?.[0] || '').replace('-I.', '-O.').replace('-W.', '-O.'),
          permalink: p.metadata?.url || ''
        };
      });

      // 2. Envia para o servidor apenas para salvar no Firestore
      const res = await fetch('/api/admin/sync-vitrine', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({ items })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMsg({ text: data.message, type: 'success' });
        fetchProdutos(password);
      } else {
        setMsg({ text: 'Erro ao salvar: ' + (data.error || 'Erro desconhecido'), type: 'error' });
      }
    } catch (error: any) {
      setMsg({ text: 'Falha na sincronização: ' + (error.message || 'Erro de rede'), type: 'error' });
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
        <form onSubmit={handleLogin} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 text-center w-full max-w-sm transition-all">
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

      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-8 gap-4 px-1">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Seus Produtos ({produtos.length})</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie sua listagem atual no site.</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleSyncVitrine}
            disabled={loadingSync}
            className={`flex items-center justify-center gap-2 flex-grow sm:flex-initial py-3 px-5 rounded-2xl text-sm font-bold transition-all border ${
              loadingSync 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 active:scale-95 border-transparent'
            }`}
          >
            {loadingSync ? 'Sincronizando...' : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Sync Vitrine Social
              </>
            )}
          </button>
          
          <button
             onClick={() => fetchProdutos(password)}
             className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95"
             title="Atualizar Lista"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
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
