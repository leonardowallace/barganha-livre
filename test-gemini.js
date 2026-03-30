const { GoogleGenerativeAI } = require("@google/generative-ai");
// Removendo dotenv para evitar erros de módulo

const CATEGORY_NAMES = {
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

async function testCategorization(title, description = "") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("ERRO: GEMINI_API_KEY não encontrada no .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const categoriesList = Object.entries(CATEGORY_NAMES)
    .map(([id, name]) => `- ${id}: ${name}`)
    .join("\n");

  const prompt = `
Você é um especialista em e-commerce e categorização de produtos para o Mercado Livre.
Sua tarefa é analisar o TÍTULO e a DESCRIÇÃO de um produto e retornar o ID da categoria mais específica da nossa lista.

REGRAS CRÍTICAS:
1. Retorne APENAS o ID da categoria (ex: eletronicos). Sem explicações ou pontuação.
2. ACESSÓRIOS: Carregadores, cabos, capas, películas e fones de ouvido para celulares DEVEM ser categorizados como 'celulares'.
3. COMPONENTES: Memórias, mouses, teclados, cabos de rede e SSDs DEVEM ser categorizados como 'informatica'.
4. Utensílios de cozinha, cama, mesa e banho devem ser 'casa'.
5. Se o produto não se encaixar em nada específico, retorne 'ofertas'.

EXEMPLOS:
- "Carregador Turbo 20W para iPhone 15" -> celulares
- "Notebook Dell 16GB RAM" -> informatica
- "Tênis Corrida Mizuno" -> calcados
- "Ração para Gatos 10kg" -> petshop
- "Panela de Pressão 4.5L" -> casa

PRODUTO:
Título: ${title}
Descrição: ${description}

CATEGORIAS DISPONÍVEIS (ID: Nome):
${categoriesList}

ID DA CATEGORIA ESCOLHIDA:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const categoryId = response.text().toLowerCase().trim().replace(/[`'"]/g, "");
    console.log(`Produto: "${title}" -> Categoria: "${categoryId}"`);
    return categoryId;
  } catch (error) {
    console.error("Erro no teste:", error);
  }
}

async function runTests() {
  console.log("--- INICIANDO TESTES DE CATEGORIZAÇÃO ---");
  await testCategorization("Carregador Samsung 25W USB-C");
  await testCategorization("Mouse Sem Fio Logitech");
  await testCategorization("Jogo God of War Ragnarok PS5");
  await testCategorization("Shampoo Pantene 400ml");
  console.log("--- TESTES CONCLUÍDOS ---");
}

runTests();
