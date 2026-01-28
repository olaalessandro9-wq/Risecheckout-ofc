
# Plano: Corrigir Query de Order Bumps com FK Explícita

## RISE Protocol V3 - Análise de Soluções

### Solução A: Especificar FK explicitamente na query
- Manutenibilidade: 10/10 (correção precisa e documentada)
- Zero DT: 10/10 (resolve causa raiz)
- Arquitetura: 10/10 (sintaxe correta do Supabase)
- Escalabilidade: 10/10 (sem impacto)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 10 minutos

### DECISÃO: Solução A (10.0/10)

---

## Diagnóstico Root Cause

### Problema Identificado

A tabela `order_bumps` tem **DUAS** Foreign Keys para a tabela `products`:

| FK Name | Coluna | Propósito |
|---------|--------|-----------|
| `order_bumps_product_id_fkey` | `product_id` | Produto QUE É o bump |
| `order_bumps_parent_product_id_fkey` | `parent_product_id` | Produto PAI que contém o bump |

Quando você escreve:
```typescript
.select(`products(id, name, ...)`)
```

O Supabase **não sabe qual FK usar** e **falha silenciosamente**, retornando array vazio.

### Sintaxe Correta

O Supabase requer especificação explícita:
```typescript
.select(`products!product_id(id, name, ...)`)
//       ^^^^^^^^^^^^^^^^^^ FK explícita
```

---

## Alterações Necessárias

### 1. `resolve-and-load-handler.ts` (linha 126)

**Antes:**
```typescript
products(id, name, description, price, image_url),
offers(id, name, price)
```

**Depois:**
```typescript
products!product_id(id, name, description, price, image_url),
offers!offer_id(id, name, price)
```

### 2. `order-bumps-handler.ts` (linhas 124-125)

**Antes:**
```typescript
products(id, name, description, price, image_url),
offers(id, name, price)
```

**Depois:**
```typescript
products!product_id(id, name, description, price, image_url),
offers!offer_id(id, name, price)
```

### 3. `handleAll` function (linha 244)

**Antes:**
```typescript
products(id, name, description, price, image_url), offers(id, name, price)
```

**Depois:**
```typescript
products!product_id(id, name, description, price, image_url), offers!offer_id(id, name, price)
```

### 4. `_shared/entities/orderBumps.ts` (linha 78)

**Antes:**
```typescript
products:product_id (
  id,
  name,
  price,
  image_url
)
```

**Depois:**
```typescript
products!product_id (
  id,
  name,
  price,
  image_url
)
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `resolve-and-load-handler.ts` | Adicionar `!product_id` e `!offer_id` às relações |
| `order-bumps-handler.ts` | Adicionar `!product_id` e `!offer_id` às relações |
| `_shared/entities/orderBumps.ts` | Corrigir sintaxe de `products:product_id` para `products!product_id` |

---

## Explicação Técnica

### Supabase Relationship Syntax

Quando uma tabela tem **múltiplas FKs para a mesma tabela de destino**, o Supabase exige:

| Sintaxe | Quando Usar |
|---------|-------------|
| `table(columns)` | Uma única FK para essa tabela |
| `table!fk_column(columns)` | Múltiplas FKs - especifica qual usar |

### No Caso de `order_bumps`:

```sql
order_bumps
├── product_id → products (o bump)
└── parent_product_id → products (o pai)
```

Duas FKs para `products` = **obrigatório especificar qual usar**.

---

## Validação Pós-Implementação

| Verificação | Resultado Esperado |
|-------------|-------------------|
| Checkout com bumps | `orderBumps` retorna array populado |
| Dados do bump | `products` e `offers` contêm dados |
| Todos os checkouts do produto | Mostram os mesmos bumps |
| Deploy Edge Functions | Sucesso |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Root Cause Only | Corrige sintaxe incorreta do Supabase |
| Zero Dívida Técnica | Query correta e explícita |
| Single Source of Truth | Todas as queries usam mesma sintaxe |
| Segurança | Sem impacto |

**NOTA FINAL: 10.0/10** - Correção de sintaxe seguindo RISE Protocol V3.
