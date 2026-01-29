
# Plano Mestre: Sistema de Testes Automatizados RiseCheckout

## RISE V3 Analysis - Sistema de Notas Obrigatório

### Solução A: Testes Incrementais Ad-Hoc
- **Manutenibilidade:** 5/10 - Sem padrões consistentes, cada teste difere
- **Zero DT:** 4/10 - Acumula debt com o tempo pela falta de estrutura
- **Arquitetura:** 4/10 - Sem estratégia de pirâmide, testes frágeis
- **Escalabilidade:** 3/10 - Não escala para 180.000+ linhas de código
- **Segurança:** 6/10 - Cobertura inconsistente de fluxos críticos
- **NOTA FINAL: 4.4/10**
- Tempo estimado: 2-3 semanas

### Solução B: Pirâmide de Testes Completa com Infraestrutura Enterprise
- **Manutenibilidade:** 10/10 - Padrões rígidos, factories, helpers reutilizáveis
- **Zero DT:** 10/10 - CI/CD bloqueante, cobertura mínima obrigatória
- **Arquitetura:** 10/10 - Pirâmide 70/20/10, separação clara de responsabilidades
- **Escalabilidade:** 10/10 - Suporta crescimento infinito da base de código
- **Segurança:** 10/10 - Todos os fluxos de pagamento e auth cobertos
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2-4 meses

### DECISAO: Solucao B (Nota 10.0)
A Solução A viola diretamente a LEI SUPREMA do RISE Protocol V3. Mesmo que demore meses, implementaremos a arquitetura de testes completa seguindo a regra "1 ano vs 5 minutos".

---

## Visao Geral da Arquitetura de Testes

```text
    ┌─────────────────────────────────────────────────────┐
    │           PIRÂMIDE DE TESTES RISECHECKOUT           │
    └─────────────────────────────────────────────────────┘
                           ▲
                          /│\
                         / │ \
                        /  │  \
                       / E2E │   \          ~10%
                      /  (10) │    \        Playwright
                     /────────┴─────\
                    /                 \
                   /   INTEGRAÇÃO      \    ~20%
                  /      (~40)          \   Vitest + MSW
                 /───────────────────────\
                /                         \
               /      UNITÁRIOS            \  ~70%
              /        (~150+)              \ Vitest
             /───────────────────────────────\
```

---

## Fase 1: Infraestrutura Base (Prioridade CRITICA)

### 1.1 Instalacao de Dependencias

**Arquivo:** `package.json`

