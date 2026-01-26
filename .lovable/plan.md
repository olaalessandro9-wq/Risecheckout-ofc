
# Correção: Erro ao Definir Checkout como Padrão

## Diagnóstico Técnico

### Problema Identificado
Ao marcar um checkout como "padrão" na configuração, ocorre o erro:
```
duplicate key value violates unique constraint "unique_default_checkout_per_product"
```

### Causa Raiz
O banco de dados possui um **partial unique index** que garante apenas um checkout default por produto:
```sql
CREATE UNIQUE INDEX unique_default_checkout_per_product 
ON public.checkouts USING btree (product_id) 
WHERE (is_default = true)
```

Na Edge Function `checkout-crud`, as actions `create` e `update` executam as operações na **ordem incorreta**:

**Código Atual (ERRADO):**
```typescript
// PRIMEIRO: Tenta atualizar o checkout para is_default = true
const { data: updatedCheckout } = await supabase
  .from("checkouts")
  .update(updates)  // ← FALHA AQUI por causa da constraint
  .eq("id", checkoutId);

// DEPOIS: Tenta desmarcar os outros (nunca é executado)
if (isDefault) {
  await supabase.from("checkouts")
    .update({ is_default: false })
    .eq("product_id", productId)
    .neq("id", checkoutId);
}
```

A action `set-default` está correta e pode servir de modelo:
```typescript
// CORRETO: Primeiro desmarca, depois marca
await supabase.from("checkouts").update({ is_default: false }).eq("product_id", productId);
await supabase.from("checkouts").update({ is_default: true }).eq("id", checkoutId);
```

---

## Análise de Soluções (RISE V3 Obrigatório)

### Solução A: Corrigir Apenas a Ordem das Operações
- Inverter a ordem: primeiro desmarcar outros, depois marcar o novo
- Manter estrutura atual do código

- **Manutenibilidade**: 8/10 - Resolve o problema pontual
- **Zero DT**: 8/10 - Lógica duplicada entre actions
- **Arquitetura**: 7/10 - Actions `create`, `update`, `set-default` têm lógicas similares separadas
- **Escalabilidade**: 8/10 - Cada nova action precisaria repetir a lógica
- **Segurança**: 10/10 - Sem impacto
- **NOTA FINAL: 8.2/10**
- **Tempo estimado**: 15 minutos

### Solução B: Extrair Helper + Corrigir Ordem (Refatoração Completa)
- Criar função `setCheckoutAsDefault()` em módulo compartilhado
- Centralizar lógica de "definir como padrão" em um único lugar
- Reutilizar em `create`, `update` e `set-default`
- Garantir atomicidade e ordem correta

- **Manutenibilidade**: 10/10 - Single Source of Truth para lógica de default
- **Zero DT**: 10/10 - Zero duplicação de código
- **Arquitetura**: 10/10 - DRY principle, Clean Architecture
- **Escalabilidade**: 10/10 - Qualquer nova action usa o helper
- **Segurança**: 10/10 - Sem impacto
- **NOTA FINAL: 10.0/10**
- **Tempo estimado**: 45 minutos

### DECISÃO: Solução B (Nota 10.0/10)

Seguindo a Lei Suprema RISE V3 Seção 4.6: A melhor solução vence, sempre.

---

## Plano de Implementação

### Fase 1: Criar Helper Centralizado (20 min)

**Arquivo a modificar:** `supabase/functions/_shared/checkout-crud-helpers.ts`

**Adicionar função:**
```typescript
/**
 * Define um checkout como padrão, desmarcando os outros do mesmo produto.
 * Executa na ordem correta para respeitar a constraint unique_default_checkout_per_product.
 */
export async function setCheckoutAsDefault(
  supabase: SupabaseClient,
  checkoutId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  // 1. PRIMEIRO: Desmarcar TODOS os checkouts do produto como não-padrão
  const { error: unsetError } = await supabase
    .from("checkouts")
    .update({ is_default: false })
    .eq("product_id", productId);
    
  if (unsetError) {
    return { success: false, error: unsetError.message };
  }
  
  // 2. DEPOIS: Marcar o checkout específico como padrão
  const { error: setError } = await supabase
    .from("checkouts")
    .update({ is_default: true })
    .eq("id", checkoutId);
    
  if (setError) {
    return { success: false, error: setError.message };
  }
  
  return { success: true };
}
```

### Fase 2: Refatorar Action CREATE (10 min)

**Arquivo:** `supabase/functions/checkout-crud/index.ts`

**Mudanças:**
- Criar checkout com `is_default: false` inicialmente
- Se `isDefault = true`, chamar helper `setCheckoutAsDefault()` DEPOIS da criação

### Fase 3: Refatorar Action UPDATE (10 min)

**Arquivo:** `supabase/functions/checkout-crud/index.ts`

**Mudanças:**
- Remover `is_default` do objeto `updates`
- Se `isDefault = true`, chamar helper `setCheckoutAsDefault()` DEPOIS do update

### Fase 4: Refatorar Action SET-DEFAULT (5 min)

**Arquivo:** `supabase/functions/checkout-crud/index.ts`

**Mudanças:**
- Substituir lógica manual pelo helper `setCheckoutAsDefault()`

---

## Arquivos a Modificar

