
# PLANO COMPLETO: Operação 80% de Cobertura de Testes
## Execução Solo - Lovable Agent

**Versão:** 1.0  
**Data:** 01 de Fevereiro de 2026  
**Executor:** Lovable AI  
**RISE V3 Compliance:** 10.0/10

---

## 1. SITUAÇÃO ATUAL (DADOS CONSOLIDADOS DOS 4 AGENTES)

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        COBERTURA ATUAL CONSOLIDADA                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  FRONTEND (src/)                   BACKEND (Edge Functions)                     │
│  ██████████░░░░░░░░░░ ~38.5%       ██████████████████░░ ~87%                    │
│  ~430/1.138 arquivos               ~94/108 funções                             │
│                                                                                 │
│  E2E (Playwright)                  MÉDIA TOTAL                                 │
│  ████████████████████ 107 testes   ██████████████░░░░░░ ~66%                   │
│  12 specs                          (Simples: Front+Back)                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Gaps Identificados

| Camada | Gap Crítico | Arquivos Sem Teste |
|--------|-------------|-------------------|
| **Backend** | 14 Edge Functions sem teste | admin-health, check-secrets, email-preview, health, owner-settings, reconcile-pending-orders, rls-documentation-generator, rpc-proxy, send-confirmation-email, send-email, send-pix-email, smoke-test, storage-management, test-deploy |
| **src/pages/** | ~3% cobertura | ~63/65 arquivos |
| **src/modules/** | ~32% cobertura | ~328/482 arquivos |
| **src/components/** (não-ui) | ~24% cobertura | ~232/307 arquivos |
| **src/integrations/** | ~54% cobertura | ~46/99 arquivos |

---

## 2. META DO PLANO

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              META: 80% COBERTURA                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ANTES:  ████████████░░░░░░░░ ~66% (Média Front+Back)                          │
│  DEPOIS: ████████████████░░░░ 80%                                              │
│                                                                                 │
│  ESTRATÉGIA: Priorizar áreas críticas + alto impacto                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. FASES DE EXECUÇÃO

### FASE 1: Backend - Edge Functions Faltantes (14 funções)
**Prioridade:** CRÍTICA  
**Estimativa:** 4-6 horas  
**Impacto:** Backend 87% → 100%

Criar testes para:

| # | Função | Complexidade | Prioridade |
|---|--------|--------------|------------|
| 1 | `send-email` | Alta | CRÍTICA |
| 2 | `send-pix-email` | Alta | CRÍTICA |
| 3 | `send-confirmation-email` | Alta | CRÍTICA |
| 4 | `admin-health` | Média | ALTA |
| 5 | `health` | Baixa | MÉDIA |
| 6 | `check-secrets` | Baixa | MÉDIA |
| 7 | `owner-settings` | Média | ALTA |
| 8 | `storage-management` | Média | ALTA |
| 9 | `reconcile-pending-orders` | Alta | CRÍTICA |
| 10 | `rls-documentation-generator` | Baixa | BAIXA |
| 11 | `rpc-proxy` | Média | MÉDIA |
| 12 | `email-preview` | Baixa | BAIXA |
| 13 | `smoke-test` | Baixa | BAIXA |
| 14 | `test-deploy` | Baixa | BAIXA |

**Estrutura por função:**
```
supabase/functions/{function-name}/
├── tests/
│   ├── _shared.ts       # Mocks e tipos
│   ├── validation.test.ts
│   └── actions.test.ts
```

---

### FASE 2: Frontend - Páginas Críticas (30 páginas prioritárias)
**Prioridade:** CRÍTICA  
**Estimativa:** 8-12 horas  
**Impacto:** pages/ 3% → 50%

#### Grupo A: Páginas de Autenticação (6 páginas)
| Página | Arquivo | Status |
|--------|---------|--------|
| Login | `Auth.tsx` | SEM TESTE |
| Cadastro | `Cadastro.tsx` | SEM TESTE |
| Recuperar Senha | `RecuperarSenha.tsx` | SEM TESTE |
| Redefinir Senha | `RedefinirSenha.tsx` | SEM TESTE |
| OAuth Success | `OAuthSuccess.tsx` | SEM TESTE |
| Not Found | `NotFound.tsx` | SEM TESTE |

#### Grupo B: Páginas de Produtos (6 páginas)
| Página | Arquivo | Status |
|--------|---------|--------|
| Lista Produtos | `Produtos.tsx` | SEM TESTE |
| Edição Produto | `ProductEdit.tsx` | SEM TESTE |
| Afiliados | `Afiliados.tsx` | SEM TESTE |
| Minhas Afiliações | `MinhasAfiliacoes.tsx` | SEM TESTE |
| Detalhes Afiliação | `AffiliationDetails.tsx` | SEM TESTE |
| Solicitar Afiliação | `SolicitarAfiliacao.tsx` | SEM TESTE |

#### Grupo C: Páginas de Checkout/Pagamento (6 páginas)
| Página | Arquivo | Status |
|--------|---------|--------|
| Checkout Público | `PublicCheckoutV2.tsx` | SEM TESTE |
| PIX Payment | `PixPaymentPage.tsx` | COM TESTE (básico) |
| MercadoPago | `MercadoPagoPayment.tsx` | COM TESTE (básico) |
| Payment Success | `PaymentSuccessPage.tsx` | SEM TESTE |
| Payment Link | `PaymentLinkRedirect.tsx` | COM TESTE (básico) |
| Checkout Customizer | `CheckoutCustomizer.tsx` | COM TESTE (básico) |

#### Grupo D: Páginas Administrativas (6 páginas)
| Página | Arquivo | Status |
|--------|---------|--------|
| Financeiro | `Financeiro.tsx` | SEM TESTE |
| Rastreamento | `Rastreamento.tsx` | COM TESTE (básico) |
| Webhooks | `Webhooks.tsx` | COM TESTE (básico) |
| Marketplace | `Marketplace.tsx` | SEM TESTE |
| Perfil | `Perfil.tsx` | SEM TESTE |
| Ajuda | `Ajuda.tsx` | SEM TESTE |

#### Grupo E: Páginas Admin/Owner (4 páginas)
| Página | Arquivo | Status |
|--------|---------|--------|
| Admin Dashboard | `admin/AdminDashboard.tsx` | SEM TESTE |
| Admin Health | `AdminHealth.tsx` | SEM TESTE |
| Owner Gateways | `owner/OwnerGateways.tsx` | SEM TESTE |
| Landing Page | `LandingPage.tsx` | SEM TESTE |

---

### FASE 3: Frontend - Módulos Críticos
**Prioridade:** ALTA  
**Estimativa:** 10-15 horas  
**Impacto:** modules/ 32% → 60%

#### 3.1 modules/checkout-public (Crítico - Fluxo de Compra)
```text
Arquivos fonte: ~40
Arquivos com teste: ~5
Gap: ~35 arquivos
```

Testes prioritários:
- `components/CheckoutPublicContent.test.tsx` ✅ (existe)
- `components/CheckoutForm.test.tsx` (criar)
- `components/OrderSummary.test.tsx` (criar)
- `components/PaymentMethodSelector.test.tsx` (criar)
- `hooks/useCheckoutPublicMachine.test.ts` ✅ (existe)
- `adapters/*.test.ts` (criar 5 arquivos)
- `mappers/*.test.ts` (criar 3 arquivos)

#### 3.2 modules/products (Crítico - CRUD de Produtos)
```text
Arquivos fonte: ~80
Arquivos com teste: ~20
Gap: ~60 arquivos
```

Testes prioritários:
- `tabs/*.test.tsx` ✅ (9 arquivos existem)
- `context/ProductContext.test.tsx` (criar)
- `context/hooks/*.test.ts` (criar 10 arquivos)
- `components/*.test.tsx` (criar 15 arquivos)

#### 3.3 modules/members-area (Alta - Área de Membros)
```text
Arquivos fonte: ~50
Arquivos com teste: ~10
Gap: ~40 arquivos
```

Testes prioritários:
- `pages/buyer/*.test.tsx` (criar 10 arquivos)
- `hooks/*.test.ts` (criar 8 arquivos)
- `services/*.test.ts` (criar 3 arquivos)
- `views/*.test.tsx` (criar 5 arquivos)

#### 3.4 modules/dashboard (Alta - Dashboard Principal)
```text
Arquivos fonte: ~30
Arquivos com teste: ~5
Gap: ~25 arquivos
```

Testes prioritários:
- `components/*.test.tsx` (criar 8 arquivos)
- `hooks/*.test.ts` (criar 5 arquivos)
- `pages/*.test.tsx` (criar 3 arquivos)

#### 3.5 modules/financeiro (Alta - Gateways)
```text
Arquivos fonte: ~20
Arquivos com teste: ~5
Gap: ~15 arquivos
```

Testes prioritários:
- `context/FinanceiroContext.test.tsx` (criar)
- `components/GatewayList.test.tsx` (criar)
- `components/GatewayConfigSheet.test.tsx` (criar)

---

### FASE 4: Frontend - Componentes Não-UI
**Prioridade:** MÉDIA  
**Estimativa:** 8-10 horas  
**Impacto:** components/ 24% → 50%

#### 4.1 components/checkout (Crítico)
```text
Arquivos fonte: ~50
Gap: ~40 arquivos
```

Criar testes para:
- `builder/*.test.tsx` (10 arquivos)
- `payment/*.test.tsx` (8 arquivos)
- `preview/*.test.tsx` (5 arquivos)
- `v2/*.test.tsx` (8 arquivos)

#### 4.2 components/products (Alta)
```text
Arquivos fonte: ~25
Gap: ~20 arquivos
```

Criar testes para:
- `ProductsTable.test.tsx`
- `AddProductDialog.test.tsx`
- `CouponsTable.test.tsx`
- `LinksTable.test.tsx`
- `OffersManager.test.tsx`
- `offers-manager/*.test.tsx` (5 arquivos)
- `products-table/*.test.tsx` (5 arquivos)

#### 4.3 components/affiliates + affiliations (Média)
```text
Arquivos fonte: ~15
Gap: ~12 arquivos
```

---

### FASE 5: Frontend - Integrations
**Prioridade:** MÉDIA  
**Estimativa:** 6-8 horas  
**Impacto:** integrations/ 54% → 80%

#### 5.1 integrations/gateways (Parcialmente coberto)
- `asaas/` - Verificar e completar
- `mercadopago/` - Verificar e completar
- `pushinpay/` - Verificar e completar
- `stripe/` - Verificar e completar

#### 5.2 integrations/tracking (Gap maior)
- `facebook/*.test.ts` (criar 3 arquivos)
- `tiktok/*.test.ts` (criar 3 arquivos)
- `google-ads/*.test.ts` (criar 3 arquivos)
- `kwai/*.test.ts` (criar 3 arquivos)
- `utmify/*.test.ts` (criar 3 arquivos)

---

## 4. CRONOGRAMA DE EXECUÇÃO

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TIMELINE DE EXECUÇÃO                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  FASE 1: Backend Edge Functions                                                 │
│  ████████████████████ 4-6 horas                                                │
│  Objetivo: 100% backend                                                         │
│                                                                                 │
│  FASE 2: Páginas Críticas                                                       │
│  ████████████████████████████████████████ 8-12 horas                           │
│  Objetivo: 50% pages/                                                           │
│                                                                                 │
│  FASE 3: Módulos Críticos                                                       │
│  ████████████████████████████████████████████████████████████ 10-15 horas      │
│  Objetivo: 60% modules/                                                         │
│                                                                                 │
│  FASE 4: Componentes Não-UI                                                     │
│  ████████████████████████████████████████ 8-10 horas                           │
│  Objetivo: 50% components/                                                      │
│                                                                                 │
│  FASE 5: Integrations                                                           │
│  ████████████████████████████ 6-8 horas                                        │
│  Objetivo: 80% integrations/                                                    │
│                                                                                 │
│  TOTAL ESTIMADO: 36-51 horas                                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. DETALHAMENTO TÉCNICO

### 5.1 Padrão de Testes Frontend (Vitest + Testing Library)

```typescript
/**
 * @file ComponentName.test.tsx
 * @description Tests for ComponentName
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ComponentName } from "./ComponentName";
import { createMockContext } from "@/test/factories";

// Mock dependencies
vi.mock("@/hooks/useSomething", () => ({
  useSomething: () => createMockContext(),
}));

describe("ComponentName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render correctly", () => {
      render(<ComponentName />);
      expect(screen.getByText("Expected Text")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should handle click", async () => {
      render(<ComponentName />);
      fireEvent.click(screen.getByRole("button"));
      await waitFor(() => {
        expect(/* assertion */).toBeTruthy();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty state", () => {
      // ...
    });
  });
});
```

### 5.2 Padrão de Testes Backend (Deno)

```typescript
/**
 * @file validation.test.ts
 * @description Validation tests for edge-function
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createMockRequest, MOCK_SUPABASE_URL, MOCK_ANON_KEY } from "./_shared.ts";

Deno.test("edge-function - should validate required fields", () => {
  // Test implementation
});

Deno.test("edge-function - should reject unauthorized requests", () => {
  // Test implementation
});
```

### 5.3 Uso de Factories (Zero as any)

```typescript
// src/test/factories/index.ts
export { createMockProductContext } from "./productContext";
export { createMockUseMachine } from "./xstate";
export { createMockCheckoutContext } from "./checkoutPublicContext";
// ... etc
```

---

## 6. ENTREGÁVEIS POR FASE

### Fase 1: Backend (14 arquivos)
```
supabase/functions/
├── admin-health/tests/_shared.ts, validation.test.ts
├── check-secrets/tests/_shared.ts, validation.test.ts
├── email-preview/tests/_shared.ts, validation.test.ts
├── health/tests/_shared.ts, validation.test.ts
├── owner-settings/tests/_shared.ts, validation.test.ts
├── reconcile-pending-orders/tests/ (já tem index.test.ts, verificar completude)
├── rls-documentation-generator/tests/_shared.ts, validation.test.ts
├── rpc-proxy/tests/_shared.ts, validation.test.ts
├── send-confirmation-email/tests/_shared.ts, validation.test.ts
├── send-email/tests/_shared.ts, validation.test.ts, actions.test.ts
├── send-pix-email/tests/_shared.ts, validation.test.ts, actions.test.ts
├── smoke-test/tests/_shared.ts, validation.test.ts
├── storage-management/tests/_shared.ts, validation.test.ts
└── test-deploy/tests/_shared.ts, validation.test.ts
```

### Fase 2: Páginas (~30 arquivos)
```
src/pages/__tests__/
├── auth-pages.test.tsx        # Auth, Cadastro, RecuperarSenha, RedefinirSenha
├── product-pages.test.tsx     # Produtos, ProductEdit, Afiliados
├── checkout-pages.test.tsx    # PublicCheckoutV2, PaymentSuccess
├── admin-pages.test.tsx       # Financeiro, Marketplace, Perfil
├── owner-pages.test.tsx       # AdminDashboard, AdminHealth, OwnerGateways
└── misc-pages.test.tsx        # LandingPage, NotFound, EmBreve, Ajuda
```

### Fase 3: Módulos (~80 arquivos)
```
src/modules/
├── checkout-public/
│   ├── components/__tests__/ (8 novos arquivos)
│   ├── adapters/__tests__/ (5 novos arquivos)
│   └── mappers/__tests__/ (3 novos arquivos)
├── products/
│   ├── context/__tests__/ (3 novos arquivos)
│   ├── context/hooks/__tests__/ (10 novos arquivos)
│   └── components/__tests__/ (15 novos arquivos)
├── members-area/
│   ├── pages/buyer/__tests__/ (10 novos arquivos)
│   ├── hooks/__tests__/ (8 novos arquivos)
│   └── services/__tests__/ (3 novos arquivos)
├── dashboard/
│   ├── components/__tests__/ (8 novos arquivos)
│   └── hooks/__tests__/ (5 novos arquivos)
└── financeiro/
    └── __tests__/ (5 novos arquivos)
```

### Fase 4: Componentes (~50 arquivos)
```
src/components/
├── checkout/__tests__/ (30 novos arquivos)
├── products/__tests__/ (15 novos arquivos)
└── affiliates/__tests__/ (5 novos arquivos)
```

### Fase 5: Integrations (~20 arquivos)
```
src/integrations/
├── gateways/
│   ├── asaas/__tests__/ (verificar/completar)
│   ├── mercadopago/__tests__/ (verificar/completar)
│   ├── pushinpay/__tests__/ (verificar/completar)
│   └── stripe/__tests__/ (verificar/completar)
└── tracking/
    ├── facebook/__tests__/ (3 novos arquivos)
    ├── tiktok/__tests__/ (3 novos arquivos)
    ├── google-ads/__tests__/ (3 novos arquivos)
    ├── kwai/__tests__/ (3 novos arquivos)
    └── utmify/__tests__/ (3 novos arquivos)
```

---

## 7. PROJEÇÃO DE COBERTURA FINAL

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PROJEÇÃO PÓS-EXECUÇÃO                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  BACKEND (Edge Functions)                                                       │
│  ANTES:  ██████████████████░░ 87%                                              │
│  DEPOIS: ████████████████████ 100% ✅                                          │
│                                                                                 │
│  FRONTEND - pages/                                                              │
│  ANTES:  █░░░░░░░░░░░░░░░░░░░ 3%                                               │
│  DEPOIS: ██████████░░░░░░░░░░ 50% → 80% (stretch)                              │
│                                                                                 │
│  FRONTEND - modules/                                                            │
│  ANTES:  ██████░░░░░░░░░░░░░░ 32%                                              │
│  DEPOIS: ████████████░░░░░░░░ 60% → 75% (stretch)                              │
│                                                                                 │
│  FRONTEND - components/                                                         │
│  ANTES:  █████░░░░░░░░░░░░░░░ 24%                                              │
│  DEPOIS: ██████████░░░░░░░░░░ 50% → 65% (stretch)                              │
│                                                                                 │
│  FRONTEND - integrations/                                                       │
│  ANTES:  ███████████░░░░░░░░░ 54%                                              │
│  DEPOIS: ████████████████░░░░ 80% ✅                                           │
│                                                                                 │
│  MÉDIA TOTAL PROJETADA                                                         │
│  ANTES:  ████████████░░░░░░░░ ~66%                                             │
│  DEPOIS: ████████████████░░░░ ~80% ✅                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. ORDEM DE EXECUÇÃO RECOMENDADA

1. **Fase 1 (Backend)** - Completar 100% primeiro por ser crítico para produção
2. **Fase 2 (Páginas)** - Auth e Checkout são flows principais
3. **Fase 3.1 (checkout-public)** - Core do negócio
4. **Fase 3.2 (products)** - CRUD principal
5. **Fase 4.1 (components/checkout)** - Componentes do checkout
6. **Fase 3.3-3.5 (outros módulos)** - Members area, dashboard, financeiro
7. **Fase 4.2-4.3 (outros componentes)** - Products, affiliates
8. **Fase 5 (integrations)** - Tracking pixels

---

## 9. CRITÉRIOS DE SUCESSO

| Critério | Valor Esperado |
|----------|----------------|
| Backend Coverage | 100% (108/108 funções) |
| Frontend File-to-Test | 70%+ |
| Média Total | 80%+ |
| Zero `as any` em testes | ✅ |
| Zero `as never` em testes | ✅ |
| Todos os testes passando | ✅ |
| RISE V3 Compliance | 10.0/10 |

---

## 10. TOTAL DE ARQUIVOS A CRIAR

| Fase | Arquivos Novos |
|------|----------------|
| Fase 1 (Backend) | ~28 arquivos |
| Fase 2 (Páginas) | ~6 arquivos (agrupados) |
| Fase 3 (Módulos) | ~80 arquivos |
| Fase 4 (Componentes) | ~50 arquivos |
| Fase 5 (Integrations) | ~20 arquivos |
| **TOTAL** | **~184 arquivos de teste** |

---

**PRONTO PARA EXECUÇÃO**

Este plano está completo e pronto para ser aprovado. Após aprovação, iniciarei pela Fase 1 (Backend Edge Functions) criando os testes para as 14 funções faltantes.
