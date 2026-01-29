
# Plano Fase 3: Expansão Avançada de Testes Automatizados

## Status Atual do Projeto

### Inventário Completo de Arquivos de Teste

| Categoria | Arquivos de Teste | Quantidade |
|-----------|-------------------|------------|
| **Infraestrutura** | `src/test/infrastructure.test.ts` | 1 |
| **API Layer** | `client.test.ts`, `errors.test.ts`, `public-client.test.ts`, `types.test.ts`, `analytics.test.ts`, `products.test.ts` | 6 |
| **Hooks Core** | `useAuthUser.test.ts`, `useAuthActions.test.ts`, `useCheckoutState.test.ts`, `usePermissions.test.ts`, `useUnifiedAuth.test.ts` | 5 |
| **Hooks Form** | `__tests__/useFormValidation.*.test.ts` (7 arquivos modulares) | 7 |
| **Hooks Checkout** | `useCheckoutData.test.ts`, `useCheckoutSubmit.test.ts`, `useCouponValidation.test.ts`, `useFormManager.test.ts`, `useTrackingService.test.ts`, `useVisitTracker.test.ts` | 6 |
| **Checkout Helpers** | `fetchAffiliateInfo.test.ts`, `fetchCheckoutById.test.ts`, `fetchOrderBumps.test.ts`, `fetchProductData.test.ts`, `resolveCheckoutSlug.test.ts` | 5 |
| **Payment Gateways** | `gateway-factory.test.ts`, `index.test.ts`, `installments.test.ts`, `mercado-pago/index.test.ts`, `stripe/index.test.ts`, `mercadopago-sync.test.ts`, `useGatewayManager.test.ts` | 7 |
| **Lib/Utils** | `money.test.ts`, `validation.test.ts`, `logger.test.ts`, `generateSlug.test.ts`, `normalizeDataUrl.test.ts`, `uniqueCheckoutName.test.ts`, `uniqueName.test.ts` | 7 |
| **Checkout Design** | `normalizeDesign.test.ts`, `themePresets.test.ts` | 2 |
| **Services** | `date-range/service.test.ts`, `timezone/service.test.ts`, `session-commander/retry-strategy.test.ts` | 3 |
| **E2E (Playwright)** | 9 specs + 1 spec avulso | 10 |
| **TOTAL SRC** | | **~50 arquivos** |

### Cálculo de Cobertura Atual

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COBERTURA ATUAL DO PROJETO                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ARQUIVOS FONTE (estimativa baseada em listagem):                           │
│  ├── src/lib/              ~45 arquivos                                     │
│  ├── src/hooks/            ~40 arquivos                                     │
│  ├── src/components/       ~200 arquivos                                    │
│  ├── src/modules/          ~150 arquivos                                    │
│  ├── src/features/         ~15 arquivos                                     │
│  ├── src/services/         ~2 arquivos                                      │
│  ├── src/contexts/         ~2 arquivos                                      │
│  ├── src/providers/        ~3 arquivos                                      │
│  ├── src/schemas/          ~1 arquivo                                       │
│  └── src/pages/            ~20 arquivos                                     │
│  TOTAL ESTIMADO:           ~478 arquivos fonte                              │
│                                                                              │
│  ARQUIVOS COM TESTES:      ~50 arquivos                                     │
│                                                                              │
│  COBERTURA DE ARQUIVOS:    ~10.5%                                           │
│                                                                              │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  10.5%            │
│                                                                              │
│  TESTES TOTAIS:            ~930 (incluindo Fase 2)                          │
│  META RISE V3:             70%+ cobertura                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Análise de Soluções (RISE V3 - Seção 4.4)

### Solução A: Foco em Componentes UI (React Testing Library)
- Manutenibilidade: 8/10 - Componentes bem testados, mas UI muda frequentemente
- Zero DT: 7/10 - Testes frágeis a mudanças de design
- Arquitetura: 7/10 - Não cobre lógica crítica de negócio
- Escalabilidade: 7/10 - Cada novo componente precisa de teste
- Segurança: 6/10 - Não testa validações de backend
- **NOTA FINAL: 7.0/10**
- Tempo estimado: 2-3 semanas

