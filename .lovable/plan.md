
# Plano RISE V3: Adicionar Status "Recusado" para Cartões Recusados

## Diagnóstico

### Problema Atual

Quando um cliente tenta pagar com cartão e é **recusado** (CVV inválido, limite, etc):

1. Backend (`mercadopago-create-payment`) recebe `status: 'rejected'` do MercadoPago
2. Adapter mapeia para `refused` e retorna `success: false`
3. Edge Function **retorna erro HTTP 400 SEM ATUALIZAR A ORDER**
4. Order permanece com `status: 'pending'`
5. Vendedor vê "Pendente" e não sabe que houve tentativa de cartão recusado

### Referência Visual (Cakto)

Conforme a imagem que você enviou, a Cakto usa:
- **"Recusado!"** (vermelho) = Cartão de crédito que falhou
- **"Pago"** (verde) = Pagamento aprovado
- **"Pendente"** (amarelo) = PIX aguardando
- **"Chargeback"** = Contestação

---

## Análise de Soluções (RISE Protocol V3 Seção 4.4)

### Solução A: Adicionar "Recusado" como Status Canônico

Adicionar `'refused'` como 5º status canônico, específico para cartões recusados:
- Modificar `CANONICAL_STATUSES` para incluir `'refused'`
- Backend atualiza order para `status: 'refused'` quando cartão é recusado
- Dashboard exibe "Recusado" em vermelho
- Separação clara: PIX = Pendente, Cartão Recusado = Recusado

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Status canônico explícito, semântica clara |
| Zero DT | 10/10 | Solução definitiva, igual Cakto |
| Arquitetura | 10/10 | Separação correta entre PIX e Cartão |
| Escalabilidade | 10/10 | Funciona para qualquer gateway de cartão |
| Segurança | 10/10 | Não afeta segurança |

- **NOTA FINAL: 10.0/10**
- Tempo estimado: 4-6 horas

### Solução B: Usar technical_status sem novo status canônico

Manter 4 status canônicos e usar `technical_status = 'card_declined'`:
- Order fica `status: 'pending'`, `technical_status: 'card_declined'`
- Dashboard mostra badge adicional "⚠️ Cartão Recusado" ao lado de "Pendente"

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 7/10 | Mistura conceitos (pendente + recusado) |
| Zero DT | 8/10 | Funciona, mas não segue padrão Cakto |
| Arquitetura | 6/10 | Confunde PIX pendente com cartão recusado |
| Escalabilidade | 8/10 | Funciona, mas semanticamente incorreto |
| Segurança | 10/10 | Não afeta segurança |

- **NOTA FINAL: 7.6/10**
- Tempo estimado: 3-4 horas

### DECISÃO: Solução A (Nota 10.0/10)

**Justificativa**: "Pendente" é para PIX aguardando pagamento. "Recusado" é para cartão que foi negado. São conceitos **completamente diferentes** e devem ter status **separados**. A Cakto (imagem de referência) faz exatamente isso.

---

## Plano de Implementação

### Fase 1: Backend - Atualizar Order Quando Cartão é Recusado

**Arquivo**: `supabase/functions/mercadopago-create-payment/index.ts`

**Alteração**: Antes de retornar erro HTTP 400, atualizar a order com `status: 'refused'`:

```typescript
// NOVO: Quando cartão é recusado, atualizar a order ANTES de retornar erro
if (!result.success && result.status === 'refused') {
  await supabase.from('orders').update({
    status: 'refused',
    gateway: 'mercadopago',
    gateway_payment_id: result.transaction_id || null,
    payment_method: 'credit_card',
    updated_at: new Date().toISOString()
  }).eq('id', orderId);
}
```

### Fase 2: Frontend - Adicionar "Recusado" ao Modelo de Status

**Arquivos a modificar**:

1. **`src/lib/order-status/types.ts`**
   - Adicionar `'refused'` aos `CANONICAL_STATUSES`
   - Adicionar display label: `refused: 'Recusado'`
   - Adicionar cores: vermelho (igual chargeback)

2. **`src/lib/order-status/service.ts`**
   - Mapear status `rejected`, `refused`, `declined` → `'refused'`

3. **`src/modules/dashboard/types/dashboard.types.ts`**
   - Adicionar `"Recusado"` ao tipo `CustomerDisplayStatus`

4. **`src/components/dashboard/order-details/statusConfig.ts`**
   - Adicionar configuração para status "Recusado"

5. **`src/components/dashboard/recent-customers/CustomerTableRow.tsx`**
   - Adicionar estilo para status "Recusado"

### Fase 3: Filtro no Dashboard

**Arquivo**: `src/modules/dashboard/components/RecentCustomersSection.tsx` (ou similar)

Adicionar aba "Recusados" igual a imagem da Cakto:
- Aprovadas | Reembolsadas | Chargeback | MED | **Recusados** | Todas

---

## Alterações Detalhadas

### 1. src/lib/order-status/types.ts

