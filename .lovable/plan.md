
# Correção: Order Bump - discount_price é MARKETING, não preço REAL

## Diagnóstico do Problema

### ROOT CAUSE ANALYSIS

O sistema possui uma **confusão de nomenclatura** que causou um bug crítico no cálculo de preços.

| Contexto | Valor | Significado REAL |
|----------|-------|------------------|
| `discount_price` no formulário (UI) | R$ 197,00 | **Preço de ORIGEM** - valor riscado para marketing |
| Preço da oferta selecionada | R$ 49,90 | **Preço REAL** - o que o cliente paga |
| Visual esperado no checkout | ~~R$ 197,00~~ R$ 49,90 | Marketing "de/por" |

### Fluxo Visual do Problema

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  CONFIGURAÇÃO DO PRODUTOR:                                                   │
│  - Oferta: R$ 49,90 (preço REAL a cobrar)                                   │
│  - "Aplicar desconto": ativado                                              │
│  - "Preço de origem": R$ 197,00 (preço RISCADO de marketing)               │
│                                                                              │
│  ESPERADO NO CHECKOUT:                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  RISE COMMUNITY                                                     │    │
│  │  Comunidade de marketing digital...                                 │    │
│  │  ~~R$ 197,00~~ R$ 49,90  ← Visual correto                          │    │
│  │  [✓] Adicionar Produto                                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  TOTAL A PAGAR: R$ 49,90 ← CORRETO                                          │
│                                                                              │
│  COMPORTAMENTO ATUAL (BUG):                                                  │
│  TOTAL A PAGAR: R$ 197,00 ← ERRADO! Cobra o preço de marketing!             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Arquivos com BUG

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `supabase/functions/checkout-public-data/handlers/order-bumps-handler.ts` | 52-55 | Inverte `price` e `originalPrice` |
| `supabase/functions/create-order/handlers/bump-processor.ts` | 201-205 | Usa `discount_price` como preço de cobrança |
| `src/modules/products/context/helpers/productDataMapper.ts` | 122-124 | Mapeamento invertido |
| `src/modules/products/machines/productFormMachine.actors.ts` | 160 | Mapeamento invertido |

---

## Análise de Soluções (RISE V3 Obrigatório)

### Solução A: Renomear campo no banco para `original_price`
- Criar migration para renomear coluna
- Atualizar TODOS os arquivos que usam `discount_price`
- Manutenibilidade: 10/10 - Nomenclatura correta elimina confusão futura
- Zero DT: 10/10 - Nome semanticamente correto
- Arquitetura: 10/10 - SSOT com nome correto
- Escalabilidade: 10/10 - Facilita onboarding de novos devs
- Segurança: 10/10 - Sem impacto
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2 dias (migration + updates em 15+ arquivos)

### Solução B: Corrigir apenas a lógica sem renomear
- Manter `discount_price` como nome do campo
- Corrigir a lógica nos handlers para tratar corretamente
- Atualizar comentários para documentar semântica
- Manutenibilidade: 8/10 - Nome confuso permanece
- Zero DT: 8/10 - Requer documentação para evitar bugs futuros
- Arquitetura: 7/10 - Nome não reflete semântica
- Escalabilidade: 7/10 - Risco de confusão em manutenção futura
- Segurança: 10/10 - Sem impacto
- **NOTA FINAL: 7.8/10**
- Tempo estimado: 30 minutos

### DECISÃO: Solução A (Nota 10.0/10)

Conforme RISE V3 §4.6 - "A melhor solução VENCE. SEMPRE." - vamos renomear o campo para `original_price` em toda a stack, eliminando a confusão de nomenclatura na raiz.

---

## Especificação Técnica

### Fase 1: Migration SQL (Campo Renomeado)

```sql
-- Renomear coluna discount_price para original_price
ALTER TABLE order_bumps RENAME COLUMN discount_price TO original_price;

-- Atualizar comentário da coluna
COMMENT ON COLUMN order_bumps.original_price IS 
  'Preço de MARKETING (riscado). O preço REAL é da oferta/produto vinculado.';
```

### Fase 2: Backend (Edge Functions)

**2.1 order-bumps-handler.ts - Corrigir lógica de formatação**

```typescript
// ANTES (ERRADO):
if (bump.discount_enabled && bump.discount_price) {
  originalPrice = price;
  price = Number(bump.discount_price);  // ← Inverte para o preço de marketing!
}

// DEPOIS (CORRETO):
if (bump.discount_enabled && bump.original_price) {
  originalPrice = Number(bump.original_price);  // ← original_price é o preço riscado
  // price permanece o preço da oferta (preço REAL)
}
```

**2.2 bump-processor.ts - REMOVER override de preço**

