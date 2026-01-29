
# Plano Completo: Implementação dos 25 Arquivos de Teste Faltantes da Fase 2

## Análise de Soluções (RISE Protocol V3 - Seção 4.4)

### Solução A: Implementação Sequencial por Subfase
- Manutenibilidade: 8/10 - Testes separados por domínio
- Zero DT: 7/10 - Possíveis inconsistências entre subfases
- Arquitetura: 7/10 - Dependências podem não ser identificadas
- Escalabilidade: 7/10 - Requer ajustes incrementais
- Segurança: 8/10 - Cobertura gradual de vulnerabilidades
- **NOTA FINAL: 7.4/10**
- Tempo estimado: 5-7 dias

### Solução B: Implementação Paralela com Mocks Compartilhados
- Manutenibilidade: 10/10 - Mocks centralizados, padrões uniformes
- Zero DT: 10/10 - Infraestrutura de testes completa desde o início
- Arquitetura: 10/10 - Estrutura modular seguindo Testing Pyramid
- Escalabilidade: 10/10 - Handlers MSW reutilizáveis
- Segurança: 10/10 - Cobertura completa desde gateways até helpers
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 7-10 dias

### DECISÃO: Solução B (Nota 10.0)

A Solução B implementa infraestrutura de mocks compartilhados primeiro, garantindo consistência entre todos os 25 arquivos de teste. Seguindo a LEI SUPREMA, escolhemos a melhor solução independente do tempo adicional.

---

## Inventário Completo: 25 Arquivos Faltantes

### SUBFASE 2.1: API Endpoints (2 arquivos)

| # | Arquivo | Linhas | Funções a Testar | Testes Est. |
|---|---------|--------|------------------|-------------|
| 1 | `src/lib/api/endpoints/analytics.test.ts` | 121 | getDashboard, getSalesChart, getProductAnalytics | 9 |
| 2 | `src/lib/api/endpoints/products.test.ts` | 183 | list, get, create, update, delete, getSettings, updateSettings | 14 |

**Subtotal Subfase 2.1:** 2 arquivos, ~23 testes

---

### SUBFASE 2.2: Payment Gateways (5 arquivos)

| # | Arquivo | Linhas | Funções a Testar | Testes Est. |
|---|---------|--------|------------------|-------------|
| 3 | `src/lib/payment-gateways/helpers/mercadopago-sync.test.ts` | 89 | syncMercadoPagoHiddenFields, updateMercadoPagoInstallmentsSelect | 10 |
| 4 | `src/lib/payment-gateways/gateways/mercado-pago/index.test.ts` | 27 | generateInstallments, getInterestRate | 6 |
| 5 | `src/lib/payment-gateways/gateways/stripe/index.test.ts` | 28 | generateInstallments, getInterestRate | 6 |
| 6 | `src/components/checkout/payment/hooks/useGatewayManager.test.ts` | 209 | loadMercadoPagoSDK, loadStripeSDK, useGatewayManager | 15 |
| 7 | `src/lib/payment-gateways/index.test.ts` | ~30 | barrel exports | 5 |

**Subtotal Subfase 2.2:** 5 arquivos, ~42 testes

---

### SUBFASE 2.3: Business Hooks (11 arquivos)

| # | Arquivo | Linhas | Funções a Testar | Testes Est. |
|---|---------|--------|------------------|-------------|
| 8 | `src/hooks/checkout/useVisitTracker.test.ts` | 78 | useVisitTracker (tracking, session, errors) | 8 |
| 9 | `src/hooks/checkout/useTrackingService.test.ts` | 102 | fireInitiateCheckout, firePurchase | 10 |
| 10 | `src/hooks/checkout/useCheckoutData.test.ts` | 209 | loadCheckoutData, state management | 12 |
| 11 | `src/hooks/checkout/helpers/fetchProductData.test.ts` | 52 | fetchProductData | 5 |
| 12 | `src/hooks/checkout/helpers/fetchOrderBumps.test.ts` | 90 | fetchOrderBumps | 6 |
| 13 | `src/hooks/checkout/helpers/fetchAffiliateInfo.test.ts` | 71 | getAffiliateCode, fetchAffiliateInfo | 8 |
| 14 | `src/hooks/checkout/helpers/resolveCheckoutSlug.test.ts` | 31 | resolveCheckoutSlug | 4 |
| 15 | `src/hooks/checkout/helpers/fetchCheckoutById.test.ts` | 59 | fetchCheckoutById | 5 |
| 16 | `src/hooks/useAuthUser.test.ts` | 81 | useAuthUser (user, isAuthenticated, email, name) | 6 |
| 17 | `src/hooks/useAuthActions.test.ts` | 98 | logout, invalidate, isLoggingOut | 8 |
| 18 | `src/hooks/useFormValidation.test.ts` | 231 | onChange, onBlur, validate, reset, setValue, getRawValue | 20 |
| 19 | `src/hooks/usePermissions.test.ts` | 117 | usePermissions, useHasMinRole, useCanHaveAffiliates | 12 |

