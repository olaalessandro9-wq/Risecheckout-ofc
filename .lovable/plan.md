
# Auditoria Completa: Sistema de Cupons - RISE V3 10.0/10

## Diagnóstico Confirmado

### ROOT CAUSE do Erro de Criação
A tabela `coupons` possui a constraint `UNIQUE (code)` chamada `coupons_code_key` que impede criar cupons com o mesmo código em produtos DIFERENTES.

```sql
-- CONSTRAINT INCORRETA (ENCONTRADA)
coupons_code_key: UNIQUE (code)
```

### Verificação: Lógica de Order Bumps
A lógica de cupom + order bumps está **CORRETA**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE CUPOM + ORDER BUMPS (CORRETO)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Produto 1 (Principal) - R$100                                               │
│  ├─ Bump 2 (Produto 2) - R$50                                               │
│  ├─ Bump 3 (Produto 3) - R$30                                               │
│  └─ Bump 4 (Produto 4) - R$20                                               │
│                                                                              │
│  Total sem desconto: R$200                                                   │
│                                                                              │
│  CENÁRIO A: Cupom do Produto 1 com apply_to_order_bumps = TRUE              │
│  ├─ Cupom "DESC10" (10% desconto)                                           │
│  ├─ Validação: coupon_products.product_id = "produto-1" → ✅ VÁLIDO         │
│  ├─ Base do cálculo: totalAmount = R$200                                    │
│  ├─ Desconto: 10% de R$200 = R$20                                           │
│  └─ Total final: R$180                                                      │
│                                                                              │
│  CENÁRIO B: Cupom do Produto 1 com apply_to_order_bumps = FALSE             │
│  ├─ Cupom "DESC10" (10% desconto)                                           │
│  ├─ Validação: coupon_products.product_id = "produto-1" → ✅ VÁLIDO         │
│  ├─ Base do cálculo: finalPrice = R$100 (só produto principal)              │
│  ├─ Desconto: 10% de R$100 = R$10                                           │
│  └─ Total final: R$190                                                      │
│                                                                              │
│  CENÁRIO C: Cupom do Produto 2 (bump) usado no checkout do Produto 1        │
│  ├─ Cupom "BUMPDESC" (do produto 2)                                         │
│  ├─ Validação: coupon_products.product_id = "produto-2"                     │
│  ├─ Checkout valida: product_id = "produto-1"                               │
│  ├─ Resultado: "produto-2" != "produto-1" → ❌ CUPOM INVÁLIDO              │
│  └─ Mensagem: "Este cupom não é válido para este produto"                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Código que prova isso (coupon-processor.ts:83-94):**
```typescript
// Verificar vínculo com produto
const { data: couponProduct } = await supabase
  .from("coupon_products")
  .select("*")
  .eq("coupon_id", couponData.id)
  .eq("product_id", product_id)  // ← product_id é o PRINCIPAL
  .maybeSingle();

if (!couponProduct) {
  log.warn("Cupom não vinculado ao produto:", coupon_id);
  return { discountAmount, couponCode }; // ← Desconto 0
}
```

---

## Problemas Encontrados na Auditoria

### 1. CRÍTICO: Constraint UNIQUE(code) Global (BANCO)
| Item | Detalhe |
|------|---------|
| Constraint | `coupons_code_key: UNIQUE (code)` |
| Problema | Impede criar cupons com mesmo código em produtos diferentes |
| Impacto | Erro 500 ao criar segundo cupom com código já existente |
| Solução | DROP constraint + criar trigger de validação por produto |

### 2. CRÍTICO: product-entities retorna TODOS os cupons
| Item | Detalhe |
|------|---------|
| Arquivo | `supabase/functions/product-entities/index.ts` |
| Linhas | 131, 150 |
| Problema | Usa `fetchAllCoupons()` em vez de `fetchProductCoupons(productId)` |
| Impacto | Retorna cupons de OUTROS produtos (vazamento de dados) |
| Solução | Mudar para `fetchProductCoupons(supabase, productId)` |

