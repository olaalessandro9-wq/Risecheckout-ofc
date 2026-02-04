
# Plano: Corrigir Bug de Cupom Não Aplicado no Checkout

## Diagnóstico do Bug

O desconto do cupom aparece corretamente na UI, mas **não é enviado para o backend** durante a criação do pedido. O resultado é que o PIX é gerado com o valor ORIGINAL (R$ 10,00) em vez do valor com desconto (R$ 5,00).

## Análise de Causa Raiz

### Fluxo Atual (QUEBRADO)

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuário aplica cupom no SharedOrderSummary                   │
│    └── useCouponValidation → appliedCoupon (interno ao hook)    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. SharedOrderSummary chama onTotalChange(total, coupon)        │
│    (linha 96)                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CheckoutPublicContent.handleTotalChange recebe               │
│    └── setLocalAppliedCoupon(coupon)  ← ESTADO LOCAL            │
│    └── NÃO chama machine.applyCoupon() ← BUG!                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Usuário submete formulário                                   │
│    └── machine.submit(snapshot)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Machine usa context.appliedCoupon?.id                        │
│    └── context.appliedCoupon = null  ← SEMPRE NULL!             │
│    └── couponId = null ← Backend não aplica desconto            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Pedido criado SEM desconto                                   │
│    └── PIX gerado com valor original                            │
└─────────────────────────────────────────────────────────────────┘
```

## Solução

Modificar `handleTotalChange` para sincronizar o cupom com a máquina XState.

### Arquivo: `src/modules/checkout-public/components/CheckoutPublicContent.tsx`

**Antes (linha 203-243):**
```typescript
// Coupon state for form manager compatibility
const [localAppliedCoupon, setLocalAppliedCoupon] = React.useState<typeof appliedCoupon>(appliedCoupon);

// ...

const handleTotalChange = useCallback((_total: number, coupon: typeof localAppliedCoupon) => {
  setLocalAppliedCoupon(coupon);  // ← SÓ ATUALIZA ESTADO LOCAL
}, []);
```

**Depois:**
```typescript
// REMOVER estado local - usar apenas o contexto da máquina
// const [localAppliedCoupon, setLocalAppliedCoupon] = ... ← REMOVER

// ...

const handleTotalChange = useCallback((_total: number, coupon: typeof appliedCoupon) => {
  // RISE V3: Sincronizar cupom com máquina XState (SSOT)
  if (coupon) {
    applyCoupon(coupon);  // ← ENVIAR PARA MÁQUINA
  } else if (appliedCoupon) {
    removeCoupon();        // ← REMOVER DA MÁQUINA
  }
}, [applyCoupon, removeCoupon, appliedCoupon]);
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/checkout-public/components/CheckoutPublicContent.tsx` | Sincronizar cupom com máquina XState |

## Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuário aplica cupom no SharedOrderSummary                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. SharedOrderSummary chama onTotalChange(total, coupon)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. handleTotalChange chama machine.applyCoupon(coupon)          │
│    └── Evento APPLY_COUPON enviado para XState                  │
│    └── context.appliedCoupon = coupon ← SINCRONIZADO!           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Usuário submete formulário                                   │
│    └── machine.submit(snapshot)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Machine usa context.appliedCoupon?.id                        │
│    └── context.appliedCoupon = { id: "xxx", ... }               │
│    └── couponId = "xxx" ← Backend aplica desconto!              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Pedido criado COM desconto                                   │
│    └── PIX gerado com valor correto                             │
│    └── UTMify recebe valor correto                              │
└─────────────────────────────────────────────────────────────────┘
```

## Detalhes Técnicos

### Mudanças específicas em CheckoutPublicContent.tsx:

1. **Adicionar `applyCoupon` e `removeCoupon`** à desestruturação do `machine` (linha 75):
   ```typescript
   applyCoupon,
   removeCoupon,
   ```

2. **Remover estado local desnecessário** (linha 203-204):
   ```typescript
   // REMOVER:
   // const [localAppliedCoupon, setLocalAppliedCoupon] = React.useState<typeof appliedCoupon>(appliedCoupon);
   ```

3. **Atualizar cálculo de total** para usar `appliedCoupon` da máquina (linha 222):
   ```typescript
   // ANTES: localAppliedCoupon
   // DEPOIS: appliedCoupon (da máquina)
   if (appliedCoupon) {
     total = total * (1 - appliedCoupon.discount_value / 100);
   }
   ```

4. **Atualizar handleTotalChange** (linha 241-243):
   ```typescript
   const handleTotalChange = useCallback((_total: number, coupon: typeof appliedCoupon) => {
     if (coupon) {
       applyCoupon(coupon);
     } else if (appliedCoupon) {
       removeCoupon();
     }
   }, [applyCoupon, removeCoupon, appliedCoupon]);
   ```

## Benefícios

1. **SSOT (Single Source of Truth)**: Cupom gerenciado exclusivamente pela máquina XState
2. **Consistência**: Estado do cupom sincronizado entre UI e backend
3. **Correção do Bug**: Pedidos criados com desconto correto
4. **UTMify Correto**: Valor enviado para UTMify será o valor final com desconto
5. **Simplicidade**: Remoção de estado local duplicado

## Verificação Pós-Correção

Após a correção, verificar na tabela `orders`:
- `coupon_code` deve ter o código do cupom
- `discount_amount_cents` deve ter o valor do desconto em centavos
- `amount_cents` deve ter o valor final (com desconto aplicado)
