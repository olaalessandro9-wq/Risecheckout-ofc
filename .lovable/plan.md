
# Roadmap para 100% de Cobertura de Testes

## Status Atual: ~70% (~1.105 testes)

### Módulos JÁ Cobertos (100%)
| Categoria | Módulos |
|-----------|---------|
| State Machines | navigationMachine, builderMachine, checkoutPublicMachine, productFormMachine, dateRangeMachine, pixelsMachine, utmifyMachine, webhooksMachine, affiliationMachine, adminMachine, financeiroMachine |
| Session/Auth | TokenManager (6 arquivos), SessionCommander (3 arquivos) |
| Hooks | useAuthRole, useAffiliations, useBuyerOrders, useCheckoutEditor, useProductPixels, useVendorPixels, useFormValidation (7 arquivos) |
| API Client | client.ts, public-client.ts, errors.ts, types.ts |
| Services | marketplace.ts, offers.ts |
| UI Components | 17 arquivos de componentes base |
| Lib Utilities | validation.ts (4 arquivos), utils.ts, security.ts, uploadUtils.ts, lazyWithRetry.ts, utmify-helper.ts |
| Products | deleteProduct.ts, duplicateProduct.ts |
| Checkouts | cloneCheckoutDeep.ts, duplicateCheckout.ts |
| Providers/Contexts | NavigationGuardProvider, UnsavedChangesGuard, theme, CheckoutContext, UltrawidePerformanceContext |

---

## GAPS IDENTIFICADOS: 30% (~475 testes necessários)

### Fase 13: Lib Core (Gaps) — ~35 testes
**Arquivos SEM testes:**
- `src/lib/products/ensureSingleCheckout.ts`
- `src/lib/links/attachOfferToCheckoutSmart.ts`
- `src/lib/orderBump/fetchCandidates.ts`
- `src/lib/checkout/cloneCustomization.ts`
- `src/lib/date-range/` (todos)
- `src/lib/timezone/` (todos)
- `src/lib/constants/` (todos)

### Fase 14: Hooks Restantes — ~60 testes
**Hooks SEM testes (20 arquivos):**
- `useAdminAnalytics.ts`
- `useAffiliateRequest.ts`
- `useAffiliateTracking.ts`
- `useAffiliationDetails.ts`
- `useAffiliationProduct.ts`
- `useAffiliationStatusCache.ts`
- `useContextSwitcher.ts`
- `useDebouncedWidth.ts`
- `useDecryptCustomerBatch.ts`
- `useDecryptCustomerData.ts`
- `useFormDirtyGuard.ts` (parcial)
- `useIsUltrawide.ts`
- `useMarketplaceProducts.ts`
- `usePaymentAccountCheck.ts`
- `useProduct.tsx`
- `useResetPassword.ts`
- `useScrollShadow.ts`
- `useVendorTimezone.ts`
- `use-mobile.tsx`
- `use-toast.ts`

### Fase 15: Module Hooks — ~50 testes
**Módulo Members Area (15 hooks SEM testes):**
- `useCertificates.ts`
- `useContentDrip.ts`
- `useContentEditorData.ts`
- `useGroups.ts`
- `useMembersArea.ts`
- `useMembersAreaContents.ts`
- `useMembersAreaModules.ts`
- `useMembersAreaSettings.ts`
- `useQuizzes.ts`
- `useStudentProgress.ts`
- `useStudentsActions.ts`
- `useStudentsData.ts`
- `useVideoLibrary.ts`

**Módulo Dashboard (3 hooks):**
- `useDashboard.ts`
- `useDashboardAnalytics.ts`
- `useDateRangeState.ts`

**Módulo Admin (3 hooks):**
- `useAdminFilters.ts`
- `useAdminPagination.ts`
- `useAdminSort.ts`

**Módulo Checkout Public (1 hook):**
- `useCheckoutPublicMachine.ts`

**Módulo Navigation (1 hook):**
- `useNavigation.ts`

### Fase 16: Module Services — ~25 testes
**Members Area Services (5 arquivos):**
- `certificates.service.ts`
- `groups.service.ts`
- `progress.service.ts`
- `quizzes.service.ts`
- `students.service.ts`