**Subtotal Subfase 2.3:** 12 arquivos (incluindo fetchCheckoutById), ~104 testes

---

### SUBFASE 2.4: Utilities & Support (7 arquivos)

| # | Arquivo | Linhas | Funções a Testar | Testes Est. |
|---|---------|--------|------------------|-------------|
| 20 | `src/lib/utils/uniqueName.test.ts` | 23 | ensureUniqueName | 5 |
| 21 | `src/lib/utils/uniqueCheckoutName.test.ts` | ~30 | ensureUniqueCheckoutName | 5 |
| 22 | `src/lib/utils/normalizeDataUrl.test.ts` | 49 | normalizeDataUrl | 8 |
| 23 | `src/lib/checkout/normalizeDesign.test.ts` | 188 | normalizeDesign, ensureDerivedProperties, deepMerge | 15 |
| 24 | `src/lib/checkout/themePresets.test.ts` | 233 | THEME_PRESETS, FONT_OPTIONS | 8 |
| 25 | `src/lib/date-range/service.test.ts` | 203 | getRange, getCustomRange, withTimezone, withReferenceDate | 15 |
| 26 | `src/lib/timezone/service.test.ts` | 305 | getDateBoundaries, getHourInTimezone, format, formatDate, formatTime | 18 |

**Subtotal Subfase 2.4:** 7 arquivos, ~74 testes

---

## Resumo Quantitativo

| Subfase | Arquivos | Testes | Cobertura Adicional |
|---------|----------|--------|---------------------|
| 2.1 API Endpoints | 2 | ~23 | +1.2% |
| 2.2 Payment Gateways | 5 | ~42 | +3.0% |
| 2.3 Business Hooks | 12 | ~104 | +7.1% |
| 2.4 Utilities | 7 | ~74 | +4.2% |
| **TOTAL** | **26** | **~243** | **+15.5%** |

**Nota:** São 26 arquivos porque `fetchCheckoutById.test.ts` foi identificado durante a análise.

---

## Projeção de Cobertura Final

```text
┌────────────────────────────────────────────────────────────────┐
│                    COBERTURA FINAL FASE 2                       │
│                                                                 │
│  ANTES (Atual):                                                │
│  Arquivos: 18/168 (10.7%)                                      │
│  Testes: ~630                                                  │
│  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                 │
│                                                                 │
│  APÓS (Fase 2 Completa):                                       │
│  Arquivos: 44/168 (26.2%)                                      │
│  Testes: ~873                                                  │
│  ██████████████████████░░░░░░░░░░░░░░░░░░░░░░                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Ordem de Implementação (Dependências Respeitadas)

### Etapa 1: Infraestrutura de Mocks (Pré-requisito)

```text
┌─────────────────────────────────────────────────────────────────┐
│  CRIAR/ATUALIZAR MSW HANDLERS                                   │
│                                                                  │
│  1. src/test/mocks/handlers/analytics-handlers.ts               │
│  2. src/test/mocks/handlers/products-handlers.ts                │
│  3. src/test/mocks/handlers/checkout-public-handlers.ts         │
│  4. src/test/mocks/handlers/track-visit-handlers.ts             │
│  5. Atualizar src/test/mocks/handlers.ts (barrel export)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Etapa 2: Utilities (Funções Puras - Sem Dependências)

