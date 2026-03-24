'use client';

import { useState, useEffect } from 'react';

const categorias = ['eletronicos', 'casa', 'moda', 'esportes', 'beleza', 'automotivo'];

export default function AdminPage() {
  const [url, setUrl] = useState('');
  const [categoria, setCategoria] = useState('eletronicos');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [produtos, setProdutos] = useState<any[]>([]);

  // Simple Authenticator
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);

  const loadProdutos = async (pwd: string) => {
    try {
      const res = await fetch('/api/admin/produtos', {
          headers: { 'Authorization': `Bearer ${pwd}`}
      });
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => new Date(b.data_adicionado).getTime() - new Date(a.data_adicionado).getTime());
        setProdutos(data);
        setAuthed(true); // se carregou é pq a senha bateu
      } else {
        if(authed) alert('Sessão expirada ou senha inválida.');
        setAuthed(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loadProdutos(password);
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
      loadProdutos(password);
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
        loadProdutos(password);
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
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md border border-gray-200 text-center w-full max-w-sm">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Acesso Administrativo</h2>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Digite a senha"
            required
          />
          <button 
            type="submit"
            className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-lg w-full transition-colors"
          >
            Acessar Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8 border-l-4 border-blue-600 pl-4">
        <h1 className="text-3xl font-black text-gray-900">Painel Administrativo</h1>
        <button onClick={() => setAuthed(false)} className="text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors">Sair</button>
      </div>
      
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 mb-10">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Adicionar Novo Produto</h2>
        
        {msg.text && (
          <div className={`p-4 mb-6 rounded-lg ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">URL Oficial do Mercado Livre</label>
            <input 
              type="url" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Cole o link completo do produto aqui..." 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria de Exibição no Site</label>
            <select 
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 px-4 rounded-lg text-white font-bold transition-all ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-[0.99]'} mt-4`}
          >
            {loading ? 'Extraindo dados e Salvando...' : 'Cadastrar Produto na Vitrine'}
          </button>
        </form>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-gray-800">Produtos Cadastrados ({produtos.length})</h2>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {produtos.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Nenhum produto cadastrado ainda. A vitrine está vazia.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {produtos.map(p => (
              <li key={p.id} className="p-4 sm:p-6 flex items-center hover:bg-blue-50/30 transition-colors group">
                <img src={p.image} alt="thumb" className="w-20 h-20 object-contain rounded-lg bg-white border border-gray-100 p-1" />
                <div className="ml-5 flex-grow min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{p.title}</h3>
                  <div className="flex flex-wrap items-center text-xs text-gray-500 mt-2 gap-3">
                    <span className="bg-gray-100 px-2.5 py-1 rounded-md text-gray-700 font-medium uppercase tracking-wide text-[10px]">cat: {p.categoria}</span>
                    <span className="text-green-600 font-black text-sm">R$ {p.price}</span>
                  </div>
                </div>
                <button 
                  onClick={() => deletarProduto(p.id, p.title)}
                  className="ml-4 text-gray-400 hover:text-red-600 hover:bg-red-50 p-3 rounded-full transition-colors"
                  title="Remover"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
