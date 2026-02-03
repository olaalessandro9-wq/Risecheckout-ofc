
# Plano: Mensagens de Erro Específicas em Português para Checkout Público

## Contexto

A Edge Function `resolve-universal` retorna 4 tipos de erro específicos:
- `NOT_FOUND` - Checkout/Payment Link não existe
- `NO_CHECKOUT` - Payment Link sem checkout configurado
- `INACTIVE` - Link inativo
- `BLOCKED` - Produto bloqueado

No entanto, o frontend atualmente:
1. Ignora o campo `reason` retornado pelo backend
2. Usa `FETCH_FAILED` genérico para todos os erros de fetch
3. Não tem mensagens específicas para `NO_CHECKOUT`, `INACTIVE` e `BLOCKED`

## Análise de Soluções (RISE Protocol V3 Seção 4.4)

### Solução A: Apenas Adicionar Mensagens no CheckoutErrorDisplay

Adicionar as mensagens no componente, mas manter o mapeamento genérico no actor.

- Manutenibilidade: 7/10 (mensagens desconectadas da origem)
- Zero DT: 6/10 (reason do backend ignorado)
- Arquitetura: 6/10 (fluxo de dados incompleto)
- Escalabilidade: 7/10 (difícil adicionar novos erros)
- Segurança: 10/10
- **NOTA FINAL: 7.2/10**
- Tempo estimado: 15 minutos

### Solução B: Propagação Completa de Error Reasons

Modificar todo o fluxo para propagar o `reason` do backend até o frontend:
1. Atualizar `FetchCheckoutOutput` para incluir `reason`
2. Atualizar `fetchCheckoutDataActor` para capturar e propagar `reason`
3. Criar função específica `createBackendError` que usa o reason original
4. Atualizar tipos `ErrorReason` com novos valores
5. Atualizar `CheckoutErrorDisplay` com todas as mensagens em português

- Manutenibilidade: 10/10 (fluxo de dados completo e rastreável)
- Zero DT: 10/10 (zero informação perdida)
- Arquitetura: 10/10 (SOLID, dados fluem corretamente)
- Escalabilidade: 10/10 (fácil adicionar novos error reasons)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 30 minutos

### DECISÃO: Solução B (Nota 10.0)

Conforme Lei Suprema: A melhor solução VENCE. SEMPRE.

---

## Arquivos a Modificar

```text
src/modules/checkout-public/machines/checkoutPublicMachine.types.ts  # Adicionar reasons
src/modules/checkout-public/machines/checkoutPublicMachine.actors.ts # Propagar reason
src/modules/checkout-public/machines/checkoutPublicMachine.actions.ts # Nova função
src/modules/checkout-public/machines/checkoutPublicMachine.ts        # Usar nova função
src/modules/checkout-public/components/CheckoutErrorDisplay.tsx       # Mensagens PT-BR
```

---

## Alterações Detalhadas

### 1. Atualizar ErrorReason Types

**Arquivo:** `checkoutPublicMachine.types.ts`

Adicionar novos error reasons do backend:

```typescript
export type ErrorReason = 
  | 'FETCH_FAILED'
  | 'VALIDATION_FAILED'
  | 'CHECKOUT_NOT_FOUND'  // Já existe
  | 'PRODUCT_UNAVAILABLE' // Já existe
  | 'SUBMIT_FAILED'
  | 'PAYMENT_FAILED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'
  // Novos do backend (resolve-universal)
  | 'NOT_FOUND'    // Slug não existe como checkout nem payment_link
  | 'NO_CHECKOUT'  // Payment Link sem checkout configurado
  | 'INACTIVE'     // Link inativo
  | 'BLOCKED';     // Produto bloqueado
```

Adicionar campo `reason` ao `FetchCheckoutOutput`:

```typescript
export interface FetchCheckoutOutput {
  success: boolean;
  data?: unknown;
  error?: string;
  reason?: string; // Error reason from backend
}
```

### 2. Propagar Reason no Actor

**Arquivo:** `checkoutPublicMachine.actors.ts`

Atualizar para capturar e retornar o `reason`:

```typescript
if (!data?.success) {
  return {
    success: false,
    error: data?.error || "Checkout não encontrado",
    reason: data?.reason || undefined, // Propagar reason do backend
  };
}
```

### 3. Criar Função de Erro com Reason

**Arquivo:** `checkoutPublicMachine.actions.ts`

Criar nova função que usa o reason do backend:

```typescript
/**
 * Creates an error from backend response with specific reason.
 * Maps backend reasons to frontend ErrorReason type.
 * All messages in Brazilian Portuguese.
 */
export function createBackendError(error: string, backendReason?: string) {
  // Map backend reason to frontend ErrorReason
  const reasonMap: Record<string, ErrorReason> = {
    'NOT_FOUND': 'NOT_FOUND',
    'NO_CHECKOUT': 'NO_CHECKOUT',
    'INACTIVE': 'INACTIVE',
    'BLOCKED': 'BLOCKED',
    'CHECKOUT_NOT_FOUND': 'CHECKOUT_NOT_FOUND',
  };
  
  const reason: ErrorReason = (backendReason && reasonMap[backendReason]) 
    || 'FETCH_FAILED';
    
  return {
    reason,
    message: error || "Erro ao carregar checkout",
  };
}
```

### 4. Usar Nova Função na Machine

**Arquivo:** `checkoutPublicMachine.ts`

Alterar o handler de erro do loading state:

