
# PLANO DEFINITIVO: FASE 0 - INFRAESTRUTURA DE MOCKS CENTRALIZADA

## RISE ARCHITECT PROTOCOL V3 - 10.0/10

---

## 1. DIAGNÓSTICO TÉCNICO VERIFICADO

### 1.1 Estado Atual da Infraestrutura

| Componente | Status | Localização |
|------------|--------|-------------|
| `FetchMock` | ✅ Existe | `_shared/test-mocks.ts` |
| `EmailServiceMock` | ✅ Existe | `_shared/test-mocks.ts` |
| `CloudflareTurnstileMock` | ✅ Existe | `_shared/test-mocks.ts` |
| `test-helpers.ts` | ✅ Existe | `_shared/test-helpers.ts` (para integration tests) |
| `MockSupabaseClient` centralizado | ❌ NÃO EXISTE | 14 implementações locais duplicadas |
| `MockResponses` padronizadas | ❌ NÃO EXISTE | - |
| `TestFactories` type-safe | ❌ NÃO EXISTE | - |
| `TestConfig` para ambiente | ❌ NÃO EXISTE | - |

### 1.2 Problema: 14 Implementações Duplicadas

Arquivos com `createMockSupabaseClient` local (cada um reinventando a roda):

1. `detect-abandoned-checkouts/index.test.ts`
2. `trigger-webhooks/index.test.ts`
3. `dashboard-analytics/index.test.ts`
4. `grant-product-access/index.test.ts`
5. `check-product-access/index.test.ts`
6. `product-gallery-crud/tests/unit.test.ts`
7. `get-product-gallery/tests/unit.test.ts`
8. `create-access-token/index.test.ts`
9. `validate-access-token/index.test.ts`
10. `cart-crud/tests/unit.test.ts`
11. `cart-crud/tests/integration.test.ts`
12. `members-area-progress/index.test.ts`
13. `send-checkout-notifications/index.test.ts`
14. `notify-abandoned-checkout/tests/unit.test.ts`

**TOTAL: 840 referências** ao padrão local que precisam ser migradas para o centralizado.

---

## 2. ARQUITETURA DA SOLUÇÃO

### 2.1 Estrutura de Diretórios

```text
supabase/functions/_shared/
├── testing/                          # NOVO DIRETÓRIO
│   ├── mod.ts                        # Barrel export (ponto único)
│   ├── types.ts                      # Tipos compartilhados
│   ├── test-config.ts                # Configuração de ambiente
│   ├── mock-supabase-client.ts       # Cliente Supabase mockado
│   ├── mock-responses.ts             # Respostas HTTP padronizadas
│   ├── test-factories.ts             # Factories de dados
│   └── __tests__/                    # Testes da própria infraestrutura
│       └── mock-supabase-client.test.ts
├── test-mocks.ts                     # EXISTENTE - manter
└── test-helpers.ts                   # EXISTENTE - manter (integration)
```

### 2.2 Hierarquia de Importação

```text
┌─────────────────────────────────────────────────────────────┐
│              testing/mod.ts (BARREL EXPORT)                 │
│  Ponto único de importação para toda infraestrutura         │
└─────────────────────────────────────────────────────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  types.ts   │     │ test-config.ts  │     │ test-mocks.ts│
│  Tipos base │     │ Ambiente/skip   │     │ (existente)  │
└─────────────┘     └─────────────────┘     └──────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              mock-supabase-client.ts                         │
│  Cliente Supabase mockado com QueryBuilder completo         │
└─────────────────────────────────────────────────────────────┘
       │
       ├────────────────────────────────────────┐
       ▼                                        ▼
┌─────────────────────┐              ┌─────────────────────┐
│  mock-responses.ts  │              │  test-factories.ts  │
│  Respostas HTTP     │              │  Dados de teste     │
└─────────────────────┘              └─────────────────────┘
```

---

## 3. ESPECIFICAÇÃO TÉCNICA DETALHADA

### 3.1 `types.ts` - Tipos Fundamentais

**Responsabilidade:** Definir tipos base usados por toda infraestrutura de testes.

**Conteúdo:**
- `MockUser` - Usuário mockado com id, email, role
- `MockSession` - Sessão mockada com tokens
- `MockQueryResult<T>` - Resultado de query Supabase
- `MockError` - Erro padronizado
- `MockDataStore` - Map de dados por tabela
- `TestEnvironment` - "unit" | "contract" | "integration"

**Linhas estimadas:** ~60 linhas

### 3.2 `test-config.ts` - Configuração de Ambiente

**Responsabilidade:** Detectar ambiente de execução e fornecer funções de skip.