### 3. DOCUMENTAÇÃO INCORRETA: Comentário "global"
| Item | Detalhe |
|------|---------|
| Arquivo | `supabase/functions/_shared/entities/coupons.ts:45` |
| Comentário | `"Fetches all coupons (global, for entities endpoint)"` |
| Problema | Sugere que cupons são globais |
| Solução | Remover função ou atualizar documentação |

### 4. DOCUMENTAÇÃO INCORRETA: Header product-entities
| Item | Detalhe |
|------|---------|
| Arquivo | `supabase/functions/product-entities/index.ts:7` |
| Comentário | `"coupons: Cupons (global ou por produto)"` |
| Problema | Sugere que cupons podem ser globais |
| Solução | Atualizar para `"coupons: Cupons do produto específico"` |

### 5. DOCUMENTAÇÃO DESATUALIZADA: "Migrated" em cabeçalhos
| Arquivo | Linha | Texto |
|---------|-------|-------|
| `supabase/functions/_shared/coupon-handlers.ts` | 7 | `"@version 1.1.0 - Migrated to centralized logger"` |
| `supabase/functions/create-order/handlers/coupon-processor.ts` | 4 | `"@version 2.0.0 - RISE Protocol V2 Compliant"` |

---

## Análise de Soluções (RISE V3)

### Solução A: Apenas corrigir constraint no banco
- DROP coupons_code_key
- Não adicionar proteção no banco
- **Manutenibilidade**: 5/10 - Sem proteção de integridade no banco
- **Zero DT**: 4/10 - Depende apenas do backend para validação
- **Arquitetura**: 4/10 - Viola "defense in depth"
- **NOTA FINAL: 4.3/10**

### Solução B: Correção Completa (RISE V3 10.0/10)
1. DROP constraint global
2. Criar trigger de validação por produto
3. Corrigir `product-entities` para usar `fetchProductCoupons`
4. Atualizar TODA documentação incorreta
5. Padronizar headers RISE V3
- **Manutenibilidade**: 10/10 - Código e banco alinhados
- **Zero DT**: 10/10 - Validação em múltiplas camadas
- **Arquitetura**: 10/10 - Defense in depth, SSOT
- **Escalabilidade**: 10/10 - Cupons por produto funcionam corretamente
- **Segurança**: 10/10 - Sem vazamento de cupons entre produtos
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (Nota 10.0/10)

---

## Especificação Técnica

### 1. Migração SQL - Corrigir Constraint

```sql
-- 1. Remover constraint global incorreta
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_code_key;

-- 2. Criar índice não-único para performance (busca por código)
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- 3. Função de validação de unicidade por produto
CREATE OR REPLACE FUNCTION public.validate_coupon_product_unique_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coupon_code TEXT;
  v_existing_count INTEGER;
BEGIN
  -- Buscar código do cupom sendo vinculado
  SELECT code INTO v_coupon_code FROM coupons WHERE id = NEW.coupon_id;
  
  -- Verificar se já existe outro cupom com mesmo código para este produto
  SELECT COUNT(*) INTO v_existing_count
  FROM coupons c
  INNER JOIN coupon_products cp ON c.id = cp.coupon_id
  WHERE cp.product_id = NEW.product_id
    AND UPPER(c.code) = UPPER(v_coupon_code)
    AND c.id != NEW.coupon_id;
  
  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'Código de cupom "%" já existe para este produto', v_coupon_code;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Criar trigger no coupon_products
DROP TRIGGER IF EXISTS trg_validate_coupon_product_unique_code ON public.coupon_products;
CREATE TRIGGER trg_validate_coupon_product_unique_code
  BEFORE INSERT ON public.coupon_products
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_coupon_product_unique_code();
```

### 2. Corrigir product-entities/index.ts

**Mudança (linhas 130-133, 147-150):**
```typescript
// ANTES (ERRADO)
case "coupons": {
  const coupons = await fetchAllCoupons(supabase);
  return jsonResponse({ coupons }, corsHeaders);
}

// DEPOIS (CORRETO)
case "coupons": {
  const coupons = await fetchProductCoupons(supabase, productId);
  return jsonResponse({ coupons }, corsHeaders);
}
```

**Mudança action "all" (linha 150):**
```typescript
// ANTES
fetchAllCoupons(supabase),

// DEPOIS
fetchProductCoupons(supabase, productId),
```

