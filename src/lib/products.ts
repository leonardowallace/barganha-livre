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

// Categorias consolidadas para uma navegação mais limpa (enxugada)
export const CATEGORY_NAMES: Record<string, string> = {
  tecnologia: 'Tecnologia & Games',
  casa_eletro: 'Casa & Eletro',
  construcao: 'Construção & Ferramentas',
  moda_beleza: 'Moda & Beleza',
  saude_esportes: 'Saúde & Esportes',
  lifestyle_kids: 'Lifestyle & Kids',
  outros: 'Outros & Automotivo',
};


function sanitizeAffiliateUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

function generateAffiliateUrl(permalink: string): string {
  if (!permalink) return '';
  const cleanPermalink = sanitizeAffiliateUrl(permalink);
  const separator = cleanPermalink.includes('?') ? '&' : '?';
  return `${cleanPermalink}${separator}matt_tool=55704581&matt_word=rodriguesleonardo2022060705062`;
}

export async function getProdutos(categoria?: string, limitCount = 100, searchTerm?: string) {
  try {
    const produtosRef = ref(rtdb, 'produtos');
    const q = query(produtosRef, limitToLast(1000)); // Pega mais itens para busca eficiente
    const snapshot = await get(q);

    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    let docs: ProdutoAfiliado[] = Object.keys(data).map(key => ({
      id: key,
      ...data[key],
      affiliate_url: sanitizeAffiliateUrl(data[key].affiliate_url || generateAffiliateUrl(data[key].permalink || ''))
    }));

    // Filtra por categoria
    if (categoria && categoria !== 'todos') {
      const catLower = categoria.toLowerCase();
      docs = docs.filter(d => d.categoria && d.categoria.toLowerCase() === catLower);
    }

    // Filtra por termo de busca (Case insensitive)
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      docs = docs.filter(d => 
        d.title.toLowerCase().includes(term) || 
        (d.categoria && d.categoria.toLowerCase().includes(term))
      );
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
      // Ignora produtos sem categoria válida ou com 'ofertas' (legado)
      if (prod.categoria && prod.categoria !== 'ofertas' && CATEGORY_NAMES[prod.categoria]) {
        categoriasSet.add(prod.categoria);
      }
    });

    const categoriasVivas = Array.from(categoriasSet);

    // Ordena seguindo a ordem definida em CATEGORY_NAMES
    const ordemDefinida = Object.keys(CATEGORY_NAMES);
    categoriasVivas.sort(
      (a, b) => ordemDefinida.indexOf(a) - ordemDefinida.indexOf(b)
    );

    return categoriasVivas.map(id => ({
      id,
      name: CATEGORY_NAMES[id] || id.charAt(0).toUpperCase() + id.slice(1),
      path: `/${id}`,
    }));
  } catch (error) {
    console.error('[RTD] Erro ao buscar categorias vivas:', error);
    return [];
  }
}
