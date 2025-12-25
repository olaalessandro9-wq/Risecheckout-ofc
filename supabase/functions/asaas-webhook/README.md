# Asaas Webhook

> Edge Function para processar eventos de pagamento do Asaas.

---

## 📋 Resumo

| Propriedade | Valor |
|-------------|-------|
| **Endpoint** | `POST /functions/v1/asaas-webhook` |
| **Auth** | Token via header `asaas-access-token` |
| **Chamador** | Asaas (automático) |

---

## 🔐 Autenticação

O webhook é protegido por token:

```http
asaas-access-token: SEU_TOKEN_AQUI
```

O token é validado contra o secret `ASAAS_WEBHOOK_TOKEN`.

---

## 📥 Eventos Suportados

| Evento Asaas | Status Interno | Descrição |
|--------------|----------------|-----------|
| `PAYMENT_CONFIRMED` | `paid` | Pagamento confirmado |
| `PAYMENT_RECEIVED` | `paid` | Pagamento recebido |
| `PAYMENT_OVERDUE` | `expired` | Pagamento vencido |
| `PAYMENT_REFUNDED` | `refunded` | Reembolso processado |
| `PAYMENT_DELETED` | - | Pagamento excluído |
| `PAYMENT_UPDATED` | - | Atualização geral |
| `PAYMENT_CREATED` | `pending` | Cobrança criada |

---

## 📤 Payload do Asaas

```typescript
interface AsaasWebhookEvent {
  event: string;              // Tipo do evento
  payment?: {
    id: string;               // ID do pagamento no Asaas
    customer: string;         // ID do customer
    billingType: string;      // PIX, CREDIT_CARD, etc
    value: number;            // Valor em reais
    status: string;           // Status no Asaas
    externalReference?: string;  // order_id
    confirmedDate?: string;   // Data de confirmação
    paymentDate?: string;     // Data do pagamento
  };
}
```

---

## 🔄 Fluxo de Processamento

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DO WEBHOOK                              │
└─────────────────────────────────────────────────────────────────┘

     ┌─────────────┐
     │  ASAAS      │
     │  Evento     │
     └──────┬──────┘
            │
            ▼
   ┌────────────────┐
   │ Validar Token  │──── INVÁLIDO ────► 401 Unauthorized
   └───────┬────────┘                    + Audit Log
           │ OK
           ▼
   ┌────────────────────────┐
   │ Evento é relevante?    │──── NÃO ────► 200 (ignorado)
   │ (PAYMENT_*)            │
   └───────────┬────────────┘
               │ SIM
               ▼
   ┌────────────────────────┐
   │ Tem externalReference? │──── NÃO ────► 200 (sem order_id)
   │ (order_id)             │
   └───────────┬────────────┘
               │ SIM
               ▼
   ┌────────────────────────┐
   │ Mapear Status          │
   │ Asaas → Interno        │
   └───────────┬────────────┘
               │
               ▼
   ┌────────────────────────┐
   │ Atualizar Ordem        │
   │ (status, paid_at, etc) │
   └───────────┬────────────┘
               │
               ▼
   ┌────────────────────────┐
   │ Registrar order_event  │
   │ (histórico)            │
   └───────────┬────────────┘
               │
               ▼
   ┌────────────────────────┐
   │ Audit Log              │
   │ (PROCESS_PAYMENT)      │
   └───────────┬────────────┘
               │
               ▼
          ┌─────────┐
          │ SUCCESS │
          │   200   │
          └─────────┘
```

---

## 📊 Mapeamento de Status

```typescript
const statusMap: Record<string, string> = {
  'PENDING': 'pending',
  'RECEIVED': 'paid',
  'CONFIRMED': 'paid',
  'OVERDUE': 'expired',
  'REFUNDED': 'refunded',
  'RECEIVED_IN_CASH': 'paid',
  'REFUND_REQUESTED': 'refund_requested',
  'REFUND_IN_PROGRESS': 'refund_in_progress',
  'CHARGEBACK_REQUESTED': 'chargeback',
  'CHARGEBACK_DISPUTE': 'chargeback_dispute',
  'AWAITING_RISK_ANALYSIS': 'pending',
  'DUNNING_REQUESTED': 'pending',
  'DUNNING_RECEIVED': 'paid'
};
```

---

## 📤 Response

### Sucesso

```json
{
  "received": true,
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "paid",
  "asaasPaymentId": "pay_abc123"
}
```

### Token Inválido

```json
{
  "error": "Unauthorized"
}
```

---

## 🔐 Segurança

### Validação de Token

```typescript
const authHeader = req.headers.get('asaas-access-token') || '';

if (authHeader !== ASAAS_WEBHOOK_TOKEN) {
  await logSecurityEvent(supabase, {
    userId: '00000000-0000-0000-0000-000000000000',
    action: SecurityAction.ACCESS_DENIED,
    resource: 'asaas-webhook',
    success: false,
    metadata: { reason: 'Invalid webhook token' }
  });
  
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

### Audit Log

Todas as atualizações de pagamento são logadas:

```typescript
await logSecurityEvent(supabase, {
  userId: vendorId,
  action: SecurityAction.PROCESS_PAYMENT,
  resource: 'orders',
  resourceId: orderId,
  metadata: {
    gateway: 'asaas',
    eventType,
    paymentId: payment.id,
    newStatus: internalStatus
  }
});
```

---

## 🔗 Secrets Necessários

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `ASAAS_WEBHOOK_TOKEN` | Token para validar chamadas |

---

## ⚙️ Configuração no Asaas

1. Acesse o painel Asaas → Integrações → Webhooks
2. Configure a URL:
   ```
   https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/asaas-webhook
   ```
3. Adicione o header de autenticação:
   ```
   asaas-access-token: SEU_TOKEN
   ```
4. Selecione os eventos:
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_RECEIVED`
   - `PAYMENT_REFUNDED`
   - `PAYMENT_OVERDUE`

---

## 📊 Logs

### Prefixo

```
[asaas-webhook] Evento recebido: {...}
[asaas-webhook] Atualizando order XXX para status paid
[asaas-webhook] Order XXX atualizada com sucesso para paid
```

### Onde Ver

[Logs da função asaas-webhook](https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions/asaas-webhook/logs)

---

## 🧪 Testando

### cURL Simulando Evento

```bash
curl -X POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/asaas-webhook \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: SEU_TOKEN" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_test123",
      "status": "CONFIRMED",
      "value": 99.00,
      "externalReference": "ORDER_ID_AQUI"
    }
  }'
```

---

## 🔗 Links

- [Documentação Webhooks Asaas](https://docs.asaas.com/docs/webhooks)
- [Logs da Função](https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions/asaas-webhook/logs)
- [Módulos Compartilhados](../_shared/README.md)