### Fase 17: Module Utils — ~20 testes
**Utils SEM testes:**
- `src/modules/members-area/utils/content-type.ts`
- `src/modules/members-area/utils/content-validator.ts`
- `src/modules/members-area/utils/progress-calculator.ts`
- `src/modules/members-area-builder/utils/gradientUtils.ts`
- `src/modules/dashboard/utils/calculations.ts`
- `src/modules/dashboard/utils/formatters.ts`
- `src/modules/navigation/utils/`
- `src/modules/checkout-public/adapters/formDataAdapter.ts`
- `src/modules/checkout-public/mappers/`

### Fase 18: UI Components Tier 2 — ~80 testes
**Componentes UI SEM testes (36 arquivos):**
```text
accordion, alert-dialog, aspect-ratio, breadcrumb, calendar,
carousel, chart, collapsible, command, context-menu, 
currency-input, drawer, dropdown-menu, hover-card, input-otp,
loading-switch, menubar, navigation-menu, pagination, popover,
price-display, radio-group, resizable, scroll-area, sheet,
sidebar, slider, sonner, table, tabs, toast, toaster,
toggle, toggle-group, tooltip, CountryCodeSelector
```

### Fase 19: Business Components — ~70 testes
**Componentes de Negócio SEM testes:**
- `src/components/checkout/` (~15 arquivos)
- `src/components/products/` (~20 arquivos)
- `src/components/affiliates/` (5 arquivos)
- `src/components/dashboard/` (3 arquivos)
- `src/components/auth/` (2 arquivos)
- `src/components/layout/` (3 arquivos)
- `src/components/common/` (1 arquivo)
- `src/components/guards/`
- `src/components/navigation/`

### Fase 20: Module Components — ~60 testes
**Componentes de Módulos:**
- `src/modules/checkout-public/components/`
- `src/modules/members-area-builder/components/`
- `src/modules/members-area/components/`
- `src/modules/marketplace/components/`
- `src/modules/dashboard/components/`
- `src/modules/pixels/components/`
- `src/modules/webhooks/components/`
- `src/modules/utmify/components/`

### Fase 21: Pages — ~50 testes
**Pages SEM testes (35 arquivos):**
```text
Auth, Cadastro, LandingPage, Marketplace, Financeiro,
Produtos, ProductEdit, Afiliados, MinhasAfiliacoes,
SolicitarAfiliacao, AffiliationDetails, Perfil, Ajuda,
CheckoutCustomizer, Rastreamento, Webhooks, EmBreve,
NotFound, PaymentLinkRedirect, PaymentSuccessPage,
OAuthSuccess, RecuperarSenha, RedefinirSenha,
PublicCheckoutV2, PixPaymentPage, MercadoPagoPayment,
TermosDeUso, PoliticaDePrivacidade, AdminHealth
+ subpages em admin/, checkout-customizer/, lgpd/, owner/
```

### Fase 22: Edge Functions (Backend) — ~200 testes
**106 Edge Functions — Apenas 10 têm testes:**
- Testadas: `_shared/` (idempotency, etc.)
- SEM testes: 96 funções restantes

---

## Cronograma de Execução

| Fase | Escopo | Testes | Acumulado | Coverage |
|------|--------|--------|-----------|----------|
| 13 | Lib Core Gaps | ~35 | 1.140 | 72% |
| 14 | Hooks Restantes | ~60 | 1.200 | 75% |
| 15 | Module Hooks | ~50 | 1.250 | 78% |
| 16 | Module Services | ~25 | 1.275 | 80% |
| 17 | Module Utils | ~20 | 1.295 | 81% |
| 18 | UI Components Tier 2 | ~80 | 1.375 | 85% |
| 19 | Business Components | ~70 | 1.445 | 88% |
| 20 | Module Components | ~60 | 1.505 | 91% |
| 21 | Pages | ~50 | 1.555 | 94% |
| 22 | Edge Functions | ~200 | 1.755 | 100% |

**Total: ~650 novos testes para atingir 100%**

---

## Detalhes Técnicos por Fase

### Fase 13: Lib Core Gaps (~35 testes)
```text
src/lib/products/__tests__/
├── ensureSingleCheckout.test.ts     (~8 testes)
src/lib/links/__tests__/
├── attachOfferToCheckoutSmart.test.ts (~6 testes)
src/lib/orderBump/__tests__/
├── fetchCandidates.test.ts          (~8 testes)
src/lib/checkout/__tests__/
├── cloneCustomization.test.ts       (~5 testes)
src/lib/date-range/__tests__/
├── index.test.ts                    (~5 testes)
src/lib/timezone/__tests__/
├── index.test.ts                    (~3 testes)
```

