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
1.  **Frontend (Next.js 16 + React 19 + Tailwind CSS 4)**:
    - Interface responsiva com foco em Mobile-First e Performance.
    - Sistema de busca assíncrono otimizado para a nova arquitetura do Next.js.
2.  **Backend (Next.js API Routes + Firebase Admin SDK)**:
    - Endpoints administrativos protegidos por `ADMIN_PASSWORD`.
    - Uso exclusivo de **Firebase Admin SDK** para operações de escrita, garantindo integridade dos dados.
    - Classificação de produtos utilizando **Google Gemini AI** com prompts de agrupamento consolidados.

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
    # Firebase Client Config (Público)
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    ...

    # Firebase Admin Config (Segredo do Servidor)
    FIREBASE_CLIENT_EMAIL=...
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

    # Gemini AI & Admin
    GEMINI_API_KEY=...
    ADMIN_PASSWORD=...
    ```
3.  **Rodar**:
    ```bash
    npm run dev
    ```

---

## 🛠️ Decisões de Engenharia
- **Migração para Admin SDK**: Resolvemos o alerta de segurança do Firebase migrando todas as escritas para o lado do servidor, permitindo regras de banco de dados estritamente restritivas (`.write: false`).
- **Navegação Consolidada**: Reduzimos 23 categorias para 7 grupos estratégicos para melhorar o tempo de decisão do usuário (Hick's Law).
- **Compatibilidade Next.js 16**: Refatoramos o tratamento de `searchParams` para suportar as mudanças assíncronas da versão mais recente do framework.

---
**Desenvolvido por leonardowallace - 2026**