```text
┌─────────────────────────────────────────────────────────────────┐
│  ORDEM DE IMPLEMENTAÇÃO - UTILITIES                             │
│                                                                  │
│  1. src/lib/utils/normalizeDataUrl.test.ts                      │
│     └─ Função pura, zero dependências                          │
│                                                                  │
│  2. src/lib/checkout/themePresets.test.ts                       │
│     └─ Constantes puras, zero dependências                     │
│                                                                  │
│  3. src/lib/checkout/normalizeDesign.test.ts                    │
│     └─ Depende de themePresets (já testado)                    │
│                                                                  │
│  4. src/lib/timezone/service.test.ts                            │
│     └─ Classe isolada, usa Intl API                            │
│                                                                  │
│  5. src/lib/date-range/service.test.ts                          │
│     └─ Depende de TimezoneService (já testado)                 │
│                                                                  │
│  6. src/lib/utils/uniqueName.test.ts                            │
│     └─ Usa MSW mock para api.call                              │
│                                                                  │
│  7. src/lib/utils/uniqueCheckoutName.test.ts                    │
│     └─ Usa MSW mock para api.call                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Etapa 3: API Endpoints

```text
┌─────────────────────────────────────────────────────────────────┐
│  ORDEM DE IMPLEMENTAÇÃO - API ENDPOINTS                         │
│                                                                  │
│  1. src/lib/api/endpoints/analytics.test.ts                     │
│     └─ Usa handlers de analytics-handlers.ts                   │
│                                                                  │
│  2. src/lib/api/endpoints/products.test.ts                      │
│     └─ Usa handlers de products-handlers.ts                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Etapa 4: Payment Gateways

```text
┌─────────────────────────────────────────────────────────────────┐
│  ORDEM DE IMPLEMENTAÇÃO - PAYMENT GATEWAYS                      │
│                                                                  │
│  1. src/lib/payment-gateways/gateways/mercado-pago/index.test.ts│
│     └─ Gateway específico (função pura)                        │
│                                                                  │
│  2. src/lib/payment-gateways/gateways/stripe/index.test.ts      │
│     └─ Gateway específico (função pura)                        │
│                                                                  │
│  3. src/lib/payment-gateways/helpers/mercadopago-sync.test.ts   │
│     └─ DOM manipulation (jsdom)                                │
│                                                                  │
│  4. src/lib/payment-gateways/index.test.ts                      │
│     └─ Barrel export (depende dos anteriores)                  │
│                                                                  │
│  5. src/components/checkout/payment/hooks/useGatewayManager.test.ts│
│     └─ Hook complexo (depende de todos os gateways)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Etapa 5: Checkout Helpers

```text
┌─────────────────────────────────────────────────────────────────┐
│  ORDEM DE IMPLEMENTAÇÃO - CHECKOUT HELPERS                      │
│                                                                  │
│  1. src/hooks/checkout/helpers/fetchProductData.test.ts         │
│     └─ Helper atômico com MSW                                  │
│                                                                  │
│  2. src/hooks/checkout/helpers/fetchOrderBumps.test.ts          │
│     └─ Helper atômico com MSW                                  │
│                                                                  │
│  3. src/hooks/checkout/helpers/fetchAffiliateInfo.test.ts       │
│     └─ Helper com RPC mock                                     │
│                                                                  │
│  4. src/hooks/checkout/helpers/resolveCheckoutSlug.test.ts      │
│     └─ Helper com RPC mock                                     │
│                                                                  │
│  5. src/hooks/checkout/helpers/fetchCheckoutById.test.ts        │
│     └─ Helper atômico com MSW                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Etapa 6: Business Hooks