| Arquivo | Ação | Linhas Afetadas |
|---------|------|-----------------|
| `supabase/functions/_shared/checkout-crud-helpers.ts` | ADICIONAR FUNÇÃO | +30 |
| `supabase/functions/checkout-crud/index.ts` | REFATORAR | ~50 |

---

## Código Detalhado

### checkout-crud-helpers.ts (Adição)

```typescript
// Adicionar após as funções existentes

/**
 * Define um checkout como padrão, desmarcando os outros do mesmo produto.
 * Ordem de execução respeitando constraint unique_default_checkout_per_product.
 * 
 * @returns success: true se operação completou, false se houve erro
 */
export async function setCheckoutAsDefault(
  supabase: SupabaseClient,
  checkoutId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  // PASSO 1: Desmarcar TODOS os checkouts do produto
  const { error: unsetError } = await supabase
    .from("checkouts")
    .update({ is_default: false })
    .eq("product_id", productId);
    
  if (unsetError) {
    return { success: false, error: `Falha ao desmarcar checkouts: ${unsetError.message}` };
  }
  
  // PASSO 2: Marcar o checkout específico como padrão
  const { error: setError } = await supabase
    .from("checkouts")
    .update({ is_default: true })
    .eq("id", checkoutId);
    
  if (setError) {
    return { success: false, error: `Falha ao definir checkout padrão: ${setError.message}` };
  }
  
  return { success: true };
}
```

### checkout-crud/index.ts (Action CREATE)

```typescript
// ========== CREATE ==========
if (action === "create" && req.method === "POST") {
  // ... validações existentes ...

  // CRIAR checkout com is_default: FALSE inicialmente
  const { data: newCheckout, error: createError } = await supabase
    .from("checkouts")
    .insert({ 
      product_id: productId, 
      name: name.trim(), 
      is_default: false  // SEMPRE false na criação
    })
    .select("id, name, is_default, product_id")
    .single();

  if (createError) return errorResponse(...);

  // SE deve ser padrão, usar helper DEPOIS da criação
  if (isDefault) {
    const defaultResult = await setCheckoutAsDefault(supabase, newCheckout.id, productId);
    if (!defaultResult.success) {
      // Rollback: deletar checkout criado
      await supabase.from("checkouts").delete().eq("id", newCheckout.id);
      return errorResponse(defaultResult.error || "Falha ao definir como padrão", corsHeaders, 500);
    }
    newCheckout.is_default = true;
  }

  // ... resto da lógica (payment link) ...
}
```

### checkout-crud/index.ts (Action UPDATE)

```typescript
// ========== UPDATE ==========
if (action === "update" && (req.method === "PUT" || req.method === "POST")) {
  // ... validações existentes ...

  const updates: Record<string, string | boolean> = { updated_at: new Date().toISOString() };
  if (name?.trim()) updates.name = name.trim();
  // NÃO incluir is_default aqui!

  const { data: updatedCheckout, error: updateError } = await supabase
    .from("checkouts")
    .update(updates)
    .eq("id", checkoutId)
    .select("id, name, is_default, product_id")
    .single();

  if (updateError) return errorResponse(...);

  // SE deve ser padrão, usar helper DEPOIS do update
  if (isDefault && !updatedCheckout.is_default) {
    const defaultResult = await setCheckoutAsDefault(supabase, checkoutId, updatedCheckout.product_id);
    if (!defaultResult.success) {
      return errorResponse(defaultResult.error || "Falha ao definir como padrão", corsHeaders, 500);
    }
    updatedCheckout.is_default = true;
  }

  // ... resto da lógica (payment link) ...
}
```

### checkout-crud/index.ts (Action SET-DEFAULT)

```typescript
// ========== SET-DEFAULT ==========
if (action === "set-default" && req.method === "POST") {
  const { checkoutId } = body;
  if (!checkoutId) return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);

  const ownershipCheck = await verifyCheckoutOwnership(supabase, checkoutId, producerId);
  if (!ownershipCheck.valid) return errorResponse("Sem permissão", corsHeaders, 403);

  const productId = ownershipCheck.checkout?.product_id;
  if (!productId) return errorResponse("Produto não encontrado", corsHeaders, 404);

  // Usar helper centralizado
  const result = await setCheckoutAsDefault(supabase, checkoutId, productId);
  if (!result.success) {
    return errorResponse(result.error || "Falha ao definir checkout padrão", corsHeaders, 500);
  }

  return jsonResponse({ success: true }, corsHeaders);
}
```

---

## Regras de Negócio Confirmadas

| Regra | Status |
|-------|--------|
| Apenas 1 checkout pode ser padrão por produto | ✅ Garantido pela constraint + helper |
| Ao marcar um como padrão, os outros desmarcam | ✅ Helper faz isso automaticamente |
| Não é possível excluir o checkout padrão | ✅ Já implementado na action DELETE |
| Deve existir pelo menos 1 checkout | ✅ Garantido pelo trigger de criação de produto |

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Erro ao definir checkout como padrão | Sim | Não |
| Duplicação de lógica is_default | 3 lugares | 1 helper |
| Nota RISE V3 | 7.0/10 | 10.0/10 |

---

## Verificação de Qualidade

| Pergunta | Resposta |
|----------|----------|
| Esta é a MELHOR solução? | Sim, 10.0/10 |
| Zero dívida técnica? | Sim |
| Single Source of Truth? | Sim, helper centralizado |
| Respeita constraint do banco? | Sim, ordem correta |

---

## Tempo Total Estimado
**45 minutos**
