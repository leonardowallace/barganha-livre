# 🏛️ Documentação de Arquitetura - XPromo

Este documento descreve as decisões de arquitetura e o design do sistema **XPromo**, focado em prover uma solução de afiliados escalável e robusta.

## 1. Visão Geral
O XPromo é uma plataforma que integra o ecossistema do Mercado Livre, utilizando IA para curadoria e o Firebase para persistência em tempo real.

## 2. Decisões de Engenharia (ADRs)

### 2.1 Padronização no Realtime Database (RTDB)
- **Motivação**: O projeto utilizava Firestore e RTDB simultaneamente, o que aumentava a latência de atualização e causava redundância de código e falhas de deploy.
- **Decisão**: Migrar 100% dos dados para o RTDB.
- **Resultado**: Redução da complexidade de build, latência menor para o usuário final e consistência total nos endpoints de API.

### 2.2 Camada de IA (Google Gemini)
- **Implementação**: Localizada no diretório `src/lib/gemini.ts`.
- **Fluxo**: Ao sincronizar produtos, o título e a descrição são enviados ao Gemini para sugerir a melhor categoria com base em uma taxonomia pré-definida.
- **Segurança**: As chaves de API são gerenciadas exclusivamente no servidor.

### 2.3 Proxy de Imagens e Dados
- **Problema**: Algumas requisições diretas de imagens ou dados de API podem sofrer com bloqueios de CORS ou rate limiting.
- **Solução**: Endpoint `/api/admin/proxy` para atuar como ponte segura.

## 3. Estrutura de Pastas
- `/src/app`: Rotas do Next.js (App Router).
- `/src/lib`: Lógica de infraestrutura (Firebase, Gemini, utilitários).
- `/src/components`: UI components reutilizáveis.
- `/data`: Arquivos JSON para seeding inicial e referências locais.

## 4. Segurança
- O painel administrativo é protegido por uma senha (`ADMIN_PASSWORD`).
- O acesso às APIs de escrita exige o mesmo segredo no header `Authorization`.

## 5. Fluxo de Deploy (CI/CD)
1. **Source**: GitHub.
2. **Build**: Netlify (Next.js Runtime).
3. **Trigger**: Git push na branch `main`.

---
**Última atualização: 30 de Março de 2026**