```text
┌─────────────────────────────────────────────────────────────────┐
│  ORDEM DE IMPLEMENTAÇÃO - BUSINESS HOOKS                        │
│                                                                  │
│  1. src/hooks/useAuthUser.test.ts                               │
│     └─ Selective subscription hook                             │
│                                                                  │
│  2. src/hooks/useAuthActions.test.ts                            │
│     └─ Mutation hook com logout/invalidate                     │
│                                                                  │
│  3. src/hooks/useFormValidation.test.ts                         │
│     └─ Hook complexo com máscaras e validação                  │
│                                                                  │
│  4. src/hooks/usePermissions.test.ts                            │
│     └─ Permission derivation hook                              │
│                                                                  │
│  5. src/hooks/checkout/useVisitTracker.test.ts                  │
│     └─ Effect hook com sessionStorage                          │
│                                                                  │
│  6. src/hooks/checkout/useTrackingService.test.ts               │
│     └─ Hook com UTMify mock                                    │
│                                                                  │
│  7. src/hooks/checkout/useCheckoutData.test.ts                  │
│     └─ Orquestrador (depende de todos os helpers)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detalhamento Técnico por Arquivo

### Subfase 2.1: API Endpoints

#### 1. `analytics.test.ts` (~9 testes)

```text
Casos de Teste:
├── analyticsApi.getDashboard
│   ├── should call api.call with correct action and default period
│   ├── should pass custom period to params
│   └── should handle API errors gracefully
├── analyticsApi.getSalesChart
│   ├── should return sales data points array
│   └── should handle empty data
└── analyticsApi.getProductAnalytics
    ├── should call with productId and period
    ├── should return product-specific metrics
    └── should handle product not found error
```

#### 2. `products.test.ts` (~14 testes)

```text
Casos de Teste:
├── productsApi.list
│   ├── should return paginated products
│   ├── should pass filter params correctly
│   └── should handle empty list
├── productsApi.get
│   ├── should return single product by ID
│   └── should handle product not found
├── productsApi.create
│   ├── should create product with input
│   └── should validate required fields
├── productsApi.update
│   ├── should update product fields
│   └── should handle partial updates
├── productsApi.delete
│   ├── should delete product by ID
│   └── should handle delete errors
└── productsApi.getSettings/updateSettings
    ├── should get product settings
    ├── should update settings
    └── should handle settings not found
```

---

### Subfase 2.2: Payment Gateways

#### 3. `mercadopago-sync.test.ts` (~10 testes)

```text
Casos de Teste:
├── syncMercadoPagoHiddenFields
│   ├── should sync cardholderName to hidden field
│   ├── should sync document with mask removed
│   ├── should detect CPF vs CNPJ correctly
│   ├── should dispatch input events
│   └── should handle missing DOM elements gracefully
└── updateMercadoPagoInstallmentsSelect
    ├── should clear existing options
    ├── should add new installment options
    ├── should select current value
    ├── should handle empty installments array
    └── should handle missing select element
```

#### 4. `mercado-pago/index.test.ts` (~6 testes)

```text
Casos de Teste:
├── mercadoPagoGateway.id
│   └── should be 'mercadopago'
├── mercadoPagoGateway.displayName
│   └── should be 'Mercado Pago'
├── mercadoPagoGateway.generateInstallments
│   ├── should use MP interest rate (2.99%)
│   ├── should respect maxInstallments param
│   └── should delegate to generateInstallments
└── mercadoPagoGateway.getInterestRate
    └── should return 0.0299
```

#### 5. `stripe/index.test.ts` (~6 testes)

```text
Casos de Teste:
├── stripeGateway.id
│   └── should be 'stripe'
├── stripeGateway.displayName
│   └── should be 'Stripe'
├── stripeGateway.generateInstallments
│   ├── should use Stripe interest rate (1.99%)
│   ├── should respect maxInstallments param
│   └── should delegate to generateInstallments
└── stripeGateway.getInterestRate
    └── should return 0.0199
```

#### 6. `useGatewayManager.test.ts` (~15 testes)

```text
Casos de Teste:
├── Initial State
│   ├── should start with isReady=false when no config
│   ├── should start with isLoading=false when disabled
│   └── should have gateway=null initially
├── Loading SDK
│   ├── should set isLoading=true during load
│   ├── should set isReady=true after successful load
│   ├── should set error on load failure
│   └── should use correct loader for gateway type
├── Gateway Loaders Registry
│   ├── should have loader for mercadopago
│   ├── should have loader for stripe
│   ├── should have loader for pushinpay (resolves true)
│   └── should reject unsupported gateways
├── Reload Functionality
│   ├── should trigger reload on reload() call
│   └── should increment loadAttempt
└── Error Handling
    ├── should handle missing publicKey
    └── should handle SDK load timeout