### Solução B: Foco em XState Machines + Módulos Core
- Manutenibilidade: 10/10 - Máquinas de estado são imutáveis e previsíveis
- Zero DT: 10/10 - Testa transições de estado, não UI
- Arquitetura: 10/10 - Segue SSOT do RISE V3
- Escalabilidade: 10/10 - Máquinas são auto-documentadas
- Segurança: 9/10 - Testa guards e validações críticas
- **NOTA FINAL: 9.8/10**
- Tempo estimado: 3-4 semanas

### Solução C: Híbrida - XState + Módulos + Componentes Críticos
- Manutenibilidade: 10/10 - Cobre toda a pirâmide
- Zero DT: 10/10 - Testes de estado + integração
- Arquitetura: 10/10 - Segue Testing Pyramid Enterprise
- Escalabilidade: 10/10 - Modelo replicável para novos módulos
- Segurança: 10/10 - Testa desde guards até rendering
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 4-5 semanas

### DECISÃO: Solução C (Nota 10.0)

A Solução C implementa uma abordagem de Pirâmide de Testes completa, priorizando:
1. **XState Machines** (SSOT do projeto) - Máxima prioridade
2. **Módulos Core** (checkout-public, products, dashboard) - Segunda prioridade
3. **Componentes Críticos** (checkout forms, payment) - Terceira prioridade

---

## Fase 3: Inventário de Arquivos Pendentes

### SUBFASE 3.1: XState Machines (Alta Prioridade - SSOT)

| # | Arquivo | Módulo | Funções a Testar | Testes Est. |
|---|---------|--------|------------------|-------------|
| 1 | `src/modules/checkout-public/machines/checkoutPublicMachine.test.ts` | checkout-public | states, transitions, guards, actions | 25 |
| 2 | `src/modules/products/machines/productFormMachine.test.ts` | products | states, transitions, actors | 20 |
| 3 | `src/modules/dashboard/machines/dateRangeMachine.test.ts` | dashboard | date selection, presets | 12 |
| 4 | `src/modules/utmify/machines/*.test.ts` | utmify | config, validation | 10 |
| 5 | `src/modules/financeiro/machines/*.test.ts` | financeiro | balance, transactions | 12 |
| 6 | `src/modules/affiliation/machines/*.test.ts` | affiliation | requests, status | 10 |
| 7 | `src/modules/webhooks/machines/*.test.ts` | webhooks | config, delivery | 10 |
| 8 | `src/modules/pixels/machines/*.test.ts` | pixels | tracking config | 8 |
| 9 | `src/modules/admin/machines/*.test.ts` | admin | user management | 12 |
| 10 | `src/lib/token-manager/machine.test.ts` | auth | refresh, cross-tab | 15 |

**Subtotal Subfase 3.1:** 10 arquivos, ~134 testes

---

### SUBFASE 3.2: Módulos Core - Hooks & Services

| # | Arquivo | Módulo | Funções a Testar | Testes Est. |
|---|---------|--------|------------------|-------------|
| 11 | `src/modules/checkout-public/hooks/useCheckoutPublicMachine.test.ts` | checkout-public | hook integration | 10 |
| 12 | `src/modules/checkout-public/adapters/*.test.ts` | checkout-public | data transformation | 8 |
| 13 | `src/modules/checkout-public/mappers/*.test.ts` | checkout-public | DTO mapping | 8 |
| 14 | `src/modules/dashboard/hooks/*.test.ts` | dashboard | analytics hooks | 12 |
| 15 | `src/modules/dashboard/utils/*.test.ts` | dashboard | chart formatters | 8 |
| 16 | `src/modules/members-area/services/*.test.ts` | members-area | content delivery | 10 |
| 17 | `src/modules/members-area/hooks/*.test.ts` | members-area | lesson progress | 10 |
| 18 | `src/modules/members-area/utils/*.test.ts` | members-area | formatting | 6 |

**Subtotal Subfase 3.2:** 8 arquivos, ~72 testes

---

### SUBFASE 3.3: Lib Avançado (Pendentes)

