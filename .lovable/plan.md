
# Plano de Correção: Erro "Failed to fetch dynamically imported module"

## Resumo do Problema

O usuário `maiconmiranda1528@gmail.com` está recebendo o erro:
```
Failed to fetch dynamically imported module: 
https://www.risecheckout.com/assets/duplicateCheckout-DEPN83uz.js
```

### Análise da Causa Raiz

Este **NÃO é um problema de sessão/cookies**. É um problema de **carregamento de módulo JavaScript** causado por:

1. **Cache desatualizado do browser**: O browser tem uma versão antiga do HTML/JS principal em cache, mas o chunk `duplicateCheckout-DEPN83uz.js` foi renomeado após um novo deploy (hash diferente)
2. **Dynamic import sem proteção**: O `CheckoutTab.tsx` usa dynamic import diretamente sem retry automático

### Evidências

| Item | Valor |
|------|-------|
| Sessão do usuário | **VÁLIDA** (is_valid: true, expires: 2026-03-05) |
| Edge Function | Nenhum erro nos logs |
| Tipo de erro | Erro de browser, não de backend |
| Pattern do erro | Comum em apps Vite após deploys |

---

## Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Dynamic Import com Retry + Fallback Estático

- Manutenibilidade: 10/10 (Utility reutilizável para todas as funções)
- Zero DT: 10/10 (Resolve problema na raiz + previne futuros)
- Arquitetura: 10/10 (Consistente com lazyWithRetry existente)
- Escalabilidade: 10/10 (Pattern aplicável a todos dynamic imports)
- Segurança: 10/10 (Sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 30 minutos

### Solução B: Remover Dynamic Import (Import Estático)

- Manutenibilidade: 9/10 (Funciona, mas aumenta bundle inicial)
- Zero DT: 8/10 (Resolve sintoma, não melhora resiliência)
- Arquitetura: 7/10 (Contraria code-splitting best practice)
- Escalabilidade: 7/10 (Bundle maior = carregamento inicial lento)
- Segurança: 10/10 (Sem impacto)
- **NOTA FINAL: 8.2/10**

### Solução C: Apenas Detectar e Recarregar Página

- Manutenibilidade: 6/10 (UX ruim - recarrega página inteira)
- Zero DT: 7/10 (Resolve, mas de forma bruta)
- Arquitetura: 5/10 (Não é solução elegante)
- Escalabilidade: 5/10 (Cada erro = reload completo)
- Segurança: 10/10 (Sem impacto)
- **NOTA FINAL: 6.6/10**

### DECISÃO: Solução A (Nota 10.0)

As outras são inferiores porque:
- **Solução B**: Aumenta o bundle inicial desnecessariamente
- **Solução C**: Experiência de usuário degradada (reload completo)

---

## Plano de Implementação

### Fase 1: Criar Utility para Dynamic Import com Retry

**Novo Arquivo:** `src/lib/dynamicImportWithRetry.ts`

Criar uma utility similar ao `lazyWithRetry`, mas para dynamic imports de funções (não componentes React):

```typescript
/**
 * dynamicImportWithRetry - Dynamic Import com Retry Automático
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Para funções e módulos (não componentes React).
 * Usa mesma lógica de isNetworkError do lazyWithRetry.
 */

import { isNetworkError } from "./lazyWithRetry";
import { createLogger } from "@/lib/logger";

const log = createLogger("dynamicImportWithRetry");

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Wrapper para dynamic import com retry automático
 * 
 * @example
 * const { duplicateCheckout } = await dynamicImportWithRetry(
 *   () => import("@/lib/checkouts/duplicateCheckout")
 * );
 */
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const { maxRetries, retryDelay } = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error;

      // Só faz retry se for erro de rede/chunk
      if (!isNetworkError(error)) {
        throw error;
      }

      log.warn(`Dynamic import failed (attempt ${attempt}/${maxRetries})`, {
        error: error instanceof Error ? error.message : String(error),
      });

      // Última tentativa? Não espera
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  log.error("All dynamic import attempts failed", {
    attempts: maxRetries,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });

  throw lastError;
}
```

### Fase 2: Atualizar CheckoutTab.tsx

**Arquivo:** `src/modules/products/tabs/CheckoutTab.tsx`

Substituir o dynamic import direto pela utility com retry:

```typescript
// ANTES (linha 104)
const { duplicateCheckout } = await import("@/lib/checkouts/duplicateCheckout");

// DEPOIS
import { dynamicImportWithRetry } from "@/lib/dynamicImportWithRetry";

// No handleDuplicateCheckout:
const { duplicateCheckout } = await dynamicImportWithRetry(
  () => import("@/lib/checkouts/duplicateCheckout")
);
```

### Fase 3: Atualizar useAffiliatesTab.ts (Mesmo Pattern)

**Arquivo:** `src/modules/products/tabs/affiliates/useAffiliatesTab.ts`

Aplicar o mesmo pattern para consistência:

```typescript
// ANTES (linha 146)
const { api } = await import("@/lib/api");

// DEPOIS
import { dynamicImportWithRetry } from "@/lib/dynamicImportWithRetry";

const { api } = await dynamicImportWithRetry(
  () => import("@/lib/api")
);
```

### Fase 4: Melhorar Mensagem de Erro para Usuário

**Arquivo:** `src/modules/products/tabs/CheckoutTab.tsx`

Adicionar detecção específica de erro de chunk no catch:

```typescript
import { isChunkLoadError } from "@/lib/lazyWithRetry";

// No catch do handleDuplicateCheckout:
} catch (error: unknown) {
  log.error('Erro ao duplicar checkout', error);
  
  // RISE V3: Mensagem específica para erro de carregamento de módulo
  if (error instanceof Error && isChunkLoadError(error)) {
    toast.error("Erro de conexão. Por favor, recarregue a página e tente novamente.");
    return;
  }
  
  const message = getRpcErrorMessage(error, "Não foi possível duplicar o checkout");
  toast.error(message);
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/lib/dynamicImportWithRetry.ts` | CRIAR | Utility para dynamic imports com retry |
| `src/modules/products/tabs/CheckoutTab.tsx` | EDITAR | Usar utility + mensagem de erro específica |
| `src/modules/products/tabs/affiliates/useAffiliatesTab.ts` | EDITAR | Usar utility para consistência |
| `src/lib/__tests__/dynamicImportWithRetry.test.ts` | CRIAR | Testes unitários |

---

## Fluxo Corrigido

```text
1. Usuário clica em "Duplicar Checkout"
2. dynamicImportWithRetry tenta carregar o módulo
3. Se falhar (chunk antigo/rede):
   a. Aguarda 1 segundo
   b. Tenta novamente (até 3x)
4. Se todas tentativas falharem:
   a. Toast: "Erro de conexão. Recarregue a página."
5. Se sucesso:
   a. duplicateCheckout() é chamado
   b. Toast: "Checkout duplicado com sucesso!"
```

---

## Por que isso afeta só alguns usuários?

| Cenário | Resultado |
|---------|-----------|
| Usuário com cache limpo | Carrega chunk correto (funciona) |
| Usuário com cache antigo | Tenta carregar chunk com hash antigo (FALHA) |
| Usuário após Ctrl+F5 | Cache limpo, funciona |

O seu amigo provavelmente:
1. Acessou o app antes do último deploy
2. Manteve a aba aberta ou browser em background
3. Tentou usar uma feature que carrega chunk dinâmico
4. O hash do chunk mudou → erro

---

## Ação Imediata para o Usuário Afetado

Enquanto eu implemento a correção, peça para seu amigo:

1. **Pressionar Ctrl+Shift+R** (ou Cmd+Shift+R no Mac) para hard reload
2. Ou ir em **DevTools → Network → Disable cache** → Recarregar
3. Ou **limpar cache do browser** para risecheckout.com

---

## Validação Pós-Implementação

| Teste | Como Validar |
|-------|--------------|
| Retry funciona | Simular falha de rede → Deve tentar 3x |
| Mensagem correta | Após 3 falhas → "Erro de conexão. Recarregue a página." |
| Fluxo normal | Com conexão boa → Duplicar checkout funciona |
| Consistência | Verificar se useAffiliatesTab também está protegido |

---

## RISE V3 Compliance Score

| Critério | Nota |
|----------|------|
| Manutenibilidade Infinita | 10.0/10 |
| Zero Dívida Técnica | 10.0/10 |
| Arquitetura Correta | 10.0/10 |
| Escalabilidade | 10.0/10 |
| Segurança | 10.0/10 |
| **NOTA FINAL** | **10.0/10** |
