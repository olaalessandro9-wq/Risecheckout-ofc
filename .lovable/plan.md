
# Auditoria Completa: Coupon Dual-State Fix

## Resultado da Implementacao

A eliminacao do estado dual foi executada **corretamente**. O fluxo de dados agora e unidirecional:

```text
SharedOrderSummary (valida via API)
  --> onApplyCoupon(couponData) (prop)
    --> CheckoutPublicContent.applyCoupon(coupon) (hook)
      --> XState: APPLY_COUPON --> context.appliedCoupon = couponData (SSOT)
        --> createOrderInput(context) --> couponId: context.appliedCoupon.id
          --> Backend: coupon_id enviado corretamente
```

Zero feedback loops. Zero estado duplicado. Zero `useEffect` de sincronizacao.

## Verificacao: O Que Ficou CORRETO

| Item | Status | Evidencia |
|------|--------|-----------|
| `onTotalChange` removido completamente | OK | Zero resultados na busca |
| `handleTotalChange` removido completamente | OK | Zero resultados na busca |
| XState APPLY_COUPON/REMOVE_COUPON | OK | Machine line 138-139, events definidos |
| `applyCoupon`/`removeCoupon` no hook | OK | Lines 146-152 de useCheckoutPublicMachine.ts |
| Props fluindo CheckoutPublicContent --> Layout --> Summary | OK | Lines 379-381, 134, 85-87 |
| Controlled/Uncontrolled pattern | OK | `isControlled = !!onApplyCoupon` (line 93) |
| `createOrderInput` lendo `context.appliedCoupon?.id` | OK | Line 59 de inputs.ts |
| Backend `coupon-processor.ts` respeitando `apply_to_order_bumps` | OK | Line 161 |
| Documentacao do componente | OK | JSDoc atualizado (lines 1-12) |
| Comentarios em ingles tecnico | OK | Todos os comentarios de secao |

## PROBLEMAS ENCONTRADOS

### PROBLEMA 1 (CRITICO): `calculateTotalFromContext` ignora `apply_to_order_bumps`

**Arquivo:** `src/modules/checkout-public/machines/checkoutPublicMachine.inputs.ts` (lines 21-38)

```text
CODIGO ATUAL (ERRADO):
  let total = basePrice + bumpsTotal;
  if (context.appliedCoupon) {
    total = total * (1 - context.appliedCoupon.discount_value / 100);
  }
  // SEMPRE aplica desconto sobre total (base + bumps)
  // IGNORA apply_to_order_bumps flag
```

```text
BACKEND (CORRETO):
  const discountBase = couponData.apply_to_order_bumps ? totalAmount : finalPrice;
  // Respeita a flag corretamente
```

Esta funcao e usada para calcular o `amount` enviado aos actors de PIX e Cartao:
- `processPixInput` (line 77): `amount: calculateTotalFromContext(context)`
- `processCardInput` (line 96): `amount: calculateTotalFromContext(context)`

**Impacto:** Quando `apply_to_order_bumps = false` E existem bumps selecionados, o amount enviado ao gateway de pagamento difere do amount que o backend calcula. O backend recalcula e corrige, MAS ha risco de inconsistencia entre o valor exibido no gateway e o valor real.

### PROBLEMA 2 (CRITICO): `calculateTotal` em CheckoutPublicContent ignora `apply_to_order_bumps`

**Arquivo:** `src/modules/checkout-public/components/CheckoutPublicContent.tsx` (lines 212-229)

```text
CODIGO ATUAL (ERRADO):
  if (appliedCoupon) {
    total = total * (1 - appliedCoupon.discount_value / 100);
  }
  // SEMPRE aplica sobre total (base + bumps)
  // IGNORA apply_to_order_bumps flag
```

Este valor e passado como `amount` para o componente de cartao de credito (MercadoPago/Stripe), que pode mostrar o valor errado ao usuario durante o pagamento.

**NOTA:** `SharedOrderSummary` (line 196) calcula CORRETAMENTE:
```text
const discountBase = effectiveCoupon.apply_to_order_bumps ? subtotal : productPrice;
```

Ou seja, o resumo do pedido mostra R$5.00 corretamente, mas o amount enviado ao iframe de pagamento pode ser R$4.00 (se bumps + apply_to_order_bumps=false com valores diferentes).

### PROBLEMA 3 (MODERADO): Codigo morto - `CouponField.tsx`

**Arquivo:** `src/components/checkout/CouponField.tsx` (228 linhas)

Componente LEGADO que:
- Nao e importado por NENHUM arquivo
- Usa `validateCouponRpc` (RPC direto, violacao do protocolo RISE V3 - frontend nao deveria usar RPC)
- Tem sua propria `AppliedCoupon` interface (duplicacao)
- Usa estado local proprio (o mesmo padrao dual-state que acabamos de eliminar)