Adicionar ao `devDependencies`:

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^25.0.0",
    "vitest": "^3.2.4",
    "msw": "^2.8.0",
    "@vitest/coverage-v8": "^3.2.4",
    "@vitest/ui": "^3.2.4"
  }
}
```

### 1.2 Configuracao do Vitest

**Novo arquivo:** `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/test/**",
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 1.3 Setup de Testes

**Novo arquivo:** `src/test/setup.ts`

```typescript
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### 1.4 Scripts de Teste

**Arquivo:** `package.json` (scripts)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:edge": "cd supabase/functions && ./run-tests.sh"
  }
}
```

### 1.5 Atualizacao TypeScript

**Arquivo:** `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

### 1.6 MSW Handlers Base

**Novo arquivo:** `src/test/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from "msw";

const API_URL = "https://api.risecheckout.com";

export const handlers = [
  // Auth handlers
  http.post(`${API_URL}/unified-auth/validate`, () => {
    return HttpResponse.json({ valid: false });
  }),
  
  http.post(`${API_URL}/unified-auth/login`, async ({ request }) => {
    const body = await request.json();
    // Mock login logic
    return HttpResponse.json({
      success: true,
      user: { id: "test-user", email: body.email, name: "Test User" },
      roles: ["seller"],
      activeRole: "seller",
    });
  }),
];
```

**Novo arquivo:** `src/test/mocks/server.ts`

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

---

## Fase 2: Testes Unitarios Backend (_shared)

Prioridade ordenada por risco financeiro/operacional.

### 2.1 fee-calculator.ts (CRITICO - Financeiro)

**Novo arquivo:** `supabase/functions/_shared/fee-calculator.test.ts`

Cenarios de teste:
- `calculatePlatformFeeCents` com valores inteiros
- `calculatePlatformFeeCents` com taxa customizada
- `calculatePlatformFeeReais` para APIs que usam float
- `getPlatformFeePercentFormatted` formatacao
- `calculateAffiliateCommission` modelo Cakto completo
- Edge cases: zero, negativos, valores muito grandes

### 2.2 idempotency.ts (CRITICO - Cobranças Duplicadas)

**Novo arquivo:** `supabase/functions/_shared/idempotency.test.ts`

Cenarios de teste:
- `hashRequest` gera hashes deterministicos
- `generateIdempotencyKey` formato correto
- `checkIdempotency` permite primeira tentativa
- `checkIdempotency` bloqueia duplicata
- `checkIdempotency` permite retry apos falha
- `checkIdempotency` detecta payload diferente com mesma key
- Timeout de 60s marca como failed

### 2.3 coupon-validation.ts

**Novo arquivo:** `supabase/functions/_shared/coupon-validation.test.ts`

Cenarios de teste:
- `validateCouponPayload` codigo valido
- `validateCouponPayload` codigo muito curto/longo
- `validateCouponPayload` desconto > 99%
- `validateCouponPayload` tipo diferente de percentage
- `checkDuplicateCouponCode` detecta duplicata
- `verifyProductOwnership` valida dono

### 2.4 grant-members-access.ts

**Novo arquivo:** `supabase/functions/_shared/grant-members-access.test.ts`

Cenarios de teste:
- Produto sem area de membros retorna hasMembersArea: false
- Cria novo user quando nao existe
- Usa user existente quando encontra
- Cria buyer_product_access
- Atribui ao grupo da oferta
- Atribui ao grupo padrao se oferta nao tem grupo
- Gera invite token para novos buyers
- Nao gera invite token para buyers com senha

---

## Fase 3: Testes Unitarios Frontend (lib)

### 3.1 money.ts (CRITICO - Exibicao de Precos)

**Novo arquivo:** `src/lib/money.test.ts`

Cenarios de teste:
- `toCents` string "19,90" retorna 1990
- `toCents` string "R$ 1.234,56" retorna 123456
- `toCents` number 19.90 retorna 1990
- `toCents` number inteiro 1990 retorna 1990
- `toCents` null/undefined retorna 0
- `toCents` string invalida retorna 0
- `parseBRLInput` formato brasileiro
- `toReais` converte centavos para reais
- `formatCentsToBRL` formata com simbolo
- `formatCentsToBRL` formata sem simbolo
- `sumCents` soma multiplos valores
- `applyDiscount` aplica percentual
- `applyDiscount` rejeita percentual invalido
- `calculateDiscountPercent` calcula corretamente
- `isValidAmount` valida positivo inteiro
- `isValidAmount` rejeita negativo/zero

### 3.2 logger.ts

**Novo arquivo:** `src/lib/logger.test.ts`

Cenarios de teste:
- `createLogger` retorna objeto com metodos
- Cada nivel (debug, info, warn, error) funciona
- Prefixo do modulo aparece nas mensagens

### 3.3 validation.ts

**Novo arquivo:** `src/lib/validation.test.ts`

Cenarios de teste:
- Validacao de email
- Validacao de CPF (digitos verificadores)
- Validacao de telefone brasileiro
- Sanitizacao de inputs

---

## Fase 4: Testes de Integracao Frontend (hooks)

### 4.1 useUnifiedAuth.ts (CRITICO - Autenticacao)

**Novo arquivo:** `src/hooks/useUnifiedAuth.test.tsx`

Cenarios de teste:
- Estado inicial: isAuthenticated false, isLoading true
- Apos validacao com sucesso: user populado
- Login bem sucedido atualiza estado
- Login falho retorna erro
- Logout limpa estado
- switchContext muda activeRole
- Role checks (isProducer, isBuyer) funcionam

### 4.2 useFormManager.ts

**Novo arquivo:** `src/hooks/checkout/useFormManager.test.tsx`

Cenarios de teste:
- Estado inicial vazio
- updateField atualiza campo e limpa erro
- updateMultipleFields atualiza varios campos
- toggleBump adiciona/remove bump
- calculateTotal soma produto + bumps
- validateForm detecta campos obrigatorios faltando
- validateForm aceita snapshot override
- Hydration do localStorage funciona
- Nao salva CPF no localStorage (LGPD)

### 4.3 useCheckoutSubmit.ts

**Novo arquivo:** `src/hooks/checkout/useCheckoutSubmit.test.tsx`

Cenarios de teste:
- Valida formulario antes de submeter
- Chama create-order com payload correto
- Trata erro de rede
- Trata erro de validacao do backend
- Redireciona apos sucesso

---

## Fase 5: Testes de Integracao Backend (Edge Functions)

### 5.1 unified-auth (handlers)

**Novo arquivo:** `supabase/functions/unified-auth/index.test.ts`

Cenarios de teste:
- Login com credenciais validas
- Login com email inexistente
- Login com senha incorreta
- Validate com sessao valida
- Validate com token expirado
- Refresh com refresh token valido
- Refresh com refresh token invalido
- Logout invalida sessao
- Switch context para role valida
- Switch context para role nao permitida

### 5.2 create-order (expandir testes existentes)

**Arquivo:** `supabase/functions/create-order/index.test.ts`

Novos cenarios:
- Cria order com cupom valido
- Aplica desconto do cupom corretamente
- Rejeita cupom expirado
- Cria order com order bumps
- Calcula total com bumps corretamente
- Salva dados do afiliado quando presente
- Calcula comissao do afiliado (modelo Cakto)

### 5.3 Webhooks de Pagamento

**Expandir:** `supabase/functions/mercadopago-webhook/index.test.ts`

Novos cenarios:
- Processa payment.approved e atualiza order
- Processa refund e revoga acesso
- Idempotencia previne processamento duplicado
- Dispara trigger-webhooks apos aprovacao

**Novo arquivo:** `supabase/functions/asaas-webhook/index.test.ts`

Cenarios similares para Asaas.

**Novo arquivo:** `supabase/functions/stripe-webhook/index.test.ts`

Cenarios similares para Stripe.

---

## Fase 6: Testes E2E (Playwright)

### 6.1 Fluxo de Checkout Completo

**Novo arquivo:** `e2e/checkout-flow.spec.ts`

Cenarios:
- Acessa pagina de checkout
- Preenche dados pessoais
- Seleciona metodo de pagamento PIX
- Visualiza QR Code
- Seleciona metodo de pagamento Cartao
- Preenche dados do cartao
- Finaliza compra com sucesso
- Visualiza pagina de obrigado

### 6.2 Fluxo de Autenticacao

**Novo arquivo:** `e2e/auth-flow.spec.ts`

Cenarios:
- Acessa pagina de login
- Login com credenciais validas
- Redireciona para dashboard
- Troca contexto para buyer
- Troca contexto para seller
- Logout funciona

### 6.3 Fluxo de Criacao de Produto

**Novo arquivo:** `e2e/product-creation.spec.ts`

Cenarios:
- Acessa pagina de criacao
- Preenche dados do produto
- Configura precos e ofertas
- Ativa area de membros
- Publica produto
- Acessa checkout gerado

---

## Fase 7: CI/CD Pipeline

### 7.1 GitHub Actions Atualizado

**Arquivo:** `.github/workflows/test.yml`

```yaml
name: Testes Automatizados

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Frontend Tests
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  # Edge Function Tests
  edge-function-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1
      - env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: cd supabase/functions && ./run-tests.sh

  # E2E Tests (only on main)
  e2e-tests:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm exec playwright test
```

---

## Estrutura Final de Arquivos de Teste

```text
risecheckout/
├── src/
│   ├── test/
│   │   ├── setup.ts                    # Setup global
│   │   ├── utils.tsx                   # Render helpers
│   │   └── mocks/
│   │       ├── handlers.ts             # MSW handlers
│   │       └── server.ts               # MSW server
│   ├── lib/
│   │   ├── money.test.ts               # Testes money.ts
│   │   ├── logger.test.ts              # Testes logger
│   │   └── validation.test.ts          # Testes validacao
│   └── hooks/
│       ├── useUnifiedAuth.test.tsx     # Testes auth hook
│       └── checkout/
│           ├── useFormManager.test.tsx
│           └── useCheckoutSubmit.test.tsx
├── supabase/functions/
│   ├── _shared/
│   │   ├── fee-calculator.test.ts
│   │   ├── idempotency.test.ts
│   │   ├── coupon-validation.test.ts
│   │   └── grant-members-access.test.ts
│   ├── create-order/
│   │   └── index.test.ts               # Expandido
│   ├── unified-auth/
│   │   └── index.test.ts               # Novo
│   └── mercadopago-webhook/
│       └── index.test.ts               # Expandido
├── e2e/
│   ├── checkout-flow.spec.ts
│   ├── auth-flow.spec.ts
│   └── product-creation.spec.ts
├── vitest.config.ts
└── .github/workflows/test.yml
```

---

## Cronograma de Implementacao

| Fase | Descricao | Duracao Estimada |
|------|-----------|------------------|
| 1 | Infraestrutura Base | 1 semana |
| 2 | Testes Unitarios Backend | 2-3 semanas |
| 3 | Testes Unitarios Frontend | 2-3 semanas |
| 4 | Testes Integracao Frontend | 2-3 semanas |
| 5 | Testes Integracao Backend | 2-3 semanas |
| 6 | Testes E2E | 2-3 semanas |
| 7 | CI/CD Pipeline | 1 semana |

**Total Estimado:** 12-17 semanas (3-4 meses)

---

## Metricas de Sucesso

| Metrica | Meta Fase 1 | Meta Final |
|---------|-------------|------------|
| Cobertura Geral | 30% | 70%+ |
| Modulos Criticos | 80% | 95%+ |
| Testes Unitarios | 50 | 150+ |
| Testes Integracao | 10 | 40+ |
| Testes E2E | 1 | 10+ |
| CI/CD | Manual | Automatico/Bloqueante |

---

## Proximos Passos Imediatos

1. **Configurar Vitest e dependencias** (Fase 1.1-1.5)
2. **Criar setup de testes** com mocks globais
3. **Implementar testes fee-calculator.ts** (maior risco financeiro)
4. **Implementar testes money.ts** (maior uso no frontend)
5. **Configurar CI/CD** para bloquear merges sem testes

Este plano garante que o RiseCheckout atingira o padrao de qualidade exigido pelo RISE Protocol V3, com Manutenibilidade Infinita e Zero Divida Tecnica.
