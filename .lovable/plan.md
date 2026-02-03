
# Plano RISE V3: Propagação Correta de Erros na Duplicação de Checkout

## Resumo do Diagnóstico

Investiguei o erro de duplicação de checkout do usuário `maiconmiranda1528@gmail.com` (Darckz). Encontrei:

| Item | Status |
|------|--------|
| Usuário existe | Sim (id: 28aa5872-34e2-4a65-afec-0fdfca68b5d6) |
| Sessão ativa | Sim (válida até 22:50:21 UTC) |
| Checkouts do usuário | 2 checkouts existentes |
| Logs de erro no rpc-proxy | Nenhum encontrado (já expurgados) |
| Função RPC existe | Sim (duplicate_checkout_shallow) |

**Conclusão:** O erro ocorreu mas foi **silenciado** pelo tratamento genérico de erros no frontend. O código de erro é perdido durante a propagação e o usuário vê apenas "Não foi possível duplicar o checkout" sem contexto.

---

## Análise de Soluções (RISE Protocol V3 Seção 4.4)

### Solução A: Apenas Melhorar a Mensagem no Toast

Modificar apenas o `CheckoutTab.tsx` para mostrar `error.message`.

- Manutenibilidade: 5/10 (não resolve o problema em outros lugares)
- Zero DT: 4/10 (código de erro perdido no caminho)
- Arquitetura: 4/10 (informação perdida em camada intermediária)
- Escalabilidade: 4/10 (cada componente precisaria tratar)
- Segurança: 10/10
- **NOTA FINAL: 5.4/10**
- Tempo estimado: 15 minutos

### Solução B: Preservar ApiError no RpcProxy + Tratamento Contextual (ESCOLHIDA)

1. Criar `RpcError` que preserva o código de erro
2. Modificar `rpcProxy.ts` para propagar `ApiError` corretamente
3. Criar helper para detectar e tratar erros de autenticação
4. Modificar `CheckoutTab.tsx` para usar mensagem contextual

- Manutenibilidade: 10/10 (padrão aplicável a todo o sistema)
- Zero DT: 10/10 (informação completa preservada end-to-end)
- Arquitetura: 10/10 (separação clara de responsabilidades)
- Escalabilidade: 10/10 (funciona para qualquer RPC)
- Segurança: 10/10 (mensagens não expõem detalhes técnicos)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 45 minutos

### DECISÃO: Solução B (Nota 10.0)

---

## Arquivos a Criar/Modificar

```text
src/lib/rpc/errors.ts              # CRIAR: RpcError class + helpers
src/lib/rpc/index.ts               # CRIAR: Re-exports para organização
src/lib/rpc/rpcProxy.ts            # MODIFICAR: Usar RpcError
src/modules/products/tabs/CheckoutTab.tsx  # MODIFICAR: Tratamento contextual
```

---

## Alterações Detalhadas

### 1. CRIAR: `src/lib/rpc/errors.ts`

Nova classe de erro que preserva o código do erro original:

```typescript
/**
 * RPC Error - Preserves error code from API layer
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import type { ApiErrorCode } from "@/lib/api/types";

/**
 * Error class that preserves the ApiErrorCode for proper handling
 */
export class RpcError extends Error {
  readonly code: ApiErrorCode;
  readonly isAuthError: boolean;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "RpcError";
    this.code = code;
    this.isAuthError = code === "UNAUTHORIZED" || code === "FORBIDDEN";
  }
}

/**
 * Creates an RpcError from an ApiError
 */
export function createRpcError(code: ApiErrorCode, message: string): RpcError {
  return new RpcError(code, message);
}

/**
 * Type guard to check if error is RpcError
 */
export function isRpcError(error: unknown): error is RpcError {
  return error instanceof RpcError;
}

/**
 * Checks if any error is an authentication error
 */
export function isRpcAuthError(error: unknown): boolean {
  if (error instanceof RpcError) {
    return error.isAuthError;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("autenticado") || 
           msg.includes("sessão") || 
           msg.includes("authentication") ||
           msg.includes("unauthorized");
  }
  return false;
}

/**
 * Gets user-friendly message for RPC errors
 */
export function getRpcErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof RpcError) {
    if (error.isAuthError) {
      return "Sua sessão expirou. Faça login novamente.";
    }
    return error.message || fallback;
  }
  if (error instanceof Error) {
    if (isRpcAuthError(error)) {
      return "Sua sessão expirou. Faça login novamente.";
    }
    return error.message || fallback;
  }
  return fallback;
}
```

### 2. CRIAR: `src/lib/rpc/index.ts`

Re-exports para organização:

