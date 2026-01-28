
# Plano: Order Bumps a Nível de Produto (Não de Checkout)

## RISE Protocol V3 - Análise de Soluções

### Solução A: Migrar Order Bumps de `checkout_id` para `product_id` (pai)
- Manutenibilidade: 10/10 (modelo mental claro: bumps pertencem ao produto)
- Zero DT: 10/10 (resolve causa raiz estrutural)
- Arquitetura: 10/10 (semântica correta conforme regra de negócio)
- Escalabilidade: 10/10 (funciona com N checkouts por produto)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2-3 horas

### Solução B: Query via `product_id` no backend (sem alterar schema)
- Manutenibilidade: 8/10 (query indireta: checkout → product → order_bumps)
- Zero DT: 7/10 (schema ainda tem `checkout_id` obrigatório - confuso)
- Arquitetura: 6/10 (dados dizem uma coisa, query faz outra)
- Escalabilidade: 9/10 (funciona, mas menos eficiente)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 7.6/10**
- Tempo estimado: 30 minutos

### DECISÃO: Solução A (10.0/10)

A Solução B é um workaround que mantém o schema incorreto. A Solução A alinha schema, queries e semântica de negócio.

---

## Diagnóstico Root Cause

### Problema Arquitetural Atual

A tabela `order_bumps` tem:
```sql
checkout_id UUID NOT NULL  -- ❌ Vinculado a checkout específico
product_id UUID NOT NULL   -- Este é o produto DO BUMP, não do checkout pai
```

Quando o usuário configura um Order Bump:
1. Ele está configurando para o **PRODUTO** (ex: "Rise Community")
2. Mas o sistema salva no **CHECKOUT** específico (ex: "Checkout Principal")
3. Novos checkouts do mesmo produto não têm acesso aos bumps

### Comportamento Atual (Incorreto)

```text
Produto A (e63d3016-...)
├── Checkout Principal → 1 order bump ✅
├── Checkout B → 0 order bumps ❌
├── Checkout D → 0 order bumps ❌
└── Checkout D (Cópia) → 0 order bumps ❌
```

### Comportamento Correto (Desejado)

```text
Produto A (e63d3016-...)
├── Order Bumps: [Produto 1 principal] → Associados ao PRODUTO
│
├── Checkout Principal → Mostra todos os bumps do produto ✅
├── Checkout B → Mostra todos os bumps do produto ✅
├── Checkout D → Mostra todos os bumps do produto ✅
└── Checkout D (Cópia) → Mostra todos os bumps do produto ✅
```

---

## Execução Técnica

### 1. Migração do Banco de Dados

Adicionar coluna `parent_product_id` e migrar dados:

```sql
-- 1. Adicionar coluna para o produto PAI (o checkout pertence a este produto)
ALTER TABLE order_bumps 
ADD COLUMN parent_product_id UUID REFERENCES products(id);

-- 2. Preencher com base no checkout atual
UPDATE order_bumps ob
SET parent_product_id = c.product_id
FROM checkouts c
WHERE ob.checkout_id = c.id;

-- 3. Tornar NOT NULL após migração
ALTER TABLE order_bumps 
ALTER COLUMN parent_product_id SET NOT NULL;

-- 4. Tornar checkout_id NULLABLE (futuro: remover)
ALTER TABLE order_bumps 
ALTER COLUMN checkout_id DROP NOT NULL;

-- 5. Criar índice para performance
CREATE INDEX idx_order_bumps_parent_product_id 
ON order_bumps(parent_product_id);
```

### 2. Backend: `order-bumps-handler.ts`

Alterar query para buscar por `product_id` ao invés de `checkout_id`:

**Arquivo:** `supabase/functions/checkout-public-data/handlers/order-bumps-handler.ts`

**Query atual (linha 99-115):**
```typescript
const { data, error } = await supabase
  .from("order_bumps")
  .select(`...`)
  .eq("checkout_id", checkoutId)  // ❌ Busca por checkout
  .eq("active", true)
  .order("position");
```

**Query corrigida:**
```typescript
const { data, error } = await supabase
  .from("order_bumps")
  .select(`...`)
  .eq("parent_product_id", productId)  // ✅ Busca por produto
  .eq("active", true)
  .order("position");
```

