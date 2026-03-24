---
description: WORKFLOW: CRIAÇÃO E ATUALIZAÇÃO DO SITE DE AFILIADOS
---

ETAPA 1 — DEFINIÇÃO DE CATEGORIAS
- Criar estrutura base de categorias:
  ["eletronicos", "casa", "moda", "esportes", "beleza", "automotivo"]

ETAPA 2 — COLETA DE PRODUTOS
Para cada categoria:
- Fazer requisição:
  GET https://api.mercadolibre.com/sites/MLB/search?q={categoria}

- Extrair:
  - id
  - title
  - price
  - thumbnail
  - permalink
  - sold_quantity
  - rating

ETAPA 3 — FILTRAGEM
- Ordenar por:
  - sold_quantity DESC
  - rating DESC
- Remover produtos irrelevantes ou com baixa qualidade

ETAPA 4 — LINK DE AFILIADO
- Para cada produto:
  - pegar permalink
  - aplicar tracking de afiliado
  - gerar link final monetizado

ETAPA 5 — ARMAZENAMENTO
- Salvar produtos em cache (JSON ou banco)
- Definir TTL de 30 minutos

ETAPA 6 — GERAÇÃO DO FRONTEND
Para cada categoria:
- Criar página com grid de produtos
- Cada item deve conter:
  - imagem
  - título
  - preço
  - botão "Comprar"

ETAPA 7 — NAVEGAÇÃO
- Criar menu com abas:
  - Home
  - Categorias

ETAPA 8 — ATUALIZAÇÃO AUTOMÁTICA
- A cada 30 minutos:
  - Reexecutar coleta
  - Atualizar cache
  - Atualizar frontend

ETAPA 9 — OTIMIZAÇÃO
- Implementar lazy loading de imagens
- Evitar requisições duplicadas
- Compressão de dados

ETAPA 10 — EXPANSÃO FUTURA
- Suporte para:
  - página de ofertas
  - ranking de produtos
  - comparação de preços