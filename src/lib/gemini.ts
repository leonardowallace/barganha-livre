import { GoogleGenerativeAI } from "@google/generative-ai";
import { CATEGORY_NAMES } from "./products";

/**
 * Categoriza um produto usando o SDK direto do Gemini (Google AI Studio).
 * Requer GEMINI_API_KEY no .env.local.
 */
export async function categorizeProduct(title: string, description: string = ""): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "SUA_CHAVE_AQUI_GEMINI") {
    console.warn("GEMINI_API_KEY não configurada. Fallback para 'ofertas'.");
    return "ofertas";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Criar a lista de categorias para o prompt
    const categoriesList = Object.entries(CATEGORY_NAMES)
      .map(([id, name]) => `- ${id}: ${name}`)
      .join("\n");

    const prompt = `
Você é um classificador de produtos de e-commerce de alta precisão.
Sua missão é extrair o ID da categoria correta para o produto abaixo, baseando-se no TÍTULO e na DESCRIÇÃO.

REGRAS DE OURO:
1. Retorne APENAS o ID da categoria (ex: celulares). Nunca use frases ou pontuação.
2. CATEGORIA 'celulares': Inclui Smartphones, iPhones, Celulares comuns e TODOS os seus acessórios (Carregadores, Cabos, Capinhas, Películas, Fones Bluetooth, Smartwatches, Power Banks).
3. CATEGORIA 'informatica': Inclui Notebooks, PCs, Monitores, Mouses, Teclados, SSDs, Roteadores, Impressoras e Peças de Hardware.
4. CATEGORIA 'games': Inclui Consoles (Switch, PS5, Xbox), Controles, Jogos e Acessórios para Cinema/Games.
5. CATEGORIA 'eletronicos': Use para TVs, Caixas de Som (JBL, etc), Fones de Ouvido Grandes, Câmeras Profissionais e Projetores.
6. Se o produto for claramente de informática mas também um eletrônico, prefira 'informatica'.
7. Use 'ofertas' APENAS se o produto não tiver NENHUMA categoria correspondente na lista abaixo.

ESTRUTURA DE DADOS:
Título: ${title}
Descrição: ${description}

LISTA DE CATEGORIAS VÁLIDAS (SÓ USE ESTES IDs):
${categoriesList}

ID ESCOLHIDO (APENAS O ID):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let categoryId = response.text().toLowerCase().trim();

    // LOG DE DEBUG
    console.log(`[Gemini] Produto: ${title.substring(0, 30)} | Sugestão: ${categoryId}`);

    // Validar se o ID retornado existe em nossa taxonomia local
    if (CATEGORY_NAMES[categoryId]) {
      return categoryId;
    }

    // Tentar encontrar por nome amigável se a IA retornar o nome por engano
    const foundByIdName = Object.keys(CATEGORY_NAMES).find(
      key => categoryId.includes(key) || categoryId === CATEGORY_NAMES[key].toLowerCase()
    );

    if (foundByIdName) {
      return foundByIdName;
    }

    console.warn(`[Gemini] Categoria desconhecida: ${categoryId}`);

    console.warn(`Gemini retornou categoria desconhecida: "${categoryId}". Fallback para 'ofertas'.`);
    return "ofertas";
  } catch (error: any) {
    // Log de erro no console
    console.error("Erro Gemini:", error.message);
    console.error("Falha na classificação via Gemini SDK:", error);
    return "ofertas";
  }
}