```typescript
// ANTES:
actions: assign({ error: ({ event }) => createFetchError(event.output.error || "") }),

// DEPOIS:
actions: assign({ 
  error: ({ event }) => createBackendError(
    event.output.error || "",
    event.output.reason
  )
}),
```

### 5. Atualizar Mensagens em Português

**Arquivo:** `CheckoutErrorDisplay.tsx`

Mensagens completas em português brasileiro:

```typescript
const ERROR_MESSAGES: Record<string, { title: string; description: string; canRetry: boolean }> = {
  // Erros do backend (resolve-universal)
  NOT_FOUND: {
    title: "Link não encontrado",
    description: "Este link de pagamento não existe ou foi removido.",
    canRetry: false,
  },
  NO_CHECKOUT: {
    title: "Checkout não configurado",
    description: "Este link ainda não possui um checkout configurado. Entre em contato com o vendedor.",
    canRetry: false,
  },
  INACTIVE: {
    title: "Produto indisponível",
    description: "Este produto não está mais disponível para compra.",
    canRetry: false,
  },
  BLOCKED: {
    title: "Produto bloqueado",
    description: "Este produto foi bloqueado e não está disponível. Entre em contato com o suporte.",
    canRetry: false,
  },
  
  // Erros existentes (atualizados para PT-BR completo)
  FETCH_FAILED: {
    title: "Erro ao carregar",
    description: "Não foi possível carregar os dados do checkout. Verifique sua conexão e tente novamente.",
    canRetry: true,
  },
  VALIDATION_FAILED: {
    title: "Dados inválidos",
    description: "Os dados recebidos estão em formato inesperado. Tente novamente ou entre em contato com o suporte.",
    canRetry: true,
  },
  CHECKOUT_NOT_FOUND: {
    title: "Checkout não encontrado",
    description: "Este checkout não existe ou foi removido.",
    canRetry: false,
  },
  PRODUCT_UNAVAILABLE: {
    title: "Produto indisponível",
    description: "Este produto não está mais disponível para compra.",
    canRetry: false,
  },
  NETWORK_ERROR: {
    title: "Erro de conexão",
    description: "Verifique sua conexão com a internet e tente novamente.",
    canRetry: true,
  },
  SUBMIT_FAILED: {
    title: "Erro ao processar",
    description: "Não foi possível processar seu pedido. Tente novamente.",
    canRetry: true,
  },
  PAYMENT_FAILED: {
    title: "Erro no pagamento",
    description: "Ocorreu um erro ao processar seu pagamento. Verifique os dados e tente novamente.",
    canRetry: true,
  },
  UNKNOWN: {
    title: "Erro inesperado",
    description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
    canRetry: true,
  },
};
```

Atualizar lógica de `isNotFoundError` para incluir novos tipos:

```typescript
const isNotFoundError = [
  'NOT_FOUND',
  'NO_CHECKOUT', 
  'INACTIVE', 
  'BLOCKED',
  'CHECKOUT_NOT_FOUND', 
  'PRODUCT_UNAVAILABLE'
].includes(reason);
```

---

## Fluxo de Dados Após Correção

```text
Backend (resolve-universal)
    │
    ├── { success: false, error: "...", reason: "NO_CHECKOUT" }
    │
    ▼
Actor (fetchCheckoutDataActor)
    │
    ├── { success: false, error: "...", reason: "NO_CHECKOUT" }
    │
    ▼
Machine (checkoutPublicMachine)
    │
    ├── createBackendError("...", "NO_CHECKOUT")
    │   └── { reason: "NO_CHECKOUT", message: "..." }
    │
    ▼
Component (CheckoutErrorDisplay)
    │
    └── Exibe: "Checkout não configurado"
              "Este link ainda não possui um checkout configurado..."
```

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Payment Link sem checkout | "Erro ao carregar checkout" | "Checkout não configurado - Este link ainda não possui um checkout configurado" |
| Link inativo | "Erro ao carregar checkout" | "Produto indisponível" |
| Produto bloqueado | "Erro ao carregar checkout" | "Produto bloqueado - Entre em contato com o suporte" |
| Slug inexistente | "Checkout não encontrado" | "Link não encontrado - Este link não existe ou foi removido" |
| Erro de rede | "Erro ao carregar checkout" | "Erro de conexão - Verifique sua internet" |

---

## Seção Técnica

### Interface FetchCheckoutOutput Atualizada

```typescript
export interface FetchCheckoutOutput {
  success: boolean;
  data?: unknown;
  error?: string;
  reason?: string; // NEW: Backend error reason
}
```

### Função createBackendError

```typescript
export function createBackendError(error: string, backendReason?: string): CheckoutError {
  const validReasons: ErrorReason[] = [
    'NOT_FOUND', 'NO_CHECKOUT', 'INACTIVE', 'BLOCKED', 'CHECKOUT_NOT_FOUND'
  ];
  
  const reason: ErrorReason = (backendReason && validReasons.includes(backendReason as ErrorReason))
    ? (backendReason as ErrorReason)
    : 'FETCH_FAILED';
    
  return { reason, message: error || "Erro ao carregar checkout" };
}
```

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Fluxo de dados completo e rastreável |
| Zero Dívida Técnica | Nenhuma informação perdida no caminho |
| Arquitetura Correta | SOLID - responsabilidade única em cada camada |
| Escalabilidade | Fácil adicionar novos error reasons do backend |
| Segurança | Mensagens não expõem detalhes técnicos |
| Português Brasileiro | Todas as mensagens em PT-BR para usuários finais |

**RISE V3 Score: 10.0/10**