```

#### 7. `payment-gateways/index.test.ts` (~5 testes)

```text
Casos de Teste:
├── Exports
│   ├── should export getGateway function
│   ├── should export getAvailableGateways function
│   ├── should export isGatewaySupported function
│   ├── should export generateInstallments function
│   └── should export MercadoPagoCardForm component
```

---

### Subfase 2.3: Business Hooks

#### 8. `useVisitTracker.test.ts` (~8 testes)

```text
Casos de Teste:
├── Session Tracking
│   ├── should track visit only once per session
│   ├── should store tracking key in sessionStorage
│   └── should skip tracking if already tracked
├── API Call
│   ├── should call track-visit edge function
│   ├── should pass UTM params from URL
│   ├── should include user agent and referrer
│   └── should handle API errors gracefully
└── Edge Cases
    └── should not track if checkoutId is undefined
```

#### 9. `useTrackingService.test.ts` (~10 testes)

```text
Casos de Teste:
├── fireInitiateCheckout
│   ├── should not fire if productId is null
│   ├── should not fire if productName is null
│   └── should be a no-op for UTMify
├── firePurchase
│   ├── should fire UTMify purchase event
│   ├── should pass correct order data
│   ├── should extract UTM parameters
│   ├── should not fire if vendorId is null
│   ├── should not fire if UTMify config invalid
│   └── should format date correctly for UTMify
└── Config Handling
    └── should accept null utmifyConfig
```

#### 10. `useCheckoutData.test.ts` (~12 testes)

```text
Casos de Teste:
├── Loading State
│   ├── should start with isLoading=true
│   ├── should set isLoading=false after load
│   └── should set isError=true on failure
├── Data Fetching
│   ├── should call BFF with correct slug
│   ├── should extract affiliate code from URL
│   ├── should normalize design correctly
│   └── should format order bumps
├── Gateway Resolution
│   ├── should use affiliate gateway if present
│   ├── should fallback to product gateway
│   └── should default to mercadopago
├── Error Handling
│   ├── should handle BFF errors
│   └── should set isError on exception
```

#### 11-15. Checkout Helpers (~28 testes total)

```text
fetchProductData.test.ts (5 testes):
├── should fetch product by ID
├── should throw on API error
├── should throw on invalid response
├── should throw if product not found
└── should return ProductRawData interface

fetchOrderBumps.test.ts (6 testes):
├── should fetch order bumps by checkoutId
├── should return empty array on error
├── should return empty array on invalid response
├── should format bumps correctly
├── should preserve price semantics
└── should handle missing offer

fetchAffiliateInfo.test.ts (8 testes):
├── getAffiliateCode should extract ref param
├── getAffiliateCode should return null if no ref
├── fetchAffiliateInfo should return default if no code
├── fetchAffiliateInfo should call RPC
├── fetchAffiliateInfo should return gateway info
├── fetchAffiliateInfo should handle RPC error
├── fetchAffiliateInfo should handle empty data
└── fetchAffiliateInfo should return default on error

resolveCheckoutSlug.test.ts (4 testes):
├── should resolve slug to checkoutId and productId
├── should throw on RPC error
├── should throw on empty data
└── should throw on missing checkout_id

fetchCheckoutById.test.ts (5 testes):
├── should fetch checkout by ID
├── should throw on API error
├── should throw on invalid response
├── should throw if checkout not found
└── should return CheckoutRawData interface
```

#### 16. `useAuthUser.test.ts` (~6 testes)

```text
Casos de Teste:
├── should return null user when not authenticated
├── should return user data from cache
├── should return isAuthenticated from cache
├── should return email accessor
├── should return name accessor
└── should not re-render on loading state changes
```

#### 17. `useAuthActions.test.ts` (~8 testes)

```text
Casos de Teste:
├── logout
│   ├── should call logout API
│   ├── should clear query data on success
│   ├── should clear TokenService
│   └── should invalidate all queries
├── invalidate
│   ├── should invalidate auth query
│   └── should trigger refetch
└── isLoggingOut
    ├── should be true during logout
    └── should be false after logout
