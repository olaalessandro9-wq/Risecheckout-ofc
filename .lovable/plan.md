
# Plano: Corrigir Infraestrutura de Testes + Ativar CI no GitHub

## Objetivo
Corrigir os 18 arquivos de teste que usam `dotenv/load.ts` (causando falhas) e garantir que todos os testes passem para habilitar o GitHub Branch Protection.

---

## 1. Problema Identificado

### 1.1 Causa Raiz
18 arquivos `_shared.ts` em Edge Functions usam:
```typescript
import "https://deno.land/std@0.224.0/dotenv/load.ts";
```

Este import **valida obrigatoriamente** todas as variáveis do `.env.example`, quebrando quando faltam variáveis no ambiente de CI.

### 1.2 Arquivos Afetados
- `affiliation-public/tests/_shared.ts`
- `members-area-quizzes/tests/_shared.ts`
- `get-order-for-pix/tests/_shared.ts`
- `members-area-certificates/tests/_shared.ts`
- `request-affiliation/tests/_shared.ts`
- `update-affiliate-settings/tests/_shared.ts`
- `mercadopago-create-payment/tests/_shared.ts`
- `asaas-validate-credentials/tests/_shared.ts`
- `get-all-affiliation-statuses/tests/_shared.ts`
- `manage-user-role/tests/_shared.ts`
- `get-affiliation-status/tests/_shared.ts`
- `get-affiliation-details/tests/_shared.ts`
- `alert-stuck-orders/tests/_shared.ts`
- `get-pix-status/tests/_shared.ts`
- `gdpr-request/tests/_shared.ts`
- `gdpr-forget/tests/_shared.ts`
- (+ 2 outros arquivos)

---

## 2. Solução RISE V3 Nota 10.0

### 2.1 Análise de Soluções

#### Solução A: Adicionar todas as variáveis no ambiente
- Manutenibilidade: 5/10 (frágil, quebra quando `.env.example` mudar)
- Zero DT: 3/10 (cria acoplamento)
- Arquitetura: 4/10 (não segue padrão centralizado)
- Escalabilidade: 4/10 (cada nova variável requer update)
- Segurança: 8/10 (N/A)
- **NOTA FINAL: 4.8/10**

#### Solução B: Migrar para infraestrutura centralizada
- Manutenibilidade: 10/10 (padrão único para todos os testes)
- Zero DT: 10/10 (elimina causa raiz)
- Arquitetura: 10/10 (segue `_shared/testing/mod.ts`)
- Escalabilidade: 10/10 (adicionar funções é trivial)
- Segurança: 10/10 (N/A)
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (Nota 10.0)

---

## 3. Implementação Técnica

### 3.1 Ação por Arquivo

Para cada um dos 18 arquivos, a correção é:

**Antes:**
```typescript
import "https://deno.land/std@0.224.0/dotenv/load.ts";

// ...local config functions...
```

**Depois:**
```typescript
import { getTestConfig, skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

// Remove funções locais duplicadas, usa as centralizadas
```

### 3.2 Padrão Correto (Referência: admin-data)

```typescript
/**
 * Shared utilities for [function-name] tests
 * @module [function-name]/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig } from "../../_shared/testing/mod.ts";

const config = getTestConfig();

export const FUNCTION_NAME = "[function-name]";
export const FUNCTION_URL = config.supabaseUrl
  ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
  : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

// ... rest of shared utilities
```

---

## 4. Ativação do CI no GitHub

### 4.1 Pré-requisitos
1. ✅ Workflow `ci.yml` já existe
2. ❌ Testes precisam passar
3. ❌ Fazer push para branch `main` ou `develop`

### 4.2 Passos para Ativar Branch Protection

Após corrigir os testes:

1. **Push para GitHub** - O workflow roda automaticamente
2. **Esperar checks completarem** - ~3-5 minutos
3. **No GitHub** → Settings → Branches → Edit rule para `main`
4. **Em "Require status checks to pass before merging"**:
   - Ativar checkbox
   - Clicar no campo de busca
   - Selecionar: `🚦 Quality Gate`

### 4.3 Status Checks Disponíveis Após Fix
- `📦 Install Dependencies`
- `🧪 Unit & Integration Tests`
- `🎭 E2E Tests (Playwright)`
- `⚡ Edge Functions Tests`
- `🚦 Quality Gate` (bloqueante)

---

## 5. Arquivos a Modificar

### Lista Completa (18 arquivos)

```text
supabase/functions/
├── affiliation-public/tests/_shared.ts
├── alert-stuck-orders/tests/_shared.ts
├── asaas-validate-credentials/tests/_shared.ts
├── gdpr-forget/tests/_shared.ts
├── gdpr-request/tests/_shared.ts
├── get-affiliation-details/tests/_shared.ts
├── get-affiliation-status/tests/_shared.ts
├── get-all-affiliation-statuses/tests/_shared.ts
├── get-order-for-pix/tests/_shared.ts
├── get-pix-status/tests/_shared.ts
├── manage-user-role/tests/_shared.ts
├── members-area-certificates/tests/_shared.ts
├── members-area-quizzes/tests/_shared.ts
├── mercadopago-create-payment/tests/_shared.ts
├── request-affiliation/tests/_shared.ts
├── update-affiliate-settings/tests/_shared.ts
└── (+ verificar se há mais)
```

---

## 6. Impacto e Métricas

| Métrica | Antes | Depois |
|---------|-------|--------|
| Arquivos com padrão antigo | 18 | 0 |
| Testes Edge Functions passando | 36/40 | 40/40 |
| CI bloqueado por falhas | ✅ | ❌ |
| Branch Protection habilitável | ❌ | ✅ |
| Conformidade RISE V3 | 8/10 | 10/10 |

---

## 7. Próximos Passos

1. **Aprovar este plano**
2. **Eu corrijo os 18 arquivos** (migração para padrão centralizado)
3. **Executar testes novamente** para validar
4. **Push para GitHub** (sync automático Lovable → GitHub)
5. **Ativar Branch Protection** no GitHub (você faz manualmente)

---

## 8. Seção Técnica Detalhada

### 8.1 Por que `dotenv/load.ts` Quebra

O módulo `https://deno.land/std@0.224.0/dotenv/load.ts` internamente:
1. Lê o arquivo `.env.example`
2. Compara com as variáveis de ambiente atuais
3. **LANÇA ERRO** se qualquer variável do `.env.example` estiver ausente

No ambiente Lovable/CI, apenas algumas variáveis estão disponíveis, causando o erro.

### 8.2 Solução Centralizada

O módulo `_shared/testing/test-config.ts`:
1. Usa `Deno.env.get()` diretamente
2. **NÃO valida** contra `.env.example`
3. Retorna `null` para variáveis ausentes
4. Testes usam `skipIntegration()` para pular quando necessário

### 8.3 Checklist de Conformidade

- ✅ Zero `dotenv/load.ts` em arquivos de teste
- ✅ Todos usam `getTestConfig()` centralizado
- ✅ Padrão consistente em 100% das funções
- ✅ CI passa sem variáveis sensíveis
