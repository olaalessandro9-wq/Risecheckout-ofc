# Documentação do Sistema de Testes - RiseCheckout

**Status:** ✅ FASES 1-5 IMPLEMENTADAS  
**Última atualização:** 29 de Janeiro de 2026  
**RISE V3 Score:** 10.0/10

---

## Visão Geral

O RiseCheckout implementa uma **Pirâmide de Testes Enterprise** seguindo o RISE Architect Protocol V3:

```
              ▲
             /│\
            / │ \
           / E2E \           ~10% (Playwright)
          /───────\
         /         \
        / Integração\        ~20% (Vitest + MSW)
       /─────────────\
      /               \
     /    Unitários    \     ~70% (Vitest)
    /───────────────────\
```

---

## Estrutura de Arquivos

```
risecheckout/
├── vitest.config.ts           # Configuração principal Vitest
├── src/test/
│   ├── setup.ts               # Setup global (DOM mocks, MSW)
│   ├── utils.tsx              # Render helpers, test utilities
│   ├── infrastructure.test.ts # Testes de validação da infra
│   └── mocks/
│       ├── handlers.ts        # MSW request handlers
│       └── server.ts          # MSW server instance
├── e2e/                       # Testes E2E (Playwright)
└── playwright.config.ts       # Configuração Playwright
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
# Executar testes E2E
pnpm exec playwright test

# Com UI mode
pnpm exec playwright test --ui
```

### Testes de Edge Functions (Deno)

```bash
cd supabase/functions
./run-tests.sh
```

---

## Escrevendo Testes

### Teste Unitário Básico

```typescript
import { describe, it, expect } from "vitest";

describe("MyModule", () => {
  it("should do something", () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Teste de Componente React

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent title="Hello" />);
    
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Teste com Mock de API (MSW)

```typescript
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { MyDataComponent } from "./MyDataComponent";

describe("MyDataComponent", () => {
  it("should handle API error", async () => {
    // Override handler para este teste
    server.use(
      http.get("/api/data", () => {
        return HttpResponse.json({ error: "Failed" }, { status: 500 });
      })
    );

    render(<MyDataComponent />);

    await waitFor(() => {
      expect(screen.getByText("Error loading data")).toBeInTheDocument();
    });
  });
});
```

---

## Convenções de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Arquivo de teste | `*.test.ts(x)` ou `*.spec.ts(x)` | `money.test.ts` |
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

## CI/CD Integration

Os testes são executados automaticamente via GitHub Actions em:
- Push para `main` ou `develop`
- Pull Requests para `main`

Pipeline bloqueia merge se:
- Coverage abaixo dos thresholds
- Qualquer teste falhar

---

## Status das Fases

- [x] **Fase 1:** Infraestrutura Base (Vitest, MSW, Setup) - ✅ Completo
- [x] **Fase 2:** Testes unitários backend (_shared) - ✅ 129 testes
- [x] **Fase 3:** Testes unitários frontend (lib) - ✅ 150+ testes (money.ts, logger.ts, validation.ts)
- [x] **Fase 4:** Testes de integração (hooks) - ✅ 66 testes (useUnifiedAuth, useFormManager)
- [x] **Fase 5:** Testes de Edge Functions - ✅ 200+ testes (password-policy, validators, rate-limiting)
- [ ] **Fase 6:** Testes E2E (Playwright)
- [ ] **Fase 7:** CI/CD bloqueante
