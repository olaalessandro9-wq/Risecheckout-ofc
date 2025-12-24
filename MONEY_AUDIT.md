# Auditoria de Operações Monetárias - Fase 2.5

## 🎯 Objetivo
Mapear todas as operações monetárias no código para identificar inconsistências e aplicar a arquitetura "Integer First".

## 📊 Estado Atual

### ✅ O QUE JÁ ESTÁ CORRETO

1. **src/utils/money.ts** - Biblioteca básica existe
   - `formatCentsToBRL()`: Converte centavos → "R$ X,XX" ✅
   - Usado em vários componentes de exibição ✅

2. **Backend: create-order** - Conversão padronizada
   - `convertToCents()`: Função auxiliar que faz `Math.round(priceInReais * 100)` ✅
   - Lógica clara: `products.price` (REAIS) → `amount_cents` (CENTAVOS) ✅
   - `offers.price` já está em CENTAVOS ✅

### ❌ PROBLEMAS IDENTIFICADOS

#### 1. **FRONTEND: useCheckoutLogic.ts (CRÍTICO)**
**Linha 113-122**: Cálculo de total mistura REAIS e CENTAVOS

```typescript
const productPrice = Number(checkout.product.price || 0);  // ❌ É CENTAVOS ou REAIS?
const bumpsTotal = Array.from(state.selectedBumps).reduce((total, bumpId) => {
  const bump = orderBumps.find(b => b.id === bumpId);
  const price = bump ? Number(bump.price || 0) : 0;  // ❌ É CENTAVOS ou REAIS?
  return total + price;
}, 0);
return productPrice + bumpsTotal;  // ❌ Soma de quê com quê?
```

**Problema**: Não sabemos se `checkout.product.price` e `bump.price` são centavos ou reais.

#### 2. **FRONTEND: Conversões Manuais Espalhadas**

**OrderBumpDialog.tsx (Linha 237-238)**:
```typescript
const decimal = parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
return Math.round(decimal * 100);  // ❌ Conversão manual
```

**CouponDialog.tsx (Linha 61)**:
```typescript
const numDiscount = parseFloat(discount);  // ❌ parseFloat solto
```

**OffersManager.tsx (Linha 56)**:
```typescript
const price = parseFloat(offer.price);  // ❌ parseFloat solto
```

#### 3. **BACKEND: mercadopago-create-payment (INCONSISTÊNCIA)**

**Linha 253**:
```typescript
const priceCents = Math.round(Number(product.price) * 100);  // ❌ Conversão manual
```

**Linha 261**:
```typescript
unit_price: Number(product.price),  // ❌ Envia REAIS para Mercado Pago
```

**Linha 286**:
```typescript
amount_cents: Math.round(item.unit_price * 100),  // ❌ Reconverte para centavos
```

**Problema**: Faz conversão REAIS→CENTAVOS→REAIS→CENTAVOS (confuso e arriscado).

#### 4. **FRONTEND: Exibição com .toFixed() Manual**

**CreditCardForm.tsx (Linha 249-250)**:
```typescript
? `1x de R$ ${amount.toFixed(2).replace(".", ",")} sem juros`
: `${i}x de R$ ${installmentAmount.toFixed(2).replace(".", ",")}`;
```

**PaymentMethodsTable.tsx (Linha 52)**:
```typescript
R$ {method.value.toFixed(2)}
```

**Problema**: Formatação manual em vez de usar a função centralizada.

## 🛠️ PLANO DE CORREÇÃO

### FASE 1: Expandir src/utils/money.ts (Bíblia dos Preços)

```typescript
// ✅ Já existe
export function formatCentsToBRL(cents: number): string

// 🆕 ADICIONAR
export function toCents(value: string | number): number
export function toReais(cents: number): number
export function parseBRLInput(input: string): number  // "R$ 19,90" → 1990
```

### FASE 2: Refatorar useCheckoutLogic.ts

- Garantir que `calculateTotal` trabalhe APENAS com CENTAVOS
- Remover qualquer conversão manual
- Usar `toCents()` se necessário

### FASE 3: Refatorar Componentes de Input

- OrderBumpDialog.tsx: Usar `parseBRLInput()` em vez de parseFloat manual
- CouponDialog.tsx: Usar `toCents()`
- OffersManager.tsx: Usar `toCents()`

### FASE 4: Refatorar Componentes de Exibição

- CreditCardForm.tsx: Usar `formatCentsToBRL()` em vez de `.toFixed()`
- PaymentMethodsTable.tsx: Usar `formatCentsToBRL()`

### FASE 5: Refatorar Backend

- mercadopago-create-payment: Eliminar conversões redundantes
- Garantir que `product.price` seja convertido UMA VEZ para centavos
- Enviar para Mercado Pago já em centavos (eles esperam centavos)

## 📈 RESULTADO ESPERADO

- ✅ Zero ambiguidade: Toda variável terá sufixo `_cents` ou `_reais`
- ✅ Zero parseFloat solto: Tudo via `toCents()`
- ✅ Zero .toFixed() solto: Tudo via `formatCentsToBRL()`
- ✅ Backend: Conversão acontece UMA VEZ ao ler do banco
- ✅ Frontend: Estado sempre em CENTAVOS, formatação só na exibição
