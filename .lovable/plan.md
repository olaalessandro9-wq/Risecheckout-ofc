

# Plano: Corrigir Validação de Order Bumps no create-order

## Diagnóstico do Problema

### Erro Identificado
O checkout com order bump selecionado falha com erro 400:
```
[ERROR] [bump-processor] Bumps inválidos: {"requested":1,"found":0}
```

### Causa Raiz (CONFIRMADA VIA LOGS + DADOS)

O `bump-processor.ts` valida order bumps usando `checkout_id`:

```typescript
// LINHA 108 - PROBLEMA
.eq("checkout_id", checkout_id)
```

Porém, os order bumps são vinculados por `parent_product_id`, não por `checkout_id`:

| Campo no Bump | Valor Real |
|---------------|------------|
| `id` | `b08db6c9-eb28-4044-b82d-a9e2ee906414` |
| `checkout_id` | **NULL** |
| `parent_product_id` | `a9547038-b10b-442b-8b99-6331739a8730` |

**Inconsistência Crítica:**
- Frontend (resolve-and-load-handler.ts): Carrega bumps por `parent_product_id` ✅
- Backend (bump-processor.ts): Valida bumps por `checkout_id` ❌

Resultado: O frontend exibe o bump corretamente, mas quando o usuário tenta pagar, o backend não encontra o bump porque a query usa o campo errado.

---

## Análise de Soluções (RISE Protocol V3 Seção 4.4)

### Solução A: Usar parent_product_id na Validação

Modificar a query no `bump-processor.ts` para usar `parent_product_id` ao invés de `checkout_id`, alinhando com a arquitetura do frontend.

- Manutenibilidade: 10/10 (alinha backend com frontend)
- Zero DT: 10/10 (resolve problema definitivamente)
- Arquitetura: 10/10 (SSOT - Single Source of Truth)
- Escalabilidade: 10/10 (suporta bumps com checkout_id NULL)
- Segurança: 10/10 (valida ownership via parent_product_id)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 15 minutos

### Solução B: Manter checkout_id + Adicionar Fallback parent_product_id

Usar OR na query: `.or(\`checkout_id.eq.${checkout_id},parent_product_id.eq.${product_id}\`)`

- Manutenibilidade: 7/10 (lógica complexa desnecessária)
- Zero DT: 8/10 (mantém código legado)
- Arquitetura: 6/10 (duplica lógica de ownership)
- Escalabilidade: 7/10 (confuso para novos devs)
- Segurança: 10/10
- **NOTA FINAL: 7.6/10**
- Tempo estimado: 15 minutos

### DECISÃO: Solução A (Nota 10.0)

O `parent_product_id` é o campo correto de relacionamento. O `checkout_id` em order_bumps é **legado** e está sendo descontinuado (ver comentário no `create-handler.ts` linha 71).

---

## Plano de Correção

### Arquivo a Modificar

```text
supabase/functions/create-order/handlers/bump-processor.ts
```

### Alteração

**Linha 108:**

```typescript
// ANTES (usa checkout_id que pode ser NULL):
.eq("checkout_id", checkout_id)

// DEPOIS (usa parent_product_id - campo correto de relacionamento):
.eq("parent_product_id", product_id)
```

### Código Completo da Seção (linhas 102-109)

```typescript
// ANTES:
// Validar bumps (ownership + status)
const { data: bumps, error: bumpsError } = await supabase
  .from("order_bumps")
  .select("id, product_id, active, custom_title, discount_enabled, original_price, offer_id")
  .in("id", order_bump_ids)
  .eq("checkout_id", checkout_id)  // ❌ PROBLEMA
  .eq("active", true);

// DEPOIS:
// Validar bumps (ownership via parent_product_id - RISE V3)
const { data: bumps, error: bumpsError } = await supabase
  .from("order_bumps")
  .select("id, product_id, active, custom_title, discount_enabled, original_price, offer_id")
  .in("id", order_bump_ids)
  .eq("parent_product_id", product_id)  // ✅ Campo correto
  .eq("active", true);
```

---

## Seção Técnica

### Fluxo de Dados Corrigido

```text
Frontend (checkout público)
    │
    └── Carrega bumps via resolve-and-load
        └── .eq("parent_product_id", productId)  ✅
    │
    ▼
Usuario seleciona bump + clica "Pagar com PIX"
    │
    └── XState envia: { order_bump_ids: ["b08db6c9-..."], product_id: "a9547038-..." }
    │
    ▼
Backend (create-order → bump-processor.ts)
    │
    └── Valida bumps
        └── .eq("parent_product_id", product_id)  ✅ (APÓS CORREÇÃO)
    │
    ▼
Bump encontrado → Pedido criado → PIX gerado
```

### Por que checkout_id Existe no order_bumps?

O campo `checkout_id` é **legado** - foi o design original antes da migração para `parent_product_id`. O comentário no `create-handler.ts` (linha 71) confirma:

```typescript
checkout_id: payload.checkout_id || null, // Deprecated, kept for compatibility
```

A arquitetura RISE V3 usa `parent_product_id` como campo de relacionamento, e o frontend já foi migrado para isso. O backend estava desalinhado.

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Checkout sem bump | ✅ Funciona | ✅ Funciona |
| Checkout com bump (checkout_id = NULL) | ❌ Erro 400 | ✅ Funciona |
| Checkout com bump (checkout_id preenchido) | ✅ Funciona | ✅ Funciona |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Frontend e Backend alinhados |
| Zero Dívida Técnica | Removida dependência de campo legado |
| Arquitetura Correta | SSOT via parent_product_id |
| Escalabilidade | Suporta todos os cenários de order bumps |
| Segurança | Validação de ownership mantida |

**RISE V3 Score: 10.0/10**