**Assinatura do handler:**
- Mudar de `checkoutId` para `productId` no body da request
- Ou manter `checkoutId` e fazer lookup interno para `product_id`

### 3. Backend: `resolve-and-load-handler.ts`

**Arquivo:** `supabase/functions/checkout-public-data/handlers/resolve-and-load-handler.ts`

**Query atual (linhas 114-130):**
```typescript
// Order bumps
supabase
  .from("order_bumps")
  .select(`...`)
  .eq("checkout_id", checkout.id)  // ❌ Busca por checkout
  .eq("active", true)
  .order("position"),
```

**Query corrigida:**
```typescript
// Order bumps - RISE V3: busca por produto, não por checkout
supabase
  .from("order_bumps")
  .select(`...`)
  .eq("parent_product_id", resolvedProductId)  // ✅ Busca por produto
  .eq("active", true)
  .order("position"),
```

### 4. Backend: `_shared/entities/orderBumps.ts`

Simplificar a função para buscar diretamente por `parent_product_id`:

**Arquivo:** `supabase/functions/_shared/entities/orderBumps.ts`

**Código atual (linhas 73-95):**
```typescript
export async function fetchProductOrderBumpsWithRelations(
  supabase: SupabaseClient,
  productId: string
): Promise<Record<string, unknown>[]> {
  // First get checkout IDs for this product
  const { data: checkouts, error: checkoutsError } = await supabase
    .from("checkouts")
    .select("id")
    .eq("product_id", productId);
  
  // ... then query order_bumps by checkout_ids
}
```

**Código corrigido:**
```typescript
export async function fetchProductOrderBumpsWithRelations(
  supabase: SupabaseClient,
  productId: string
): Promise<Record<string, unknown>[]> {
  // RISE V3: Busca direta por parent_product_id
  const { data, error } = await supabase
    .from("order_bumps")
    .select(`...`)
    .eq("parent_product_id", productId)
    .eq("active", true)
    .order("position", { ascending: true });
  
  // ... handle error and return
}
```

### 5. Frontend: CRUD de Order Bumps

Quando criar um Order Bump, salvar `parent_product_id` ao invés de `checkout_id`:

**Buscar arquivos relevantes:**
- Componente de criação/edição de order bumps
- Edge function de CRUD de order bumps

### 6. Tipos TypeScript

Atualizar interfaces para refletir nova estrutura:

```typescript
interface OrderBump {
  id: string;
  parent_product_id: string;  // Produto que contém este bump
  product_id: string;         // Produto que É o bump
  checkout_id?: string;       // Deprecated, nullable
  // ...
}
```

---

## Resumo das Alterações

| Componente | Alteração |
|------------|-----------|
| **Schema SQL** | Adicionar `parent_product_id`, migrar dados, tornar `checkout_id` nullable |
| `order-bumps-handler.ts` | Query por `parent_product_id` |
| `resolve-and-load-handler.ts` | Query por `parent_product_id` |
| `_shared/entities/orderBumps.ts` | Query direta sem lookup de checkouts |
| **CRUD Order Bumps** | Salvar `parent_product_id` ao criar |
| **Tipos TypeScript** | Adicionar `parent_product_id` |

---

## Validação Pós-Implementação

| Verificação | Resultado Esperado |
|-------------|-------------------|
| Checkout Principal | Mostra todos os order bumps do produto |
| Checkout duplicado | Mostra todos os order bumps do produto |
| Novo checkout | Mostra todos os order bumps do produto |
| Criar bump no painel | Salva com `parent_product_id` correto |
| TypeScript build | Zero erros |
| Deploy Edge Functions | Sucesso |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Root Cause Only | Corrige estrutura do schema (causa raiz) |
| Zero Dívida Técnica | Elimina vínculo incorreto a checkout |
| Single Source of Truth | `parent_product_id` é a fonte de verdade |
| Arquitetura Correta | Semântica alinhada com regra de negócio |
| Segurança | Sem impacto |

**NOTA FINAL: 10.0/10** - Refatoração arquitetural seguindo RISE Protocol V3.