```typescript
// REMOVER COMPLETAMENTE (era a causa do bug de cobrança):
// PRIORIDADE 3: Override com discount_price (BRL → centavos)
// if (bump.discount_enabled && bump.discount_price) {
//   bumpPriceCents = Math.round(Number(bump.discount_price) * 100);
// }

// O preço de cobrança é SEMPRE da oferta ou produto, NUNCA do original_price
```

**2.3 order-bump-crud/index.ts - Renomear campo**

- `discount_price` → `original_price` em interfaces e queries

**2.4 resolve-and-load-handler.ts - Renomear na query**

- Atualizar select para usar `original_price`

### Fase 3: Frontend

**3.1 types.ts - Renomear interface**

```typescript
// ANTES:
discount_price?: number | null;

// DEPOIS:
original_price?: number | null;
```

**3.2 productDataMapper.ts - Corrigir mapeamento**

```typescript
// ANTES (ERRADO):
price: record.discount_enabled && record.discount_price != null 
  ? record.discount_price 
  : product?.price ?? 0,

// DEPOIS (CORRETO):
price: product?.price ?? 0,  // Preço REAL é sempre do produto/oferta
original_price: record.discount_enabled && record.original_price != null
  ? record.original_price
  : null,  // Preço de marketing (riscado)
```

**3.3 useOrderBumpForm.ts - Renomear campo**

- `discount_price` → `original_price` no payload de save

**3.4 fetchOrderBumps.ts - Renomear interface**

- Atualizar `OrderBumpRaw` para usar `original_price`

### Fase 4: Documentação

**4.1 Atualizar TODOS os comentários afetados**

Cada arquivo modificado terá seu header atualizado para:
- RISE ARCHITECT PROTOCOL V3 - 10.0/10
- Documentação clara da semântica de `original_price`

**4.2 Criar documentação centralizada**

```markdown
## Order Bump - Semântica de Preços

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `offers.price` | number (cents) | Preço REAL a ser cobrado |
| `products.price` | number (cents) | Fallback se não houver oferta |
| `original_price` | number (cents) | Preço de MARKETING (riscado) - apenas visual |
| `discount_enabled` | boolean | Se true, exibe "de original_price por price" |

**IMPORTANTE**: O `original_price` NUNCA deve ser usado para cálculo de totais.
O preço de cobrança é SEMPRE da oferta ou produto vinculado.
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| **Migration SQL** | Renomear `discount_price` → `original_price` |
| `supabase/functions/checkout-public-data/handlers/order-bumps-handler.ts` | Corrigir lógica + renomear |
| `supabase/functions/create-order/handlers/bump-processor.ts` | REMOVER override de preço |
| `supabase/functions/order-bump-crud/index.ts` | Renomear campo |
| `supabase/functions/checkout-public-data/handlers/resolve-and-load-handler.ts` | Renomear na query |
| `supabase/functions/checkout-public-data/types.ts` | Atualizar interface |
| `supabase/functions/_shared/entities/orderBumps.ts` | Renomear campo na query |
| `src/hooks/checkout/helpers/fetchOrderBumps.ts` | Renomear interface |
| `src/components/products/order-bump-dialog/types.ts` | Renomear interface |
| `src/components/products/order-bump-dialog/hooks/useOrderBumpForm.ts` | Renomear no payload |
| `src/modules/products/context/hooks/useProductLoader.ts` | Renomear interface |
| `src/modules/products/context/helpers/productDataMapper.ts` | Corrigir mapeamento |
| `src/modules/products/machines/productFormMachine.actors.ts` | Corrigir mapeamento |
| `src/modules/products/types/product.types.ts` | Atualizar documentação |
| `src/integrations/supabase/types.ts` | Regenerar tipos |

---

## Verificação RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Nome correto elimina confusão |
| Zero DT | 10/10 | Bug corrigido na raiz, sem workarounds |
| Arquitetura | 10/10 | SSOT com semântica clara |
| Escalabilidade | 10/10 | Fácil entendimento para novos devs |
| Segurança | 10/10 | Preço correto é cobrado |
| **NOTA FINAL** | **10.0/10** |

---

## Resultado Esperado

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  APÓS CORREÇÃO:                                                              │
│                                                                              │
│  Configuração:                                                               │
│  - Oferta: R$ 49,90                                                         │
│  - original_price: R$ 197,00 (marketing)                                    │
│                                                                              │
│  Visual no Checkout:                                                         │
│  ~~R$ 197,00~~ R$ 49,90 ← CORRETO                                           │
│                                                                              │
│  Total Cobrado:                                                              │
│  R$ 49,90 ← CORRETO (usa preço da oferta, não original_price)              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tempo Estimado

**2 dias** (migration + 15 arquivos + testes)
