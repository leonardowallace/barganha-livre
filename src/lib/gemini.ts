import { GoogleGenerativeAI } from "@google/generative-ai";
import { CATEGORY_NAMES } from "./products";

const VALID_CATEGORY_IDS = Object.keys(CATEGORY_NAMES);

/**
 * Categoriza por palavras-chave (funciona offline, sem IA).
 * Mapeia para as 7 categorias consolidadas (enxugadas).
 */
function categorizeByKeywords(title: string): string {
  const t = title.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Tecnologia & Games
  if (/celular|smartphone|iphone|galaxy|redmi|moto|xiaomi|nintendo|switch|playstation|ps5|ps4|xbox|video.?game|notebook|laptop|computador|monitor|mouse|teclado|ssd|hd externo|wi.?fi|camera|drone|tv |televisao|smart.?tv|caixa.*som|alexa|fone.*bluetooth|headset|relogio.*inteligente|smartwatch/i.test(t)) return "tecnologia";

  // Casa & Eletro
  if (/liquidificador|cafeteira|micro.?ondas|geladeira|fogao|batedeira|fritadeira|air.*fryer|aspirador|ferro.*passar|maquina.*lavar|ventilador|ar.*condicionado|sofa|armario|prateleira|estante|cama|colchao|tapete|panela|frigideira|mesa|cadeira|escritorio|papelaria/i.test(t)) return "casa_eletro";

  // Construção & Ferramentas
  if (/furadeira|parafusadeira|serra|martelo|alicate|chave.*fenda|esmerilhadeira|ferramenta|cimento|tinta|piso|revestimento|eletrico|hidraulico|tomada|interruptor/i.test(t)) return "construcao";

  // Moda & Beleza
  if (/camisa|camiseta|blusa|calca|jaqueta|vestido|tenis|sapato|bota|bolsa|relogio|joia|perfume|shampoo|maquiagem|batom|creme|hidratante|secador|chapinha|barbeador/i.test(t)) return "moda_beleza";

  // Saúde & Esportes
  if (/whey|creatina|suplemento|vitamina|academia|musculacao|bicicleta|esteira|halter|tenis.*corrida|esporte|futebol|basquete|yoga|saude|termometro|massageador/i.test(t)) return "saude_esportes";

  // Lifestyle & Kids (Livros, Música, Bebês, Brinquedos, Pets)
  if (/livro|literatura|biografia|manga|hq|quadrinho|violao|guitarra|teclado.*musical|brinquedo|boneca|lego|bebe|fralda|carrinho.*bebe|pet |racao|aquario/i.test(t)) return "lifestyle_kids";

  // Outros & Automotivo
  if (/carro|moto\s|pneu|oleo.*motor|acessorio.*automotivo|supermercado|alimento|bebida|vinho|cerveja/i.test(t)) return "outros";

  return "tecnologia"; // Fallback mais comum
}

/**
 * Categoriza um produto usando IA (Gemini) ou Keywords como fallback.
 * Baseado nas 7 categorias consolidadas.
 */
export async function categorizeProduct(title: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "SUA_CHAVE_AQUI_GEMINI") {
    return categorizeByKeywords(title);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const categoriesList = VALID_CATEGORY_IDS
      .map(id => `- ${id}: ${CATEGORY_NAMES[id]}`)
      .join("\n");

    const prompt = `Você é um especialista em e-commerce. Categorize o produto abaixo em uma destas 7 categorias.
Retorne APENAS o ID da categoria.

PRODUTO: "${title}"

CATEGORIAS DISPONÍVEIS (ID: Descrição):
${categoriesList}

ID DA CATEGORIA:`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().toLowerCase().trim().replace(/[`'".\s]/g, "");

    if (VALID_CATEGORY_IDS.includes(rawText)) return rawText;
    
    // Fallback se a IA falhar ou retornar algo fora da lista
    return categorizeByKeywords(title);

  } catch (error) {
    return categorizeByKeywords(title);
  }
}