| # | Arquivo | Funções a Testar | Testes Est. |
|---|---------|------------------|-------------|
| 19 | `src/lib/token-manager/service.test.ts` | TokenService class | 15 |
| 20 | `src/lib/token-manager/persistence.test.ts` | storage, recovery | 10 |
| 21 | `src/lib/token-manager/heartbeat.test.ts` | keep-alive, timeout | 8 |
| 22 | `src/lib/token-manager/cross-tab-lock.test.ts` | BroadcastChannel | 8 |
| 23 | `src/lib/rpc/rpcProxy.test.ts` | RPC calls | 10 |
| 24 | `src/lib/storage/storageProxy.test.ts` | Storage operations | 8 |
| 25 | `src/lib/order-status/service.test.ts` | status transitions | 10 |
| 26 | `src/lib/products/deleteProduct.test.ts` | cascading delete | 6 |
| 27 | `src/lib/products/duplicateProduct.test.ts` | deep clone | 6 |
| 28 | `src/lib/checkouts/cloneCheckoutDeep.test.ts` | checkout duplication | 8 |
| 29 | `src/lib/checkouts/duplicateCheckout.test.ts` | with relations | 8 |
| 30 | `src/lib/checkout/cloneCustomization.test.ts` | design clone | 6 |
| 31 | `src/lib/links/attachOfferToCheckoutSmart.test.ts` | offer linking | 8 |
| 32 | `src/lib/orderBump/fetchCandidates.test.ts` | candidate selection | 8 |
| 33 | `src/lib/security.test.ts` | XSS protection | 10 |
| 34 | `src/lib/uploadUtils.test.ts` | file validation | 8 |
| 35 | `src/lib/utils.test.ts` | general utilities | 10 |
| 36 | `src/lib/utmify-helper.test.ts` | UTM parsing | 8 |
| 37 | `src/lib/lazyWithRetry.test.ts` | lazy loading | 6 |

**Subtotal Subfase 3.3:** 19 arquivos, ~161 testes

---

### SUBFASE 3.4: Contextos e Providers

| # | Arquivo | Funções a Testar | Testes Est. |
|---|---------|------------------|-------------|
| 38 | `src/contexts/CheckoutContext.test.tsx` | context state | 10 |
| 39 | `src/contexts/UltrawidePerformanceContext.test.tsx` | performance hooks | 6 |
| 40 | `src/providers/NavigationGuardProvider.test.tsx` | route protection | 8 |
| 41 | `src/providers/UnsavedChangesGuard.test.tsx` | dirty form detection | 8 |
| 42 | `src/providers/theme.test.tsx` | theme switching | 6 |

**Subtotal Subfase 3.4:** 5 arquivos, ~38 testes

---

### SUBFASE 3.5: Componentes Críticos (React Testing Library)

| # | Arquivo | Componente | Testes Est. |
|---|---------|------------|-------------|
| 43 | `src/components/checkout/CouponField.test.tsx` | Coupon validation | 10 |
| 44 | `src/components/checkout/SecurityBadges.test.tsx` | Trust indicators | 5 |
| 45 | `src/components/checkout/TurnstileWidget.test.tsx` | Bot protection | 6 |
| 46 | `src/components/checkout/OrderBumpList.test.tsx` | Order bump selection | 10 |
| 47 | `src/components/checkout/payment/CreditCardForm.test.tsx` | Card form | 15 |
| 48 | `src/components/checkout/payment/GatewayCardForm.test.tsx` | Gateway routing | 10 |
| 49 | `src/components/auth/*.test.tsx` | Login/Register forms | 12 |
| 50 | `src/components/guards/*.test.tsx` | Route protection | 8 |
| 51 | `src/components/AppErrorBoundary.test.tsx` | Error handling | 6 |
| 52 | `src/components/RouteErrorBoundary.test.tsx` | Route errors | 6 |

**Subtotal Subfase 3.5:** 10 arquivos, ~88 testes

---

### SUBFASE 3.6: Services Layer

| # | Arquivo | Funções a Testar | Testes Est. |
|---|---------|------------------|-------------|
| 53 | `src/services/marketplace.test.ts` | marketplace ops | 8 |
| 54 | `src/services/offers.test.ts` | offer management | 8 |

**Subtotal Subfase 3.6:** 2 arquivos, ~16 testes

---

### SUBFASE 3.7: Hooks Avançados (Pendentes)

