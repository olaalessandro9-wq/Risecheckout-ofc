
# Fase 12: Services Layer Tests

## Objetivo
Implementar testes completos para os serviços `marketplace.ts` e `offers.ts`, garantindo cobertura de:
- Fetch de dados com sucesso
- Transformação de dados
- Tratamento de erros (API errors, network errors)
- Edge cases

## Análise dos Serviços

### marketplace.ts (207 linhas)
| Função | Responsabilidade | Complexidade |
|--------|------------------|--------------|
| `fetchMarketplaceProducts` | Busca produtos com filtros via publicApi | Média |
| `fetchProductDetails` | Busca detalhes de produto específico | Baixa |
| `fetchMarketplaceCategories` | Lista categorias do marketplace | Baixa |
| `trackProductView` | Incrementa views via RPC (silent fail) | Baixa |
| `trackProductClick` | Incrementa clicks via RPC (silent fail) | Baixa |
| `checkAffiliationStatus` | Verifica afiliação via api.call | Média |

### offers.ts (57 linhas)
| Função | Responsabilidade | Complexidade |
|--------|------------------|--------------|
| `fetchOffersByProduct` | Busca ofertas e normaliza dados | Média |

## Arquivos a Criar

```text
src/services/__tests__/
├── marketplace.test.ts  (~18 testes)
└── offers.test.ts       (~12 testes)
```

## Estrutura dos Testes

### 1. marketplace.test.ts (~18 testes)

```text
describe("Marketplace Service")
├── describe("fetchMarketplaceProducts")
│   ├── should fetch products with default filters
│   ├── should pass filters to API correctly
│   ├── should return empty array when no products
│   ├── should throw on API error
│   └── should throw on network error
│
├── describe("fetchProductDetails")
│   ├── should fetch product by ID
│   ├── should return null when product not found
│   └── should throw on API error
│
├── describe("fetchMarketplaceCategories")
│   ├── should fetch all categories
│   ├── should return empty array when no categories
│   └── should throw on API error
│
├── describe("trackProductView")
│   ├── should call increment RPC
│   └── should not throw on error (silent fail)
│
├── describe("trackProductClick")
│   ├── should call increment RPC
│   └── should not throw on error (silent fail)
│
└── describe("checkAffiliationStatus")
    ├── should return affiliate status when authenticated
    ├── should return isAffiliate: false on UNAUTHORIZED
    └── should return isAffiliate: false on error
```

### 2. offers.test.ts (~12 testes)

```text
describe("Offers Service")
└── describe("fetchOffersByProduct")
    ├── should fetch offers for product
    ├── should normalize offer data correctly
    ├── should convert price to number
    ├── should return empty array when no offers
    ├── should map product_name from name field
    ├── should preserve updated_at field
    ├── should throw on API error
    └── should handle null/undefined fields gracefully
```

## Handlers MSW Adicionais

### marketplace-handlers.ts

```typescript
// Mock data
export const mockMarketplaceProducts = [
  {
    id: "mp-prod-001",
    name: "Curso de Marketing",
    price: 19990,
    commission_rate: 30,
    status: "active",
    category_id: "cat-001",
    // ... demais campos
  },
];

export const mockMarketplaceCategories = [
  { id: "cat-001", name: "Marketing Digital", slug: "marketing-digital" },
  { id: "cat-002", name: "Desenvolvimento", slug: "desenvolvimento" },
];

// Handlers
export const marketplaceHandlers = [
  // marketplace-public
  http.post(`${API_URL}/marketplace-public`, async ({ request }) => {
    const body = await request.json();
    switch (body.action) {
      case "get-products": return products...
      case "get-product": return product...
      case "get-categories": return categories...
    }
  }),
  
  // get-affiliation-status
  http.post(`${API_URL}/get-affiliation-status`, async ({ request }) => {
    return affiliation status...
  }),
  
  // rpc-proxy (for tracking)
  http.post(`${API_URL}/rpc-proxy`, async ({ request }) => {
    return null (success)...
  }),
];
```

### offers-handlers.ts

```typescript
export const mockOffers = [
  {
    id: "offer-001",
    product_id: "prod-001",
    price: 9990,
    name: "Oferta Básica",
    updated_at: "2026-01-15T00:00:00Z",
  },
];

export const offersHandlers = [
  http.post(`${API_URL}/products-crud`, async ({ request }) => {
    const body = await request.json();
    if (body.action === "get-offers") {
      return offers...
    }
  }),
];
```

## Estratégia de Mock

| Dependência | Estratégia |
|-------------|------------|
| `publicApi.call` | MSW handlers para `marketplace-public` |
| `api.call` | MSW handlers para `get-affiliation-status`, `products-crud` |
| `incrementMarketplaceViewRpc` | MSW handlers para `rpc-proxy` |
| `incrementMarketplaceClickRpc` | MSW handlers para `rpc-proxy` |

## Validação RISE V3

| Critério | Status |
|----------|--------|
| Limite 300 linhas | marketplace.test.ts < 200, offers.test.ts < 150 |
| Zero `any` types | Tipagem completa com interfaces |
| Zero `@ts-expect-error` | Nenhum |
| Single Responsibility | 1 arquivo = 1 service testado |
| Manutenibilidade | Testes documentados, factories reutilizáveis |

## Entregáveis

1. `src/test/mocks/handlers/marketplace-handlers.ts` - Handlers MSW
2. `src/test/mocks/handlers/offers-handlers.ts` - Handlers MSW
3. Atualização de `src/test/mocks/handlers/index.ts` - Exports
4. `src/services/__tests__/marketplace.test.ts` - 18 testes
5. `src/services/__tests__/offers.test.ts` - 12 testes

**Total: ~30 novos testes**

## Impacto no Coverage

| Métrica | Antes | Depois |
|---------|-------|--------|
| Testes Totais | ~1076 | ~1106 |
| Coverage Estimado | 68% | 70% |