```typescript
// ANTES
export const CANONICAL_STATUSES = [
  'paid',
  'pending',
  'refunded',
  'chargeback',
] as const;

// DEPOIS
export const CANONICAL_STATUSES = [
  'paid',
  'pending',
  'refused',      // NOVO: Cartão recusado
  'refunded',
  'chargeback',
] as const;

// Display Map
export const STATUS_DISPLAY_MAP = {
  paid: 'Pago',
  pending: 'Pendente',
  refused: 'Recusado',  // NOVO
  refunded: 'Reembolso',
  chargeback: 'Chargeback',
} as const;

// Cores
export const STATUS_COLORS = {
  // ... existentes ...
  refused: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    border: 'border-orange-500/20',
    dot: 'bg-orange-500',
  },
};
```

### 2. src/lib/order-status/service.ts

```typescript
// Adicionar mapeamentos
const GATEWAY_STATUS_MAP = {
  // ... existentes ...
  
  // NOVO: Cartão recusado → 'refused' (NÃO mais pending)
  rejected: 'refused',
  refused: 'refused',
  declined: 'refused',
  card_declined: 'refused',
  cc_rejected: 'refused',
};
```

### 3. src/modules/dashboard/types/dashboard.types.ts

```typescript
// ANTES
export type CustomerDisplayStatus = 
  | "Pago" 
  | "Pendente" 
  | "Reembolso" 
  | "Chargeback";

// DEPOIS
export type CustomerDisplayStatus = 
  | "Pago" 
  | "Pendente" 
  | "Recusado"    // NOVO
  | "Reembolso" 
  | "Chargeback";
```

### 4. Backend - mercadopago-create-payment/index.ts

```typescript
// Linha ~237-240, ANTES de retornar erro:
if (!result.success) {
  // NOVO: Registrar recusa no banco
  if (result.status === 'refused') {
    await supabase.from('orders').update({
      status: 'refused',
      gateway: 'mercadopago',
      gateway_payment_id: result.transaction_id || null,
      payment_method: 'credit_card',
      updated_at: new Date().toISOString()
    }).eq('id', orderId);
  }
  
  return createErrorResponse(...);
}
```

### 5. CustomerTableRow.tsx - Adicionar estilo para Recusado

```typescript
<Badge
  className={cn(
    customer.status === "Pago" 
      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      : customer.status === "Pendente"
      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
      : customer.status === "Recusado"  // NOVO
      ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
      : // Reembolso e Chargeback
        "bg-red-500/10 text-red-500 border-red-500/20"
  )}
>
```

---

## Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────┐
│                   PAGAMENTO COM CARTÃO                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  MercadoPago retorna status                                  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         'approved'      'pending'       'rejected'
              │               │               │
              ▼               ▼               ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ Order:      │   │ Order:      │   │ Order:      │
    │ status=paid │   │ status=     │   │ status=     │
    │             │   │ pending     │   │ refused     │
    └─────────────┘   └─────────────┘   └─────────────┘
              │               │               │
              ▼               ▼               ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ Dashboard:  │   │ Dashboard:  │   │ Dashboard:  │
    │ "Pago"      │   │ "Pendente"  │   │ "Recusado"  │
    │ (verde)     │   │ (amarelo)   │   │ (laranja)   │
    └─────────────┘   └─────────────┘   └─────────────┘
```

---

## Impacto na UI (Igual Cakto)

```text
┌─────────────────────────────────────────────────────────────┐
│  Últimos Clientes                                           │
├─────────────────────────────────────────────────────────────┤
│  João Silva    joao@email.com    R$ 97,00   [Recusado]     │
│  Maria Santos  maria@email.com   R$ 197,00  [Pago]         │
│  Pedro Lima    pedro@email.com   R$ 47,00   [Pendente]     │
│  Ana Costa     ana@email.com     R$ 127,00  [Recusado]     │
└─────────────────────────────────────────────────────────────┘
```

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Status canônico explícito, semântica clara |
| Zero Dívida Técnica | Separação correta: PIX ≠ Cartão Recusado |
| Arquitetura Correta | Igual padrão Cakto (referência do usuário) |
| Escalabilidade | Aplicável a todos os gateways de cartão |
| Segurança | Não expõe dados sensíveis |

**RISE V3 Score: 10.0/10**

---

## Arquivos a Modificar (Resumo)

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/order-status/types.ts` | Adicionar `'refused'` aos status canônicos |
| `src/lib/order-status/service.ts` | Mapear `rejected` → `'refused'` |
| `src/modules/dashboard/types/dashboard.types.ts` | Adicionar `"Recusado"` ao CustomerDisplayStatus |
| `src/components/dashboard/order-details/statusConfig.ts` | Adicionar config para "Recusado" |
| `src/components/dashboard/recent-customers/CustomerTableRow.tsx` | Adicionar estilo para "Recusado" |
| `supabase/functions/mercadopago-create-payment/index.ts` | Atualizar order para `refused` quando cartão recusado |
| `supabase/functions/asaas-create-payment/index.ts` | Mesmo tratamento (se existir) |