| # | Arquivo | Hook | Testes Est. |
|---|---------|------|-------------|
| 55 | `src/hooks/useAdminAnalytics.test.ts` | Admin analytics | 8 |
| 56 | `src/hooks/useAffiliateRequest.test.ts` | Affiliate requests | 8 |
| 57 | `src/hooks/useAffiliateTracking.test.ts` | Tracking | 6 |
| 58 | `src/hooks/useAffiliationDetails.test.ts` | Details fetch | 6 |
| 59 | `src/hooks/useAffiliations.test.ts` | List affiliations | 6 |
| 60 | `src/hooks/useBuyerOrders.test.ts` | Buyer orders | 8 |
| 61 | `src/hooks/useCheckoutEditor.test.ts` | Editor state | 10 |
| 62 | `src/hooks/useContextSwitcher.test.ts` | Context switching | 6 |
| 63 | `src/hooks/useDecryptCustomerData.test.ts` | Decryption | 8 |
| 64 | `src/hooks/useDecryptCustomerBatch.test.ts` | Batch decrypt | 8 |
| 65 | `src/hooks/useFormDirtyGuard.test.ts` | Form guard | 6 |
| 66 | `src/hooks/useMarketplaceProducts.test.ts` | Marketplace | 8 |
| 67 | `src/hooks/usePaymentAccountCheck.test.ts` | Account check | 6 |
| 68 | `src/hooks/useProduct.test.tsx` | Product CRUD | 10 |
| 69 | `src/hooks/useProductPixels.test.ts` | Pixel config | 6 |
| 70 | `src/hooks/useResetPassword.test.ts` | Password reset | 8 |
| 71 | `src/hooks/useVendorPixels.test.ts` | Vendor pixels | 6 |
| 72 | `src/hooks/useVendorTimezone.test.ts` | Timezone | 4 |

**Subtotal Subfase 3.7:** 18 arquivos, ~128 testes

---

## Resumo Quantitativo Fase 3

| Subfase | Categoria | Arquivos | Testes | Prioridade |
|---------|-----------|----------|--------|------------|
| 3.1 | XState Machines | 10 | ~134 | 🔴 CRÍTICA |
| 3.2 | Módulos Core | 8 | ~72 | 🔴 CRÍTICA |
| 3.3 | Lib Avançado | 19 | ~161 | 🟠 ALTA |
| 3.4 | Contextos/Providers | 5 | ~38 | 🟠 ALTA |
| 3.5 | Componentes Críticos | 10 | ~88 | 🟡 MÉDIA |
| 3.6 | Services | 2 | ~16 | 🟡 MÉDIA |
| 3.7 | Hooks Avançados | 18 | ~128 | 🟡 MÉDIA |
| **TOTAL** | | **72** | **~637** | |

---

## Projeção de Cobertura Pós-Fase 3

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROJEÇÃO DE COBERTURA PÓS-FASE 3                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ANTES (Atual):                                                             │
│  Arquivos com Teste: ~50/478 (10.5%)                                        │
│  Testes Totais: ~930                                                        │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  10.5%             │
│                                                                              │
│  APÓS (Fase 3 Completa):                                                    │
│  Arquivos com Teste: ~122/478 (25.5%)                                       │
│  Testes Totais: ~1,567                                                      │
│  ████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░  25.5%             │
│                                                                              │
│  INCREMENTO: +15.0% cobertura, +637 testes                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cronograma de Execução

| Etapa | Subfase | Arquivos | Tempo Est. | Dependências |
|-------|---------|----------|------------|--------------|
| 1 | 3.1 XState Machines | 10 | 4-5 dias | Nenhuma (SSOT) |
| 2 | 3.2 Módulos Core | 8 | 3 dias | Etapa 1 |
| 3 | 3.3 Lib Avançado | 19 | 4 dias | Nenhuma |
| 4 | 3.4 Contextos | 5 | 2 dias | Etapa 3 |
| 5 | 3.5 Componentes | 10 | 3 dias | Etapas 1-4 |
| 6 | 3.6 Services | 2 | 1 dia | Nenhuma |
| 7 | 3.7 Hooks Avançados | 18 | 4 dias | Etapas 1-4 |
| **TOTAL** | | **72** | **21-22 dias** | |

---