**Veredicto:** Codigo 100% morto. Deve ser DELETADO.

### PROBLEMA 4 (MODERADO): `AppliedCoupon` exportada de `useCouponValidation.ts` nao e mais usada

**Arquivo:** `src/hooks/checkout/useCouponValidation.ts` (line 27-34)

A interface `AppliedCoupon` exportada deste hook nao e importada por nenhum arquivo. `SharedOrderSummary` agora importa `AppliedCoupon` de `checkout-shared.types.ts`. A exportacao no hook e codigo morto.

### PROBLEMA 5 (MODERADO): Tres definicoes separadas de `AppliedCoupon`

| Arquivo | `name` | `apply_to_order_bumps` | Status |
|---------|--------|----------------------|--------|
| `checkout-shared.types.ts` | optional | optional | CANONICA (importada pelo Summary) |
| `useCouponValidation.ts` | required | required | NAO IMPORTADA (morta) |
| `CouponField.tsx` | required | required | MORTA (arquivo inteiro) |
| `checkoutPublicMachine.types.ts` (CouponData) | required | required | Usada pelo XState |
| `checkout-payment.types.ts` | required | required | Usada por types de pagamento |

Deveria existir UMA UNICA definicao canonica.

### PROBLEMA 6 (MENOR): `SharedOrderSummary.tsx` tem 332 linhas

Ultrapassa o limite de 300 linhas do Protocolo RISE V3 por 32 linhas. A logica de validacao controlada (lines 103-158) poderia ser extraida.

### PROBLEMA 7 (MENOR): `CheckoutPublicContent.tsx` tem 391 linhas

Ultrapassa o limite de 300 linhas do Protocolo RISE V3 por 91 linhas. Este e um problema pre-existente.

### PROBLEMA 8 (MENOR): Comentario de changelog em CheckoutPublicContent

Line 206: `// Removido: localAppliedCoupon - estado duplicado causava bug de desconto não aplicado`

Comentario documenta o que foi removido (changelog), nao o que o codigo FAZ. Deveria ser removido ou simplificado.

## Plano de Correcao

### Correcao 1: `calculateTotalFromContext` -- Respeitar `apply_to_order_bumps`

```text
ANTES:
  let total = basePrice + bumpsTotal;
  if (context.appliedCoupon) {
    total = total * (1 - context.appliedCoupon.discount_value / 100);
  }

DEPOIS:
  let total = basePrice + bumpsTotal;
  if (context.appliedCoupon) {
    const discountBase = context.appliedCoupon.apply_to_order_bumps
      ? total
      : basePrice;
    const discount = (discountBase * context.appliedCoupon.discount_value) / 100;
    total = total - discount;
  }
```

### Correcao 2: `calculateTotal` em CheckoutPublicContent -- Mesma correcao

```text
ANTES:
  if (appliedCoupon) {
    total = total * (1 - appliedCoupon.discount_value / 100);
  }

DEPOIS:
  if (appliedCoupon) {
    const discountBase = appliedCoupon.apply_to_order_bumps
      ? total
      : product.price;
    const discount = (discountBase * appliedCoupon.discount_value) / 100;
    total = total - discount;
  }
```

### Correcao 3: Deletar `CouponField.tsx`

Deletar o arquivo `src/components/checkout/CouponField.tsx` (228 linhas de codigo morto).

### Correcao 4: Remover `AppliedCoupon` export de `useCouponValidation.ts`

Remover a `export interface AppliedCoupon` do hook e usar a definicao canonica de `checkout-shared.types.ts` internamente.

### Correcao 5: Limpar comentario de changelog

Substituir o comentario de changelog (line 205-206 de CheckoutPublicContent) por um comentario que descreve o estado ATUAL.

### Correcao 6: Extrair logica de validacao controlada de SharedOrderSummary

Extrair a funcao `controlledValidate` e o tipo `CouponValidationResponse` para um arquivo utilitario dedicado (`src/hooks/checkout/validateCouponApi.ts`), reduzindo o SharedOrderSummary abaixo de 300 linhas.

## Arvore de Arquivos Afetados

```text
src/
  components/checkout/
    CouponField.tsx                              <- DELETAR (codigo morto)
    shared/
      SharedOrderSummary.tsx                     <- Extrair logica de validacao
  hooks/checkout/
    useCouponValidation.ts                       <- Remover AppliedCoupon export
    validateCouponApi.ts                         <- NOVO (logica de validacao extraida)
  modules/checkout-public/
    components/
      CheckoutPublicContent.tsx                  <- Corrigir calculateTotal + limpar comentario
    machines/
      checkoutPublicMachine.inputs.ts            <- Corrigir calculateTotalFromContext
```