```typescript
/**
 * RPC Module - Centralized RPC utilities
 * RISE ARCHITECT PROTOCOL V3
 */

// Error handling
export { 
  RpcError, 
  createRpcError, 
  isRpcError, 
  isRpcAuthError, 
  getRpcErrorMessage 
} from "./errors";

// RPC Proxy and typed helpers
export * from "./rpcProxy";
```

### 3. MODIFICAR: `src/lib/rpc/rpcProxy.ts`

Linhas 1-14 - Adicionar import:

```typescript
import { createRpcError } from "./errors";
```

Linhas 50-53 - Usar RpcError ao invés de Error genérico:

```typescript
// ANTES:
if (error) {
  log.error(`Error invoking ${rpcName}:`, error);
  return { data: null, error: new Error(error.message) };
}

// DEPOIS:
if (error) {
  log.error(`Error invoking ${rpcName}:`, error);
  // RISE V3: Preservar código de erro para tratamento adequado
  return { data: null, error: createRpcError(error.code, error.message) };
}
```

Linhas 56-58 - Tratar erro interno da resposta:

```typescript
// ANTES:
if (data?.error) {
  return { data: null, error: new Error(data.error) };
}

// DEPOIS:
if (data?.error) {
  // RISE V3: Erros internos tratados como INTERNAL_ERROR
  return { data: null, error: createRpcError("INTERNAL_ERROR", data.error) };
}
```

### 4. MODIFICAR: `src/modules/products/tabs/CheckoutTab.tsx`

Linhas 26-28 - Adicionar import:

```typescript
import { getRpcErrorMessage, isRpcAuthError } from "@/lib/rpc/errors";
```

Linhas 113-117 - Tratamento contextual de erro:

```typescript
// ANTES:
} catch (error: unknown) {
  log.error('Erro ao duplicar checkout', error);
  toast.error("Não foi possível duplicar o checkout");
}

// DEPOIS:
} catch (error: unknown) {
  log.error('Erro ao duplicar checkout', error);
  
  // RISE V3: Mensagem contextual baseada no tipo de erro
  const message = getRpcErrorMessage(error, "Não foi possível duplicar o checkout");
  toast.error(message);
  
  // Se for erro de auth, o usuário precisa fazer login novamente
  if (isRpcAuthError(error)) {
    // Toast já informou - o usuário saberá que precisa relogar
  }
}
```

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Sessão expirada (401) | "Não foi possível duplicar o checkout" | "Sua sessão expirou. Faça login novamente." |
| Checkout não encontrado | "Não foi possível duplicar o checkout" | "Checkout origem X não encontrado" |
| Erro interno (500) | "Não foi possível duplicar o checkout" | Mensagem do servidor ou fallback |
| Sucesso | Toast de sucesso | Toast de sucesso (inalterado) |

---

## Impacto no Sistema

Esta mudança é **100% retrocompatível**:

1. `RpcError extends Error` - código existente continua funcionando
2. Interface `RpcResult<T>` permanece com `error: Error | null`
3. Componentes não atualizados mostram `error.message` (já funciona)
4. Componentes atualizados podem usar os helpers para mensagens contextuais

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Padrão aplicável a todo o sistema |
| Zero Dívida Técnica | Informação de erro preservada end-to-end |
| Arquitetura Correta | Separação clara: erro → transporte → UI |
| Escalabilidade | Funciona para qualquer RPC do sistema |
| Segurança | Mensagens não expõem detalhes técnicos internos |

**RISE V3 Score: 10.0/10**

---

## Seção Técnica

### Fluxo de Erro Atual (Problemático)

```text
[Edge Function]  → { error: { code: "UNAUTHORIZED", message: "..." } }
       ↓
[api.call()]     → { data: null, error: ApiError }
       ↓
[rpcProxy]       → { data: null, error: new Error(message) }  ← PERDE O CODE!
       ↓
[duplicateCheckout] → throw error
       ↓
[CheckoutTab]    → toast.error("Genérico")  ← SEM CONTEXTO!
```

### Fluxo de Erro Corrigido

```text
[Edge Function]  → { error: { code: "UNAUTHORIZED", message: "..." } }
       ↓
[api.call()]     → { data: null, error: ApiError }
       ↓
[rpcProxy]       → { data: null, error: RpcError(code, message) }  ← PRESERVA!
       ↓
[duplicateCheckout] → throw error
       ↓
[CheckoutTab]    → getRpcErrorMessage(error) → "Sua sessão expirou..."  ← CONTEXTUAL!
```

### Por que `RpcError` ao invés de usar `ApiError` diretamente?

1. **Camadas separadas**: API layer usa `ApiError`, RPC layer usa `RpcError`
2. **Extends Error**: Mantém compatibilidade com catches existentes
3. **Helpers específicos**: `isRpcAuthError` e `getRpcErrorMessage` são específicos para RPCs
4. **Não quebra tipagem**: `RpcResult<T>` mantém `error: Error | null`