## Ordem de Implementação Recomendada

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLUXO DE IMPLEMENTAÇÃO FASE 3                           │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│   ETAPA 1: XSTATE MACHINES (SSOT - MÁXIMA PRIORIDADE)                       │
│   ├── checkoutPublicMachine.test.ts                                         │
│   ├── productFormMachine.test.ts                                            │
│   ├── dateRangeMachine.test.ts                                              │
│   └── token-manager/machine.test.ts                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│   ETAPA 2: TOKEN MANAGER COMPLETO                                           │
│   ├── service.test.ts                                                       │
│   ├── persistence.test.ts                                                   │
│   ├── heartbeat.test.ts                                                     │
│   └── cross-tab-lock.test.ts                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│   ETAPA 3: LIB UTILITIES                                                    │
│   ├── rpcProxy.test.ts, storageProxy.test.ts                               │
│   ├── order-status/service.test.ts                                          │
│   ├── products/*.test.ts, checkouts/*.test.ts                               │
│   └── security.test.ts, utils.test.ts, uploadUtils.test.ts                  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│   ETAPA 4: MÓDULOS CORE                                                     │
│   ├── checkout-public/hooks, adapters, mappers                              │
│   ├── dashboard/hooks, utils                                                │
│   └── members-area/services, hooks, utils                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│   ETAPA 5: CONTEXTOS & PROVIDERS                                            │
│   ├── CheckoutContext.test.tsx                                              │
│   ├── NavigationGuardProvider.test.tsx                                      │
│   └── UnsavedChangesGuard.test.tsx                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│   ETAPA 6: COMPONENTES CRÍTICOS                                             │
│   ├── CouponField.test.tsx, OrderBumpList.test.tsx                          │
│   ├── CreditCardForm.test.tsx, GatewayCardForm.test.tsx                     │
│   └── ErrorBoundaries.test.tsx                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│   ETAPA 7: HOOKS AVANÇADOS                                                  │
│   ├── useCheckoutEditor.test.ts                                             │
│   ├── useDecryptCustomerData.test.ts                                        │
│   └── Demais hooks de negócio                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Infraestrutura Adicional Necessária

### Novos MSW Handlers

```text
src/test/mocks/handlers/
├── token-manager-handlers.ts     # Token refresh, validation
├── order-status-handlers.ts      # Status transitions
├── members-area-handlers.ts      # Content, lessons
├── admin-handlers.ts             # User management
└── marketplace-handlers.ts       # Marketplace ops
```

### Test Utilities Adicionais

```text
src/test/
├── xstate-utils.ts               # XState testing helpers
│   ├── createTestMachine()
│   ├── simulateTransition()
│   └── assertState()
└── component-utils.tsx           # React component helpers
    ├── renderWithProviders()
    └── createMockContext()
```

---

## Métricas de Sucesso

| Métrica | Atual | Meta Fase 3 | Meta Final |
|---------|-------|-------------|------------|
| Arquivos de Teste | 50 | 122 | 200+ |
| Testes Totais | ~930 | ~1,567 | 2,500+ |
| Cobertura de Arquivos | 10.5% | 25.5% | 70%+ |
| XState Machines Testadas | 0/10 | 10/10 | 10/10 |
| Módulos Core Testados | 0/5 | 5/5 | 5/5 |

---

## Certificação RISE V3 - Fase 3

| Critério | Conformidade |
|----------|--------------|
| LEI SUPREMA (Seção 4) | ✅ Solução C escolhida (nota 10.0) |
| Zero Tipos `any` | ✅ Obrigatório em todos os testes |
| Limite 300 Linhas | ✅ Modularização por domínio |
| XState como SSOT | ✅ Prioridade máxima (Subfase 3.1) |
| Testing Pyramid | ✅ 70% Unit / 20% Integration / 10% E2E |
| Documentação | ✅ Atualizar TESTING_SYSTEM.md |

---

## Resumo Executivo

| Aspecto | Valor |
|---------|-------|
| **Arquivos de Teste Novos** | 72 |
| **Testes Novos** | ~637 |
| **Cobertura Final Fase 3** | 25.5% (de 10.5%) |
| **Tempo Total Estimado** | 21-22 dias |
| **Nota RISE V3** | 10.0/10 |
| **Foco Principal** | XState Machines + Módulos Core |
