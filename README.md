# X Promo - Plataforma Automática de Afiliados

X Promo é um ecossistema de curadoria de ofertas automatizado, desenvolvido para capturar os melhores produtos do Mercado Livre em tempo real e rentabilizá-los através de links de afiliado injetados dinamicamente.

## 🏗️ Arquitetura do Sistema

O sistema utiliza **Next.js (App Router)** atuando em duas frentes:
1. **Frontend (Client/Server Components)**: Uma interface ultrarrápida hospedada no mesmo servidor, focada na experiência do usuário (UX), com skeletons loading e Tailwind CSS para estilização premium e responsiva.
2. **Backend (API Routes - `/api/produtos`)**: Funciona como um Middleware/BFF (Backend For Frontend). Consome a API pública de buscas do Mercado Livre, formata os dados e injeta as variáveis de afiliado.

### Fluxo de Funcionamento
1. O usuário acessa a plataforma (`/`) ou as categorias (`/eletronicos`, `/casa`, etc.).
2. O Frontend requisita o endpoint interno `/api/produtos?categoria=X`.
3. O Backend checa se há produtos recentes no **Cache em Memória (TTL de 30min)**.
    - Se sim, responde em milissegundos.
    - Se não, faz o fetch na API do ML (`https://api.mercadolibre.com/sites/MLB/search`).
4. Os dados retornados passam pelo escrutínio de Ranking: `score = sold_quantity * 0.7`.
5. Os links dos produtos originais são substituídos utilizando a variável de ambiente `AFILIADO_ID` injetando o parametro `matt_tool`.
6. O frontend renderiza a grid de produtos ranqueados de forma performática.

## 🚀 Como Instalar e Rodar Localmente

### Pré-requisitos
- Node.js 18+ instalado
- Um ID de afiliado do Mercado Livre.

### Passos:
1. Extraia e acesse a pasta do projeto:
\`\`\`bash
cd X Promo
\`\`\`

2. Instale as dependências:
\`\`\`bash
npm install
\`\`\`

3. Configuração de Variáveis de Ambiente:
Crie ou renomeie um arquivo \`.env.local\` na raiz e adicione suas credenciais:
\`\`\`bash
MATT_TOOL=55704581
MATT_WORD=rodriguesleonardo2022060705062
\`\`\`

4. Inicie o servidor de desenvolvimento:
\`\`\`bash
npm run dev
\`\`\`

5. Acesse [http://localhost:3000](http://localhost:3000) e divirta-se com seu e-commerce afiliado automatizado!

## 🛠️ Decisões Técnicas
- **Score Dinâmico**: O cálculo multiplicador garante que produtos encalhados não tomem o lugar de itens em alta.
- **Cache Local In-Memory**: Para manter os custos computacionais nulos neste estágio (MVP) e evitar TimeOut rate-limiting da API pública do ML.
- **Renderização Client-Side na listagem**: Adotado para permitir que o usuário veja a página e os skeletons o mais rápido possível enquanto a API de afiliados ranqueia os dados.
