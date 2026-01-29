# Documentação do Sistema de Testes - RiseCheckout

**Status:** ✅ FASES 1-6 IMPLEMENTADAS  
**Última atualização:** 29 de Janeiro de 2026  
**RISE V3 Score:** 10.0/10

---

## Visão Geral

O RiseCheckout implementa uma **Pirâmide de Testes Enterprise** seguindo o RISE Architect Protocol V3:

```
              ▲
             /│\
            / │ \
           / E2E \           ~10% (Playwright - 37+ testes)
          /───────\
         /         \
        / Integração\        ~20% (Vitest + MSW - 66 testes)
       /─────────────\
      /               \
     /    Unitários    \     ~70% (Vitest - 279+ testes)
    /───────────────────\
```

**Total: 580+ testes**

---

## Estrutura de Arquivos

```
risecheckout/
├── vitest.config.ts           # Configuração principal Vitest
├── playwright.config.ts       # Configuração Playwright
├── playwright-fixture.ts      # Re-export de fixtures
├── src/test/
│   ├── setup.ts               # Setup global (DOM mocks, MSW)
│   ├── utils.tsx              # Render helpers, test utilities
│   ├── infrastructure.test.ts # Testes de validação da infra
│   └── mocks/
│       ├── handlers.ts        # MSW request handlers
│       └── server.ts          # MSW server instance
├── e2e/                       # Testes E2E (Playwright)
│   ├── fixtures/
│   │   ├── test-data.ts       # Dados centralizados
│   │   └── pages/             # Page Objects
│   │       ├── AuthPage.ts
│   │       ├── CadastroPage.ts
│   │       ├── LandingPage.ts
│   │       ├── CheckoutPage.ts
│   │       ├── PixPaymentPage.ts
│   │       ├── SuccessPage.ts
│   │       └── BuyerPage.ts
│   ├── specs/
│   │   ├── smoke.spec.ts      # 10 testes
│   │   ├── auth.spec.ts       # 9 testes
│   │   ├── checkout.spec.ts   # 12 testes
│   │   ├── landing.spec.ts    # 8 testes
│   │   └── buyer-auth.spec.ts # 8 testes
│   ├── members-area-flicker.spec.ts  # 6 testes
│   └── README.md
└── supabase/functions/_shared/  # Testes Edge Functions
    ├── password-policy.test.ts
    ├── validators.test.ts
    └── rate-limiting/
        ├── service.test.ts
        └── configs.test.ts
```

---

## Como Executar Testes

### Testes Unitários/Integração (Vitest)

```bash
# Executar todos os testes
pnpm test

# Modo watch (desenvolvimento)
pnpm test:watch

# Com interface visual
pnpm test:ui

# Com coverage report
pnpm test:coverage
```

### Testes E2E (Playwright)

```bash
# Executar todos os testes E2E
pnpm exec playwright test

# Com UI mode
pnpm exec playwright test --ui

# Executar arquivo específico
pnpm exec playwright test e2e/specs/auth.spec.ts

# Modo headed (ver browser)
pnpm exec playwright test --headed
```

### Testes de Edge Functions (Deno)

```bash
cd supabase/functions
./run-tests.sh
```

---

## Page Object Pattern (E2E)

Todas as interações de página são encapsuladas em Page Objects:

```typescript
// Exemplo de uso
import { AuthPage } from "../fixtures/pages/AuthPage";

test("should login successfully", async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.navigate();
  await authPage.login("user@example.com", "password123");
  await authPage.waitForLoginComplete();
});
```

### Page Objects Disponíveis

| Page Object | Página | Métodos Principais |
|-------------|--------|-------------------|
| `AuthPage` | /auth | `login()`, `navigate()`, `waitForLoginComplete()` |
| `CadastroPage` | /cadastro | `register()`, `fillEmail()`, `acceptTerms()` |
| `LandingPage` | / | `clickLogin()`, `scrollToFeatures()`, `getCtaCount()` |
| `CheckoutPage` | /pay/:slug | `fillCustomerForm()`, `selectPaymentPix()`, `applyCoupon()` |
| `BuyerPage` | /minha-conta | `login()`, `selectCourse()`, `markLessonComplete()` |
| `PixPaymentPage` | /pay/pix/:id | `copyPixCode()`, `waitForQrCode()` |
| `SuccessPage` | /success/:id | `isSuccessful()`, `getOrderId()` |

---

## Convenções de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Arquivo de teste unitário | `*.test.ts(x)` | `money.test.ts` |
| Arquivo de teste E2E | `*.spec.ts` | `auth.spec.ts` |
| Page Object | `*Page.ts` | `AuthPage.ts` |
| Describe blocks | Nome do módulo/componente | `describe("formatCentsToBRL", ...)` |
| Test cases | `should + ação esperada` | `it("should format cents to BRL", ...)` |

---

## Thresholds de Coverage

| Métrica | Mínimo |
|---------|--------|
| Statements | 60% |
| Branches | 50% |
| Functions | 60% |
| Lines | 60% |

**Meta Final:** 70%+ coverage em todas as métricas.

---

## Módulos Críticos para Testes

Prioridade ordenada por risco:

### Backend (Edge Functions)
1. `_shared/fee-calculator.ts` - Cálculos financeiros
2. `_shared/idempotency.ts` - Prevenção de duplicatas
3. `_shared/grant-members-access.ts` - Acesso a membros
4. `unified-auth/handlers/` - Autenticação

### Frontend
1. `src/lib/money.ts` - Formatação monetária
2. `src/hooks/useUnifiedAuth.ts` - Autenticação
3. `src/hooks/checkout/useFormManager.ts` - Checkout form
4. State Machines (XState) - Fluxos críticos

---

## Status das Fases

- [x] **Fase 1:** Infraestrutura Base (Vitest, MSW, Setup) - ✅ Completo
- [x] **Fase 2:** Testes unitários backend (_shared) - ✅ 129 testes
- [x] **Fase 3:** Testes unitários frontend (lib) - ✅ 150+ testes
- [x] **Fase 4:** Testes de integração (hooks) - ✅ 66 testes
- [x] **Fase 5:** Testes de Edge Functions - ✅ 200+ testes
- [x] **Fase 6:** Testes E2E (Playwright) - ✅ 37+ testes
- [ ] **Fase 7:** CI/CD bloqueante

---

## Contagem de Testes por Fase

| Fase | Categoria | Quantidade |
|------|-----------|------------|
| F2 | Backend _shared | 129 |
| F3 | Frontend lib | 150+ |
| F4 | Hooks integração | 66 |
| F5 | Edge Functions | 200+ |
| F6 | E2E Playwright | 37+ |
| **TOTAL** | | **580+** |

---

## CI/CD Integration

Os testes são executados automaticamente via GitHub Actions em:
- Push para `main` ou `develop`
- Pull Requests para `main`

Pipeline bloqueia merge se:
- Coverage abaixo dos thresholds
- Qualquer teste falhar