### Fase 14: Hooks Restantes (~60 testes)
```text
src/hooks/__tests__/
├── useAdminAnalytics.test.ts        (~3 testes)
├── useAffiliateRequest.test.ts      (~4 testes)
├── useAffiliateTracking.test.ts     (~3 testes)
├── useAffiliationDetails.test.ts    (~4 testes)
├── useAffiliationProduct.test.ts    (~3 testes)
├── useAffiliationStatusCache.test.ts (~3 testes)
├── useContextSwitcher.test.ts       (~3 testes)
├── useDebouncedWidth.test.ts        (~3 testes)
├── useDecryptCustomerBatch.test.ts  (~4 testes)
├── useDecryptCustomerData.test.ts   (~4 testes)
├── useIsUltrawide.test.ts           (~3 testes)
├── useMarketplaceProducts.test.ts   (~4 testes)
├── usePaymentAccountCheck.test.ts   (~4 testes)
├── useProduct.test.tsx              (~5 testes)
├── useResetPassword.test.ts         (~3 testes)
├── useScrollShadow.test.ts          (~3 testes)
├── useVendorTimezone.test.ts        (~3 testes)
├── use-mobile.test.tsx              (~2 testes)
├── use-toast.test.ts                (~3 testes)
```

### Fase 15: Module Hooks (~50 testes)
```text
src/modules/members-area/hooks/__tests__/
├── useCertificates.test.ts          (~3 testes)
├── useContentDrip.test.ts           (~3 testes)
├── useGroups.test.ts                (~3 testes)
├── useMembersArea.test.ts           (~4 testes)
├── useMembersAreaContents.test.ts   (~3 testes)
├── useMembersAreaModules.test.ts    (~3 testes)
├── useMembersAreaSettings.test.ts   (~3 testes)
├── useQuizzes.test.ts               (~3 testes)
├── useStudentProgress.test.ts       (~3 testes)
├── useStudentsActions.test.ts       (~4 testes)
├── useStudentsData.test.ts          (~3 testes)
├── useVideoLibrary.test.ts          (~3 testes)
src/modules/dashboard/hooks/__tests__/
├── useDashboard.test.ts             (~4 testes)
├── useDashboardAnalytics.test.ts    (~3 testes)
├── useDateRangeState.test.ts        (~3 testes)
```

### Fase 16: Module Services (~25 testes)
```text
src/modules/members-area/services/__tests__/
├── certificates.service.test.ts     (~5 testes)
├── groups.service.test.ts           (~5 testes)
├── progress.service.test.ts         (~5 testes)
├── quizzes.service.test.ts          (~5 testes)
├── students.service.test.ts         (~5 testes)
```

### Fase 17: Module Utils (~20 testes)
```text
src/modules/members-area/utils/__tests__/
├── content-type.test.ts             (~4 testes)
├── content-validator.test.ts        (~4 testes)
├── progress-calculator.test.ts      (~4 testes)
src/modules/members-area-builder/utils/__tests__/
├── gradientUtils.test.ts            (~3 testes)
src/modules/dashboard/utils/__tests__/
├── calculations.test.ts             (~3 testes)
├── formatters.test.ts               (~4 testes)
src/modules/checkout-public/adapters/__tests__/
├── formDataAdapter.test.ts          (~4 testes)
```

### Fases 18-22: Componentes e Pages
Seguirão o mesmo padrão de modularização, com ~3-5 testes por componente cobrindo:
- Renderização básica
- Props/states principais
- Interações do usuário
- Edge cases

---

## Regras RISE V3 para Todas as Fases

| Critério | Obrigatório |
|----------|-------------|
| Limite 300 linhas | Arquivos de teste < 250 linhas |
| Zero `any` types | Tipagem completa |
| Zero `@ts-expect-error` | Nenhum |
| Single Responsibility | 1 arquivo = 1 módulo testado |
| Mocking via MSW | Para todas as APIs |
| Factories reutilizáveis | Para dados de teste |
| Documentação | JSDoc em cada describe/it |

---

## Comando para Próxima Fase

Para iniciar cada fase, diga:

- **"Continue com a Fase 13"** — Lib Core Gaps (35 testes)
- **"Continue com a Fase 14"** — Hooks Restantes (60 testes)
- etc.

Ou: **"Execute Fases 13-17 de uma vez"** para atingir 81% de coverage.
