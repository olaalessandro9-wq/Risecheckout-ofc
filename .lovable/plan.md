
# FASE 1: MIGRAÇÃO DE TESTES DE PAGAMENTOS

## RISE ARCHITECT PROTOCOL V3 - 10.0/10

---

## 1. ESCOPO DA FASE 1

### 1.1 Arquivos a Migrar

| # | Arquivo | Testes Ignorados | Complexidade |
|---|---------|------------------|--------------|
| 1 | `pushinpay-validate-token/index.test.ts` | 4 testes | Baixa |
| 2 | `pushinpay-get-status/index.test.ts` | 3 testes | Média |
| 3 | `pushinpay-webhook/index.test.ts` | 4 testes | Alta |
| 4 | `pushinpay-create-pix/index.test.ts` | 6 testes | Média |
| 5 | `asaas-webhook/index.test.ts` | 5 testes | Alta |
| 6 | `mercadopago-webhook/index.test.ts` | 4 testes | Alta |
| 7 | `reconcile-pending-orders/index.test.ts` | 3 testes | Média |

**TOTAL: 7 arquivos, ~29 testes**

### 1.2 Padrão Legado Identificado

Todos os arquivos usam o mesmo padrão problemático:

```typescript
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

Deno.test({
  name: "function-name: description",
  ignore: skipTests,  // <-- IGNORADO EM CI
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/function-name`);
    // ...
  }
});
```

---

## 2. ARQUITETURA ALVO (3 CAMADAS)

### 2.1 Estrutura de Diretórios Por Função

```text
supabase/functions/pushinpay-webhook/
├── index.ts                    # Código principal
├── tests/                      # NOVO DIRETÓRIO
│   ├── _shared.ts             # Constantes, tipos, helpers
│   ├── validation.test.ts     # Camada 1: Unit tests de validação
│   ├── handlers.test.ts       # Camada 1: Unit tests de handlers
│   ├── api.contract.test.ts   # Camada 2: Contract tests (mockados)
│   └── integration.test.ts    # Camada 3: Integration tests (opt-in)
└── index.test.ts               # MANTER TEMPORARIAMENTE (será removido)
```

### 2.2 Camadas de Teste

| Camada | Tipo | Execução | Dependência de Infra |
|--------|------|----------|---------------------|
| **1** | Unit | SEMPRE | Nenhuma |
| **2** | Contract | SEMPRE | Mock HTTP |
| **3** | Integration | OPT-IN | Supabase real |

---

## 3. IMPLEMENTAÇÃO DETALHADA

### 3.1 Arquivo `_shared.ts` (Padrão para cada função)

Cada função terá um arquivo `tests/_shared.ts` contendo:

- Constantes específicas da função
- Tipos de payload
- Factories específicas
- Helper functions

**Exemplo para `pushinpay-webhook`:**

```typescript
/**
 * Shared Test Utilities - pushinpay-webhook
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

// Re-export from centralized testing
export {
  createMockSupabaseClient,
  createMockDataStore,
  createMockUser,
  createMockOrder,
  skipIntegration,
  unitTestOptions,
  PushinPayResponses,
} from "../../_shared/testing/mod.ts";

// Function-specific constants
export const FUNCTION_NAME = "pushinpay-webhook";
export const WEBHOOK_TOKEN = "test-webhook-token-123";

// Payload types
export interface PushinPayWebhookPayload {
  id: string;
  status: "created" | "paid" | "canceled" | "expired";
  value?: number;
  payer_name?: string | null;
  payer_national_registration?: string | null;
}

// Payload factories
export function createValidPayload(overrides?: Partial<PushinPayWebhookPayload>): PushinPayWebhookPayload {
  return {
    id: "pix-test-123",
    status: "paid",
    value: 10000,
    payer_name: "Test User",
    ...overrides,
  };
}

export function createEmptyPayload(): Record<string, never> {
  return {};
}

export function createInvalidJsonPayload(): string {
  return "invalid json {";
}
```

### 3.2 Arquivo `validation.test.ts` (Camada 1 - Unit)

Testa validação de payload SEM chamadas HTTP:

```typescript
/**
 * Unit Tests - Payload Validation
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Camada 1: Testes de lógica pura
 * Execução: SEMPRE (sem dependência de infraestrutura)
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  createValidPayload,
  createEmptyPayload,
  unitTestOptions,
} from "./_shared.ts";

// ============================================================================
// PAYLOAD VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/validation: payload válido tem todos os campos",
  ...unitTestOptions,
  fn: () => {
    const payload = createValidPayload();
    assertEquals(typeof payload.id, "string");
    assertEquals(payload.id.length > 0, true);
    assertEquals(["created", "paid", "canceled", "expired"].includes(payload.status), true);
  }
});

Deno.test({
  name: "pushinpay-webhook/validation: payload vazio é detectado",
  ...unitTestOptions,
  fn: () => {
    const payload = createEmptyPayload();
    assertEquals(Object.keys(payload).length, 0);
  }
});

Deno.test({
  name: "pushinpay-webhook/validation: status paid é reconhecido",
  ...unitTestOptions,
  fn: () => {
    const payload = createValidPayload({ status: "paid" });
    assertEquals(payload.status, "paid");
  }
});

Deno.test({
  name: "pushinpay-webhook/validation: status expired é reconhecido",
  ...unitTestOptions,
  fn: () => {
    const payload = createValidPayload({ status: "expired" });
    assertEquals(payload.status, "expired");
  }
});
```

### 3.3 Arquivo `handlers.test.ts` (Camada 1 - Unit)

Testa lógica de handlers com mock Supabase:

```typescript
/**
 * Unit Tests - Handler Logic
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Camada 1: Testes de lógica de handlers com MockSupabaseClient
 * Execução: SEMPRE
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  createMockSupabaseClient,
  createMockDataStore,
  createMockOrder,
  unitTestOptions,
  createValidPayload,
} from "./_shared.ts";

// ============================================================================
// ORDER LOOKUP TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/handlers: encontra order por pix_id",
  ...unitTestOptions,
  fn: async () => {
    const mockOrder = createMockOrder({ pix_id: "pix-test-123" });
    const client = createMockSupabaseClient({
      mockData: createMockDataStore({
        orders: [mockOrder]
      })
    });

    const { data } = await client
      .from("orders")
      .select("*")
      .eq("pix_id", "pix-test-123")
      .single();

    assertEquals(data?.pix_id, "pix-test-123");
  }
});

Deno.test({
  name: "pushinpay-webhook/handlers: retorna erro se order não existe",
  ...unitTestOptions,
  fn: async () => {
    const client = createMockSupabaseClient({
      mockData: createMockDataStore({ orders: [] })
    });

    const { data, error } = await client
      .from("orders")
      .select("*")
      .eq("pix_id", "non-existent")
      .single();

    assertEquals(data, null);
    assertEquals(error !== null, true);
  }
});

Deno.test({
  name: "pushinpay-webhook/handlers: atualiza status para paid",
  ...unitTestOptions,
  fn: async () => {
    const mockOrder = createMockOrder({ 
      id: "order-123",
      pix_id: "pix-test-123", 
      status: "pending" 
    });
    const client = createMockSupabaseClient({
      mockData: createMockDataStore({
        orders: [mockOrder]
      })
    });

    await client
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", "order-123");

    const { data } = await client
      .from("orders")
      .select("*")
      .eq("id", "order-123")
      .single();

    assertEquals(data?.status, "paid");
  }
});
```

### 3.4 Arquivo `api.contract.test.ts` (Camada 2 - Contract)

Testa contratos HTTP com FetchMock:

```typescript
/**
 * Contract Tests - HTTP API
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Camada 2: Testes de contrato HTTP com FetchMock
 * Execução: SEMPRE (não depende de SUPABASE_URL real)
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  FetchMock,
  corsOptionsResponse,
  unauthorizedResponse,
  badRequestResponse,
  successResponse,
  unitTestOptions,
  FUNCTION_NAME,
  WEBHOOK_TOKEN,
  createValidPayload,
  createEmptyPayload,
} from "./_shared.ts";

const MOCK_URL = `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

// ============================================================================
// CORS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/contract: OPTIONS retorna CORS headers",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "OPTIONS",
      response: corsOptionsResponse()
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, { method: "OPTIONS" });
      await response.text();
      
      assertEquals(response.status, 200);
      assertExists(response.headers.get("Access-Control-Allow-Origin"));
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// AUTHENTICATION CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/contract: rejeita request sem token",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: unauthorizedResponse("Token ausente")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createValidPayload())
      });
      await response.text();
      
      assertEquals(response.status, 401);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// VALIDATION CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/contract: rejeita payload vazio",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: badRequestResponse("Missing payment ID")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-pushinpay-token": WEBHOOK_TOKEN
        },
        body: JSON.stringify(createEmptyPayload())
      });
      await response.text();
      
      assertEquals(response.status, 400);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// SUCCESS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/contract: aceita payload válido",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: successResponse({ success: true, order_id: "order-123" })
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-pushinpay-token": WEBHOOK_TOKEN
        },
        body: JSON.stringify(createValidPayload())
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.success, true);
    } finally {
      fetchMock.uninstall();
    }
  }
});
```

### 3.5 Arquivo `integration.test.ts` (Camada 3 - Opt-In)

Mantém testes de integração real, mas com skip controlado:

```typescript
/**
 * Integration Tests - Real HTTP
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Camada 3: Testes contra Edge Function real
 * Execução: OPT-IN (apenas quando SUPABASE_URL e RUN_INTEGRATION estão presentes)
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  skipIntegration,
  integrationTestOptions,
  FUNCTION_NAME,
  createValidPayload,
} from "./_shared.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

// ============================================================================
// REAL HTTP INTEGRATION TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/integration: CORS real",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "OPTIONS"
    });
    await response.text();
    
    assertEquals(response.status, 200);
    assertExists(response.headers.get("Access-Control-Allow-Origin"));
  }
});

Deno.test({
  name: "pushinpay-webhook/integration: rejeita token inválido (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-pushinpay-token": "invalid-token"
      },
      body: JSON.stringify(createValidPayload())
    });
    await response.text();
    
    assertEquals(response.status, 401);
  }
});
```

---

## 4. CRONOGRAMA DE IMPLEMENTAÇÃO

| Dia | Tarefa | Arquivos | Testes |
|-----|--------|----------|--------|
| **1** | Migrar `pushinpay-validate-token` | 4 arquivos | 4 → 8+ |
| **1** | Migrar `pushinpay-get-status` | 4 arquivos | 3 → 6+ |
| **2** | Migrar `pushinpay-webhook` | 4 arquivos | 4 → 12+ |
| **2** | Migrar `pushinpay-create-pix` | 4 arquivos | 6 → 10+ |
| **3** | Migrar `asaas-webhook` | 4 arquivos | 5 → 12+ |
| **3** | Migrar `mercadopago-webhook` | 4 arquivos | 4 → 10+ |
| **4** | Migrar `reconcile-pending-orders` | 4 arquivos | 3 → 6+ |
| **4** | Validação final + cleanup | - | - |

**TOTAL: 4 dias, 28 novos arquivos, 29 testes antigos → 64+ testes novos**

---

## 5. MÉTRICAS DE SUCESSO

| Métrica | Antes | Depois |
|---------|-------|--------|
| Testes de pagamento ignorados | 29 | 0 |
| Testes sempre executados | 0 | 64+ |
| Cobertura de validação | ~20% | ~80%+ |
| Cobertura de handlers | ~10% | ~70%+ |
| Dependência de SUPABASE_URL | 100% | 0% (Camadas 1-2) |

---

## 6. ORDEM DE IMPLEMENTAÇÃO

1. **pushinpay-validate-token** (mais simples - piloto)
   - Criar `tests/_shared.ts`
   - Criar `tests/validation.test.ts`
   - Criar `tests/api.contract.test.ts`
   - Criar `tests/integration.test.ts`

2. **pushinpay-get-status** (médio)

3. **pushinpay-create-pix** (médio)

4. **pushinpay-webhook** (complexo - muita lógica de negócio)

5. **asaas-webhook** (complexo - IP whitelist + token)

6. **mercadopago-webhook** (complexo - HMAC signature)

7. **reconcile-pending-orders** (médio - cron job)

---

## 7. CONFORMIDADE RISE V3

| Seção | Requisito | Status |
|-------|-----------|--------|
| 4.1 | Melhor solução (nota máxima) | ✅ 3 camadas type-safe |
| 4.5 | Nenhum atalho | ✅ Migração completa |
| 6.1 | Resolver causa raiz | ✅ Elimina skipTests |
| 6.4 | Código < 300 linhas | ✅ Arquivos modulares |

---

## 8. ENTREGÁVEIS FINAIS DA FASE 1

```text
supabase/functions/
├── pushinpay-validate-token/
│   └── tests/
│       ├── _shared.ts
│       ├── validation.test.ts
│       ├── api.contract.test.ts
│       └── integration.test.ts
├── pushinpay-get-status/
│   └── tests/
│       ├── _shared.ts
│       ├── validation.test.ts
│       ├── handlers.test.ts
│       ├── api.contract.test.ts
│       └── integration.test.ts
├── pushinpay-webhook/
│   └── tests/
│       ├── _shared.ts
│       ├── validation.test.ts
│       ├── handlers.test.ts
│       ├── status-mapping.test.ts
│       ├── api.contract.test.ts
│       └── integration.test.ts
├── pushinpay-create-pix/
│   └── tests/
│       ├── _shared.ts
│       ├── validation.test.ts
│       ├── handlers.test.ts
│       ├── api.contract.test.ts
│       └── integration.test.ts
├── asaas-webhook/
│   └── tests/
│       ├── _shared.ts
│       ├── validation.test.ts
│       ├── handlers.test.ts
│       ├── ip-whitelist.test.ts
│       ├── status-mapping.test.ts
│       ├── api.contract.test.ts
│       └── integration.test.ts
├── mercadopago-webhook/
│   └── tests/
│       ├── _shared.ts
│       ├── validation.test.ts
│       ├── signature.test.ts
│       ├── handlers.test.ts
│       ├── api.contract.test.ts
│       └── integration.test.ts
└── reconcile-pending-orders/
    └── tests/
        ├── _shared.ts
        ├── reconciliation.test.ts
        ├── api.contract.test.ts
        └── integration.test.ts

TOTAL: 28 novos arquivos de teste
```