**Atualizar header (linhas 1-12):**
```typescript
/**
 * Product Entities Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Retorna entidades relacionadas a produtos:
 * - offers: Ofertas do produto
 * - orderBumps: Order bumps dos checkouts do produto
 * - coupons: Cupons vinculados ao produto (via coupon_products)
 * - checkouts: Checkouts do produto
 * - paymentLinks: Links de pagamento do produto
 * 
 * @module product-entities
 */
```

### 3. Atualizar/Remover _shared/entities/coupons.ts

**Opção escolhida:** Remover `fetchAllCoupons` (não tem uso legítimo) ou documentar corretamente.

```typescript
/**
 * Coupons Entity Handler - Shared module
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Single Source of Truth for fetching coupons by product.
 * Cupons são SEMPRE vinculados a produtos via tabela coupon_products.
 * NÃO existem cupons globais neste sistema.
 * 
 * @module _shared/entities/coupons
 */

// REMOVER ou marcar como deprecated:
// export async function fetchAllCoupons(...)
```

### 4. Atualizar coupon-handlers.ts Header

```typescript
/**
 * Coupon Management Handlers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Responsabilidade ÚNICA: Gerenciamento de cupons por produto
 * 
 * Arquitetura:
 * - Cupons são SEMPRE vinculados a produtos (via coupon_products)
 * - Unicidade de código é por PRODUTO, não global
 * - Validação em múltiplas camadas (backend + trigger)
 * 
 * @module _shared/coupon-handlers
 */
```

### 5. Atualizar coupon-processor.ts Header

```typescript
/**
 * coupon-processor.ts - Validação e Aplicação de Cupom
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Responsabilidade ÚNICA: Validar cupom e calcular desconto
 * 
 * Lógica de Order Bumps:
 * - Se apply_to_order_bumps = true: desconto sobre totalAmount (produto + bumps)
 * - Se apply_to_order_bumps = false: desconto sobre finalPrice (só produto)
 * 
 * Validação de Vínculo:
 * - Cupom DEVE estar vinculado ao product_id PRINCIPAL
 * - Cupons de produtos bump NÃO funcionam no checkout do produto principal
 * 
 * @module create-order/handlers/coupon-processor
 */
```

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| Migração SQL | CRIAR | DROP constraint + CREATE trigger |
| `supabase/functions/product-entities/index.ts` | MODIFICAR | Usar fetchProductCoupons, atualizar header |
| `supabase/functions/_shared/entities/coupons.ts` | MODIFICAR | Atualizar documentação, remover/deprecar fetchAllCoupons |
| `supabase/functions/_shared/coupon-handlers.ts` | MODIFICAR | Atualizar header RISE V3 |
| `supabase/functions/create-order/handlers/coupon-processor.ts` | MODIFICAR | Atualizar header RISE V3 |

---

## Resumo das Correções

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORREÇÕES                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. BANCO: DROP coupons_code_key (unicidade global)                          │
│  2. BANCO: CREATE trigger validação por produto                              │
│  3. CÓDIGO: product-entities usar fetchProductCoupons                        │
│  4. DOCS: Remover "global" de todos os comentários                          │
│  5. DOCS: Atualizar headers para RISE V3 10.0/10                            │
│                                                                              │
│  RESULTADO:                                                                  │
│  ✅ Cupom "PROMO10" pode existir em Produto A e Produto B                   │
│  ✅ Cupom do Produto A só funciona no checkout do Produto A                 │
│  ✅ Cupom do bump NÃO funciona no checkout do produto principal             │
│  ✅ apply_to_order_bumps = true desconta sobre total com bumps              │
│  ✅ Zero documentação incorreta/desatualizada                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Verificação RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Código e banco alinhados, documentação correta |
| Zero DT | 10/10 | Validação em múltiplas camadas, zero comentários incorretos |
| Arquitetura | 10/10 | Defense in depth, SSOT para unicidade |
| Escalabilidade | 10/10 | Cupons por produto funcionam corretamente |
| Segurança | 10/10 | Sem vazamento de cupons entre produtos |
| **NOTA FINAL** | **10.0/10** | Alinhado 100% com RISE Protocol V3 |

---

## Tempo Estimado
**45 minutos**
