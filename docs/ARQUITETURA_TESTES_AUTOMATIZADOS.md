# Arquitetura de Testes Automatizados - RiseCheckout

**Status:** ✅ IMPLEMENTADO  
**Última atualização:** 01 de Fevereiro de 2026  
**Versão:** 3.0.0  
**RISE Protocol:** V3 Compliant

---

## Visão Geral

O RiseCheckout implementa uma arquitetura de testes em múltiplas camadas, seguindo o RISE Protocol V3:

| Camada | Framework | Localização | Cobertura |
|--------|-----------|-------------|-----------|
| Unit Tests | Vitest | `src/**/*.test.ts` | 70% |
| Integration Tests | Vitest | `src/**/*.test.tsx` | 20% |
| E2E Tests | Playwright | `e2e/**/*.spec.ts` | 10% |
| Edge Functions | Deno | `supabase/functions/**/tests/*.test.ts` | 80%+ |

---

## PADRÃO ÚNICO: skipIntegration()

### ⚠️ REGRA ABSOLUTA

O **ÚNICO** padrão aceito para controlar execução de testes de integração é:

```typescript
import { skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

Deno.test({
  name: "function-name/integration: test description",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    // test implementation
  },
});
```

### ❌ PROIBIDO (Dívida Técnica)

```typescript
// ❌ NUNCA FAZER - Definição local de skipTests
const skipTests = !SUPABASE_URL || ...;

// ❌ NUNCA FAZER - Hardcode de credentials
export const SUPABASE_URL = "https://...";
export const SUPABASE_ANON_KEY = "eyJ...";

// ❌ NUNCA FAZER - Variável local para skip
const isMockUrl = !supabaseUrl || supabaseUrl.includes('test.supabase.co');
```

---

## Estrutura de Diretórios

### Estrutura Canônica para Edge Functions

```text
supabase/functions/
├── function-name/
│   ├── index.ts                 # Código da função
│   ├── handlers/                # Handlers internos (se aplicável)
│   └── tests/                   # Diretório ÚNICO para testes
│       ├── _shared.ts           # Tipos, factories, helpers
│       ├── fixtures/            # Fixtures específicas (opcional)
│       ├── unit.test.ts         # Testes de unidade
│       ├── validation.test.ts   # Testes de validação
│       ├── integration.test.ts  # Testes de integração (skipIntegration)
│       └── handlers/            # Testes de handlers (opcional)
└── _shared/
    └── testing/
        ├── mod.ts               # Barrel export (fonte da verdade)
        ├── types.ts             # Tipos compartilhados
        ├── test-config.ts       # skipIntegration(), skipContract(), etc.
        ├── test-factories.ts    # Factories type-safe
        ├── mock-supabase-client.ts # Mock Supabase
        └── mock-responses.ts    # Respostas HTTP mockadas
```

### ❌ Estruturas Proibidas

```text
# NUNCA CRIAR:
function-name/index.test.ts      # Usar tests/unit.test.ts
function-name/__tests__/         # Usar tests/
function-name/__fixtures__/      # Usar tests/fixtures/
```

---

## Funções de Skip

| Função | Uso | Retorno |
|--------|-----|---------|
| `skipIntegration()` | Testes que requerem Supabase real + SERVICE_ROLE_KEY | `true` se não é ambiente integration |
| `skipContract()` | Testes que requerem apenas SUPABASE_URL | `true` se é ambiente unit |
| `isCI()` | Detecta ambiente CI/CD | `true` se está em CI |
| `runUnit()` | Testes de unidade (sempre rodam) | `true` sempre |

---

## Comandos de Execução

### Frontend (Vitest)
```bash
# Rodar todos os testes
npm run test

# Rodar com cobertura
npm run test:coverage

# Rodar em modo watch
npm run test:watch
```

### Edge Functions (Deno)
```bash
# Rodar todos os testes de uma função
cd supabase/functions && deno test function-name/tests/ --allow-net --allow-env

# Rodar com ambiente de integração
RUN_INTEGRATION_TESTS=true deno test --allow-net --allow-env
```

### E2E (Playwright)
```bash
# Rodar testes E2E
npm run test:e2e
```

---

## Imports Obrigatórios

Todo arquivo de teste de Edge Function DEVE importar de `_shared/testing/mod.ts`:

```typescript
import {
  // Test config
  skipIntegration,
  skipContract,
  integrationTestOptions,
  unitTestOptions,
  
  // Factories
  createMockUser,
  createMockRequest,
  createAuthenticatedRequest,
  
  // Mock Supabase
  createMockSupabaseClient,
  createMockDataStore,
  
  // Responses
  jsonResponse,
  badRequestResponse,
  unauthorizedResponse,
} from "../../_shared/testing/mod.ts";
```

---

## CI/CD Workflows

Os workflows do GitHub Actions estão configurados em `.github/workflows/`:

- `ci.yml` - Pipeline principal de CI
- `security-scan.yml` - Análise de segurança (TruffleHog, Dependency Audit, CodeQL)

---

## Checklist de Validação

Antes de fazer merge de novos testes:

- [ ] Usa `skipIntegration()` de `_shared/testing/mod.ts`?
- [ ] Testes estão em `tests/` (não em raiz ou `__tests__`)?
- [ ] Sem credenciais hardcoded?
- [ ] Imports centralizados de `mod.ts`?
- [ ] Nomenclatura: `function-name/layer: description`?

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| V3.0.0 | 2026-02-01 | Unificação de guards (`skipIntegration()` único padrão) |
| V3.0.0 | 2026-02-01 | Remoção de `skipTests` local |
| V3.0.0 | 2026-02-01 | Consolidação de estruturas (`tests/` canônico) |
| V3.0.0 | 2026-02-01 | Remoção de credenciais hardcoded |
| V2.0.0 | 2026-01-15 | Adição de infraestrutura centralizada |

---

**Documentação completa dos cenários de teste nos próprios arquivos `.test.ts`.**
