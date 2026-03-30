import { rtdb } from './firebase';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';

export interface ProdutoAfiliado {
  id: string;
  mlb_id: string;
  title: string;
  price: number;
  image: string;
  affiliate_url: string;
  categoria: string;
  timestamp?: any;
  data_adicionado?: string;
  permalink?: string;
}

export const CATEGORY_NAMES: Record<string, string> = {
  ofertas: 'Ofertas',
  eletronicos: 'Eletrônicos, Áudio & Vídeo',
  casa: 'Casa & Móveis',
  moda: 'Moda (Roupas & Calçados)',
  saude: 'Saúde',
  esportes: 'Esportes & Fitness',
  beleza: 'Beleza & Cuidado Pessoal',
  automotivo: 'Acessórios Automotivos',
  veiculos: 'Veículos',
  supermercado: 'Alimentos & Bebidas',
  petshop: 'Pet Shop',
  bebes: 'Bebês',
  brinquedos: 'Brinquedos & Hobbies',
  games: 'Games',
  informatica: 'Informática',
  celulares: 'Celulares & Telefones',
  ferramentas: 'Ferramentas',
  construcao: 'Construção',
  livros: 'Livros, Revistas & Comics',
  musica: 'Instrumentos Musicais',
  cameras: 'Câmeras & Acessórios',
  industria: 'Indústria & Comércio',
  escritorio: 'Arte, Papelaria & Armarinho',
  servicos: 'Serviços',
  eletrodomesticos: 'Eletrodomésticos',
  relogios: 'Joias & Relógios',
  calcados: 'Calçados',
};

function generateAffiliateUrl(permalink: string): string {
    if (!permalink) return '';
    const separator = permalink.includes('?') ? '&' : '?';
    return `${permalink}${separator}matt_tool=55704581&matt_word=rodriguesleonardo2022060705062`;
}

export async function getProdutos(categoria?: string, limitCount = 100) {
  try {
    const produtosRef = ref(rtdb, 'produtos');
    // RTD não tem query de filtragem tão flexível quanto Firestore sem índices complexos
    // Mas como o volume é baixo, pegamos os últimos 500 e filtramos em memória
    const q = query(produtosRef, limitToLast(500));
    const snapshot = await get(q);
    
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    let docs: ProdutoAfiliado[] = Object.keys(data).map(key => ({
        id: key,
        ...data[key],
        affiliate_url: data[key].affiliate_url || generateAffiliateUrl(data[key].permalink || '')
    }));

    if (categoria && categoria !== 'ofertas' && categoria !== 'todos') {
        const catLower = categoria.toLowerCase();
        docs = docs.filter(d => d.categoria && d.categoria.toLowerCase() === catLower);
    }

    docs.sort((a, b) => {
        const dateA = a.data_adicionado ? new Date(a.data_adicionado).getTime() : 0;
        const dateB = b.data_adicionado ? new Date(b.data_adicionado).getTime() : 0;
        return dateB - dateA;
    });

    return docs.slice(0, limitCount);
  } catch (error) {
    console.error(`[RTD] Erro ao buscar produtos (${categoria}):`, error);
    return [];
  }
}

export async function getCategoriasVivas() {
  try {
    const produtosRef = ref(rtdb, 'produtos');
    const snapshot = await get(produtosRef);
    
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    const categoriasSet = new Set<string>();
    
    Object.values(data).forEach((prod: any) => {
      if (prod.categoria) categoriasSet.add(prod.categoria);
    });

    const categoriasVivas = Array.from(categoriasSet).sort();
    
    const result = categoriasVivas.map(id => ({
      id,
      name: CATEGORY_NAMES[id] || id.charAt(0).toUpperCase() + id.slice(1),
      path: id === 'ofertas' ? '/' : `/${id}`
    }));

    result.sort((a, b) => (a.id === 'ofertas' ? -1 : b.id === 'ofertas' ? 1 : 0));
    
    return result;
  } catch (error) {
    console.error('[RTD] Erro ao buscar categorias vivas:', error);
    return [];
  }
}