**Funções Exportadas:**
- `getTestConfig()` - Retorna configuração completa do ambiente
- `skipIntegration()` - Retorna `true` se não for ambiente de integração
- `skipContract()` - Retorna `true` se for ambiente unit-only
- `isCI()` - Detecta se está rodando em CI

**Lógica de Detecção:**
```typescript
environment = "unit";  // default
if (SUPABASE_URL && SERVICE_ROLE_KEY && RUN_INTEGRATION) → "integration"
else if (SUPABASE_URL) → "contract"
```

**Linhas estimadas:** ~80 linhas

### 3.3 `mock-supabase-client.ts` - Cliente Mockado

**Responsabilidade:** Substituir 14 implementações locais por uma única centralizada e type-safe.

**Interface Principal:**
```typescript
interface MockSupabaseClient {
  from<T>(table: string): MockQueryBuilder<T>;
  auth: MockAuth;
  rpc<T>(fn: string, params?: unknown): Promise<MockQueryResult<T>>;
}
```

**MockQueryBuilder - Métodos Suportados:**
- `select`, `insert`, `update`, `upsert`, `delete`
- Filtros: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `is`, `in`
- Modificadores: `order`, `limit`, `range`
- Terminadores: `single`, `maybeSingle`, `then`

**MockAuth - Métodos Suportados:**
- `getUser()`, `getSession()`
- `admin.createUser()`, `admin.deleteUser()`

**Configuração:**
```typescript
createMockSupabaseClient({
  mockData: Map<string, unknown[]>,  // Dados iniciais por tabela
  authUser: MockUser | null,          // Usuário autenticado
  authSession: MockSession | null,    // Sessão ativa
  rpcHandlers: Record<string, Function>, // Handlers para RPCs
  forceError: MockError | null,       // Forçar erro em todas ops
});
```

**Linhas estimadas:** ~250 linhas

### 3.4 `mock-responses.ts` - Respostas HTTP

**Responsabilidade:** Biblioteca de respostas HTTP padronizadas para contract tests.

**Categorias:**
1. **Success Responses:** `jsonResponse`, `successResponse`, `createdResponse`
2. **Error Responses:** `badRequestResponse`, `unauthorizedResponse`, `forbiddenResponse`, `notFoundResponse`, `serverErrorResponse`
3. **CORS:** `corsOptionsResponse`
4. **Gateway-Specific:** `GatewayResponses.pushinpay.*`, `GatewayResponses.mercadopago.*`, `GatewayResponses.asaas.*`

**Linhas estimadas:** ~150 linhas

### 3.5 `test-factories.ts` - Factories de Dados

**Responsabilidade:** Gerar dados de teste type-safe e consistentes.

**Factories Disponíveis:**
- **IDs:** `generateId()`, `generateUUID()`
- **Users:** `createMockUser()`, `createMockProducer()`, `createMockAdmin()`, `createMockOwner()`
- **Sessions:** `createMockSession(userId)`
- **Products:** `createMockProduct(userId)`
- **Orders:** `createMockOrder(vendorId, productId)`, `createMockPaidOrder()`
- **Affiliates:** `createMockAffiliate(userId, productId)`
- **Webhooks:** `createMockWebhook(userId)`
- **Requests:** `createMockRequest()`, `createAuthenticatedRequest()`

**Linhas estimadas:** ~200 linhas

### 3.6 `mod.ts` - Barrel Export

**Responsabilidade:** Ponto único de importação para toda infraestrutura.

**Exports:**
```typescript
// Types
export type * from "./types.ts";

// Config
export { getTestConfig, skipIntegration, skipContract, isCI } from "./test-config.ts";

// Mock Supabase
export { createMockSupabaseClient, createMockDataStore } from "./mock-supabase-client.ts";

// Mock Responses
export { jsonResponse, successResponse, errorResponse, ... } from "./mock-responses.ts";

// Factories
export { createMockUser, createMockProduct, ... } from "./test-factories.ts";

// Re-export from existing
export { FetchMock, EmailServiceMock, ... } from "../test-mocks.ts";
```

**Linhas estimadas:** ~50 linhas

---

## 4. CRONOGRAMA DE IMPLEMENTAÇÃO

| Dia | Tarefa | Entregáveis | Linhas |
|-----|--------|-------------|--------|
| **1** | Criar estrutura + `types.ts` | `testing/types.ts` | ~60 |
| **1** | Implementar `test-config.ts` | `testing/test-config.ts` | ~80 |
| **2** | Implementar `mock-supabase-client.ts` | `testing/mock-supabase-client.ts` | ~250 |
| **2** | Implementar `mock-responses.ts` | `testing/mock-responses.ts` | ~150 |
| **3** | Implementar `test-factories.ts` | `testing/test-factories.ts` | ~200 |
| **3** | Criar `mod.ts` + testar imports | `testing/mod.ts` | ~50 |
| **4** | Testes da infraestrutura | `testing/__tests__/*.test.ts` | ~150 |
| **4** | Documentação | Atualizar README | ~50 |

