# 🚀 XPromo - Plataforma Inteligente de Afiliados

**XPromo** é um ecossistema completo de curadoria de ofertas automatizado, projetado para transformar o volume de dados do Mercado Livre em uma vitrine de alta conversão. O sistema utiliza Inteligência Artificial para categorizar produtos e injetar links de afiliado dinamicamente, garantindo monetização em escala.

---

## 💼 Business Case

### O Problema
Afiliados do Mercado Livre perdem horas selecionando produtos, gerando links e organizando vitrines manuais que ficam desatualizadas rapidamente. Além disso, a categorização manual é falha e difícil de escalar.

### Público-Alvo
- Influenciadores digitais e criadores de conteúdo (foco em "Achadinhos").
- Donos de canais de ofertas no Telegram e WhatsApp.
- Empreendedores de e-commerce que operam no modelo de afiliados.

### Proposta de Valor
- **Automação Total**: Sincronização em massa de vitrines sociais e links de afiliados.
- **Categorização via IA**: Uso do Google Gemini para classificar produtos automaticamente com precisão cirúrgica.
- **Performance Premium**: Layout moderno, rápido e otimizado para conversão direta (UX Pro Max).

### Diferenciais Competitivos
- **RTDB Real-time Sync**: Atualização instantânea de preços e estoque via Realtime Database.
- **Scraping Inteligente**: Bypass de limitações de API para obter dados sempre frescos.
- **Painel Administrativo Robusto**: Controle total sobre a base de dados em uma interface intuitiva.

### Modelos de Monetização
1. **Comissões de Afiliado**: Ganho sobre cada venda realizada através dos links gerados.
2. **Ads/Banner Slots**: Espaços estratégicos para anúncios de parceiros.
3. **SaaS (White-label)**: Possibilidade de licenciar a plataforma para outros afiliados.

---

## 🏗️ Arquitetura Técnica

O projeto utiliza a stack moderna **Next.js 15+ (App Router)** com foco em estabilidade e escalabilidade.

### Componentes Principais
1.  **Frontend (Next.js + Tailwind CSS)**:
    - Interface responsiva com foco em Mobile-First.
    - Componentes de alta performance (Skeletons, Lazy Loading).
    - Design System premium (Dark Mode, Glassmorphism).
2.  **Backend (Next.js API Routes)**:
    - Endpoints para CRUD de produtos, categorias e sincronização.
    - Integração com a **API do Mercado Livre** via Proxy para evitar CORS.
    - Classificação de produtos utilizando o SDK do **Google Gemini AI**.
3.  **Banco de Dados (Firebase Realtime Database)**:
    - Armazenamento centralizado de produtos.
    - Atualização em tempo real entre admin e vitrine.
    - Estrutura leve e otimizada para buscas rápidas por categoria.

### Fluxo de Dados
1.  **Input**: Admin insere uma URL do Mercado Livre ou sincroniza uma vitrine inteira.
2.  **Processamento**: O sistema extrai o ID (MLB), busca dados técnicos e envia para a IA categorizar.
3.  **Persistence**: Dados formatados são salvos no **RTDB**.
4.  **Delivery**: O frontend consome o RTDB (ou API intermediária) e renderiza para o usuário final com o link de afiliado injetado.

---

## 🚀 Instalação e Uso

### Pré-requisitos
- Node.js 18+
- Conta Firebase (Projeto com Realtime Database ativado)
- Google AI API Key (Gemini)

### Passos
1.  **Clonar e Instalar**:
    ```bash
    git clone https://github.com/leonardowallace/barganha-livre.git xpromo
    cd xpromo
    npm install
    ```
2.  **Configurar Variáveis de Ambiente**:
    Crie um arquivo `.env.local`:
    ```env
    # Firebase Config
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_DATABASE_URL=...

    # ML Affiliates
    MATT_TOOL=55704581
    MATT_WORD=rodriguesleonardo2022060705062

    # Gemini AI
    GEMINI_API_KEY=...

    # Admin Security
    ADMIN_PASSWORD=sua_senha_aqui
    ```
3.  **Rodar**:
    ```bash
    npm run dev
    ```

---

## 🛠️ Decisões de Engenharia
- **Abandono do Firestore**: Migramos 100% para o **Realtime Database** para simplificar a estrutura de dados e reduzir a latência de atualização para o usuário final.
- **Scraping Server-Side**: Implementamos uma camada de proxy para garantir que as informações de preço e imagem sejam obtidas mesmo quando a API oficial possui restrições.
- **IA Local vs Client**: O processamento de IA é feito estritamente no lado do servidor para proteger as chaves de API e garantir a sanitização dos dados.

---
**Desenvolvido por leonardowallace - 2026**