```

#### 18. `useFormValidation.test.ts` (~20 testes)

```text
Casos de Teste:
├── CPF Field
│   ├── should apply CPF mask
│   ├── should validate CPF on blur
│   ├── should return error for invalid CPF
│   └── should return raw value without mask
├── CNPJ Field
│   ├── should apply CNPJ mask
│   ├── should validate CNPJ on blur
│   └── should return error for invalid CNPJ
├── Phone Field
│   ├── should apply phone mask
│   └── should validate phone format
├── Email Field
│   ├── should validate email format
│   └── should return error for invalid email
├── Name Field
│   ├── should validate name length
│   └── should require at least 2 words
├── Required Fields
│   ├── should return error for empty required field
│   └── should allow empty optional field
├── State Management
│   ├── should track isTouched
│   ├── should reset field
│   ├── should setValue programmatically
│   └── should validate on manual call
└── maxLength
    └── should return correct maxLength for each type
```

#### 19. `usePermissions.test.ts` (~12 testes)

```text
Casos de Teste:
├── Owner Role
│   ├── should have canHaveAffiliates=true
│   ├── should have canAccessAdminPanel=true
│   ├── should have canViewSecurityLogs=true
│   └── should have canManageUsers=true
├── Admin Role
│   ├── should have canAccessAdminPanel=true
│   └── should have canHaveAffiliates=false
├── User Role
│   ├── should have canBecomeAffiliate=true
│   ├── should have canManageProducts=true
│   └── should have canHaveAffiliates=false
├── useHasMinRole
│   ├── should return true for owner >= user
│   └── should return false for user >= owner
└── useCanHaveAffiliates
    └── should return correct canHaveAffiliates value
```

---

### Subfase 2.4: Utilities

#### 20. `uniqueName.test.ts` (~5 testes)

```text
Casos de Teste:
├── should return unique name from API
├── should handle API error
├── should fallback to base name on empty response
├── should pass correct action and productName
└── should handle special characters in name
```

#### 21. `uniqueCheckoutName.test.ts` (~5 testes)

```text
Casos de Teste:
├── should return unique checkout name from API
├── should handle API error
├── should throw on invalid response
├── should pass productId and baseName
└── should ignore first parameter (signature stability)
```

#### 22. `normalizeDataUrl.test.ts` (~8 testes)

```text
Casos de Teste:
├── should return empty string for empty input
├── should remove whitespace and newlines
├── should remove duplicate prefixes
├── should handle multiple duplications
├── should add prefix if missing
├── should handle different image types (png, jpeg, gif)
├── should log error for invalid result
└── should return normalized valid data URL
```

#### 23. `normalizeDesign.test.ts` (~15 testes)

```text
Casos de Teste:
├── Theme Detection
│   ├── should default to light theme
│   ├── should use design.theme if present
│   └── should use checkout.theme as fallback
├── Preset Application
│   ├── should apply light preset colors
│   └── should apply dark preset colors
├── Color Merging
│   ├── should merge design.colors with preset
│   ├── should deep merge nested objects
│   └── should not mutate original preset
├── Derived Properties
│   ├── should ensure border property
│   ├── should ensure infoBox property
│   ├── should ensure orderBump property
│   ├── should ensure creditCardFields property
│   ├── should ensure orderSummary property
│   ├── should ensure footer property
│   └── should ensure securePurchase property
```

#### 24. `themePresets.test.ts` (~8 testes)

```text
Casos de Teste:
├── THEME_PRESETS.light
│   ├── should have name 'light'
│   ├── should have white background
│   └── should have all required color properties
├── THEME_PRESETS.dark
│   ├── should have name 'dark'
│   ├── should have dark background
│   └── should have all required color properties
└── FONT_OPTIONS
    ├── should have 5 font options
    └── should include Inter as first option