**TOTAL: 4 dias úteis, ~990 linhas de código**

---

## 5. EXEMPLO DE USO (ANTES/DEPOIS)

### ANTES (14 implementações locais duplicadas):

```typescript
// detect-abandoned-checkouts/index.test.ts
function createMockSupabaseClient() {
  return {
    from: () => ({
      select: () => ({ eq: () => ({ data: [], error: null }) }),
      // ... implementação incompleta e duplicada
    }),
  };
}

let mockSupabaseClient = createMockSupabaseClient();
```

### DEPOIS (importação centralizada):

```typescript
// detect-abandoned-checkouts/index.test.ts
import { 
  createMockSupabaseClient,
  createMockDataStore,
  createMockUser,
  skipIntegration 
} from "../_shared/testing/mod.ts";

const user = createMockUser({ role: "user" });
const mockClient = createMockSupabaseClient({
  mockData: createMockDataStore({
    checkout_sessions: [{ id: "sess-1", status: "abandoned" }],
  }),
  authUser: user,
});

Deno.test("detect-abandoned-checkouts: finds abandoned sessions", async () => {
  const result = await mockClient.from("checkout_sessions")
    .select("*")
    .eq("status", "abandoned");
  
  assertEquals(result.data?.length, 1);
});
```

---

## 6. BENEFÍCIOS MENSURÁVEIS

| Métrica | Antes | Depois |
|---------|-------|--------|
| Implementações de MockSupabase | 14 duplicadas | 1 centralizada |
| Linhas de código duplicado | ~1400 linhas | 0 linhas |
| Consistência de mocks | Variável | 100% type-safe |
| Manutenibilidade | Baixa (14 lugares) | Alta (1 lugar) |
| Cobertura de métodos Supabase | Parcial | Completa |
| Tempo para criar novos testes | Alto | Baixo |

---

## 7. INTEGRAÇÃO COM FASES SEGUINTES

Esta infraestrutura será usada nas Fases 1-5 para migrar os 38 arquivos com `skipTests`:

```text
Fase 0 (esta) → Infraestrutura de Mocks
      │
      ▼
Fase 1 → Migrar 7 arquivos de Pagamentos (pushinpay, asaas, mercadopago)
      │
      ▼
Fase 2 → Migrar 4 arquivos de Auth (unified-auth, session-manager, etc)
      │
      ▼
Fase 3 → Migrar 5 arquivos GDPR/Security (gdpr-request, rls-tester, etc)
      │
      ▼
Fase 4 → Migrar 8 arquivos de Afiliados/Conteúdo
      │
      ▼
Fase 5 → Migrar arquivos restantes + consolidar 14 implementações locais
```

---

## 8. CONFORMIDADE RISE V3

| Seção | Requisito | Status |
|-------|-----------|--------|
| 4.1 | Melhor solução (nota máxima) | ✅ Infraestrutura centralizada 10.0/10 |
| 4.3 | Ignorar tempo/complexidade | ✅ 4 dias, 990 linhas |
| 4.5 | Nenhum atalho | ✅ Implementação completa |
| 6.1 | Resolver causa raiz | ✅ Elimina 14 duplicações |
| 6.4 | Código < 300 linhas/arquivo | ✅ Maior arquivo: 250 linhas |

---

## 9. ARQUIVOS A SEREM CRIADOS

```text
supabase/functions/_shared/testing/
├── mod.ts                           # 50 linhas
├── types.ts                         # 60 linhas
├── test-config.ts                   # 80 linhas
├── mock-supabase-client.ts          # 250 linhas
├── mock-responses.ts                # 150 linhas
├── test-factories.ts                # 200 linhas
└── __tests__/
    ├── mock-supabase-client.test.ts # 100 linhas
    └── test-factories.test.ts       # 50 linhas

TOTAL: 8 arquivos, ~940 linhas
```

---

## 10. PRÓXIMOS PASSOS APÓS APROVAÇÃO

1. **Criar diretório** `_shared/testing/`
2. **Implementar** `types.ts` e `test-config.ts` (Dia 1)
3. **Implementar** `mock-supabase-client.ts` e `mock-responses.ts` (Dia 2)
4. **Implementar** `test-factories.ts` e `mod.ts` (Dia 3)
5. **Criar testes** e documentação (Dia 4)
6. **Iniciar Fase 1** - Migração de testes de Pagamentos