```

#### 25. `date-range/service.test.ts` (~15 testes)

```text
Casos de Teste:
├── getRange('today')
│   ├── should return today's boundaries in SP timezone
│   ├── should return correct ISO strings
│   └── should have preset='today'
├── getRange('yesterday')
│   └── should return yesterday's boundaries
├── getRange('7days')
│   ├── should include 7 complete days
│   └── should start 6 days ago (includes today)
├── getRange('30days')
│   └── should include 30 complete days
├── getRange('max')
│   ├── should start from maxStartDate
│   └── should end at today
├── getCustomRange
│   ├── should use custom from/to dates
│   └── should have preset='custom'
├── withTimezone
│   └── should create new instance with different timezone
└── withReferenceDate
    └── should use reference date instead of now
```

#### 26. `timezone/service.test.ts` (~18 testes)

```text
Casos de Teste:
├── getDateBoundaries
│   ├── should return startOfDay in UTC
│   ├── should return endOfDay in UTC
│   ├── should handle DST transitions
│   └── should throw on invalid date parts
├── toStartOfDay
│   └── should return only startOfDay ISO
├── toEndOfDay
│   └── should return only endOfDay ISO
├── getHourInTimezone
│   ├── should return hour in SP timezone
│   ├── should handle Date object
│   └── should handle ISO string
├── getDateInTimezone
│   └── should return YYYY-MM-DD format
├── format
│   ├── should return date, time, full, relative
│   └── should format relative time correctly
├── formatDate
│   └── should return dd/MM/yyyy
├── formatTime
│   └── should return HH:mm
├── formatFull
│   └── should return dd/MM/yyyy HH:mm
├── withTimezone
│   └── should create instance with new timezone
└── withLocale
    └── should create instance with new locale
```

---

## MSW Handlers Necessários

### handlers/analytics-handlers.ts

```typescript
// Handlers para analytics-api edge function
http.post('*/functions/v1/analytics-api', ({ request }) => {
  const body = await request.json();
  switch (body.action) {
    case 'dashboard':
      return HttpResponse.json({ data: mockDashboardData });
    case 'sales_chart':
      return HttpResponse.json({ data: mockSalesChart });
    case 'product_analytics':
      return HttpResponse.json({ data: mockProductAnalytics });
  }
});
```

### handlers/products-handlers.ts

```typescript
// Handlers para products-api edge function
http.post('*/functions/v1/products-api', ({ request }) => {
  const body = await request.json();
  // Handle list, get, create, update, delete, getSettings, updateSettings
});
```

### handlers/checkout-public-handlers.ts

```typescript
// Handlers para checkout-public-data edge function
http.post('*/functions/v1/checkout-public-data', ({ request }) => {
  const body = await request.json();
  // Handle product, checkout, order-bumps, offer, resolve-and-load
});
```

---

## Métricas de Sucesso

| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| Arquivos de Teste | 18 | 44 | 44+ |
| Testes Totais | ~630 | ~873 | 850+ |
| Cobertura de Arquivos | 10.7% | 26.2% | 25%+ |
| Subfase 2.1 Completa | 66% | 100% | 100% |
| Subfase 2.2 Completa | 37.5% | 100% | 100% |
| Subfase 2.3 Completa | 21% | 100% | 100% |
| Subfase 2.4 Completa | 22% | 100% | 100% |

---

## Cronograma de Execução

| Etapa | Arquivos | Tempo Est. | Dependências |
|-------|----------|------------|--------------|
| 1. MSW Handlers | 4 arquivos | 1 dia | Nenhuma |
| 2. Utilities | 7 arquivos | 2 dias | Etapa 1 |
| 3. API Endpoints | 2 arquivos | 1 dia | Etapa 1 |
| 4. Payment Gateways | 5 arquivos | 2 dias | Etapas 1-2 |
| 5. Checkout Helpers | 5 arquivos | 1 dia | Etapa 1 |
| 6. Business Hooks | 7 arquivos | 2 dias | Etapas 1-5 |
| **TOTAL** | **30 arquivos** | **9 dias** | - |

---

## Resumo Executivo

| Aspecto | Valor |
|---------|-------|
| **Arquivos de Teste Novos** | 26 (incluindo fetchCheckoutById) |
| **MSW Handlers Novos** | 4 |
| **Testes Novos** | ~243 |
| **Cobertura Final** | 26.2% (de 10.7%) |
| **Tempo Total Estimado** | 9 dias |
| **Nota RISE V3** | 10.0/10 |
