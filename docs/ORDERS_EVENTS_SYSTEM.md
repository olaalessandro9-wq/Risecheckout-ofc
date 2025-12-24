# Sistema de Eventos de Checkout

Sistema completo para gerenciar pedidos, eventos, abandono e webhooks.

---

## 📋 Arquitetura

### **Tabelas no Supabase**

#### `orders`
Pedidos (um por tentativa de compra)

```sql
- id: uuid (PK)
- vendor_id: uuid (FK → auth.users)
- product_id: uuid (FK → products)
- customer_email: text
- customer_name: text
- amount_cents: int
- currency: text (default 'BRL')
- payment_method: text
- gateway: text
- gateway_payment_id: text (unique)
- status: text
- created_at: timestamptz
- updated_at: timestamptz
```

**Status possíveis:**
- `initiated` - Pedido criado
- `pix_pending` - Aguardando pagamento PIX
- `authorized` - Pagamento autorizado (cartão)
- `paid` - Pago
- `declined` - Recusado
- `refunded` - Reembolsado
- `chargeback` - Chargeback
- `canceled` - Cancelado
- `expired` - Expirado
- `abandoned` - Abandonado

---

#### `order_events`
Timeline de eventos (imutável, idempotente)

```sql
- id: uuid (PK)
- order_id: uuid (FK → orders)
- vendor_id: uuid (FK → auth.users)
- type: text
- data: jsonb
- gateway_event_id: text (unique)
- occurred_at: timestamptz
- created_at: timestamptz
```

**Tipos de eventos:**
- `PIX_GENERATED` - PIX gerado
- `PAYMENT_APPROVED` - Pagamento aprovado
- `PAYMENT_DECLINED` - Pagamento recusado
- `PAYMENT_REFUNDED` - Reembolso
- `CHARGEBACK` - Chargeback
- `PIX_EXPIRED` - PIX expirado
- `ORDER_CREATED` - Pedido criado
- `ORDER_CANCELED` - Pedido cancelado
- `CHECKOUT_ABANDONED` - Checkout abandonado

---

#### `checkout_sessions`
Sessões (para detectar abandono)

```sql
- id: uuid (PK)
- order_id: uuid (FK → orders)
- vendor_id: uuid (FK → auth.users)
- started_at: timestamptz
- last_seen_at: timestamptz
- status: text (default 'active')
```

---

#### `outbound_webhooks`
Configuração de webhooks de saída

```sql
- id: uuid (PK)
- vendor_id: uuid (FK → auth.users)
- url: text
- secret: text
- events: text[]
- active: boolean (default true)
- created_at: timestamptz
- updated_at: timestamptz
```

---

#### `webhook_deliveries`
Registro de tentativas de webhook

```sql
- id: uuid (PK)
- webhook_id: uuid (FK → outbound_webhooks)
- order_id: uuid (FK → orders)
- event_type: text
- payload: jsonb
- status: text
- attempts: int (default 0)
- last_attempt_at: timestamptz
- next_retry_at: timestamptz
- response_status: int
- response_body: text
- created_at: timestamptz
```

---

## 🔄 Fluxo de Eventos

### **1. Webhook de Entrada (PushingPay)**

**Endpoint:** `/webhook-pushingpay`

**Fluxo:**
1. Recebe webhook do gateway
2. Valida assinatura HMAC
3. Normaliza evento para padrão interno
4. Busca pedido por `gateway_payment_id`
5. Registra evento (idempotente via `gateway_event_id`)
6. Atualiza status do pedido (state machine)
7. Publica para n8n (opcional)
8. Despacha webhooks de saída

**Exemplo de payload:**
```json
{
  "type": "payment.approved",
  "id": "evt_123",
  "payment_id": "pay_456",
  "amount": 5660,
  "paid_at": "2025-10-26T10:00:00Z"
}
```

---

### **2. Sistema de Abandono**

#### **Heartbeat (Frontend)**

**Endpoint:** `/checkout-heartbeat`

**Chamada:** A cada 20 segundos

**Payload:**
```json
{
  "sessionId": "uuid"
}
```

**Função:** Atualiza `last_seen_at` da sessão

---

#### **Job de Detecção**

**Endpoint:** `/detect-abandoned-checkouts`

**Execução:** Cron a cada 10-15 minutos

**Lógica:**
- Busca sessões com `status = 'active'`
- Pedido com `status in ('initiated', 'pix_pending')`
- `last_seen_at < now() - 30 minutes`
- Marca sessão e pedido como `abandoned`
- Registra evento `CHECKOUT_ABANDONED`

---

### **3. Webhooks de Saída**

**Configuração:**
```sql
INSERT INTO outbound_webhooks (vendor_id, url, secret, events)
VALUES (
  'uuid-vendor',
  'https://example.com/webhook',
  'secret-key',
  ARRAY['PAYMENT_APPROVED', 'CHECKOUT_ABANDONED']
);
```

**Payload enviado:**
```json
{
  "event": "PAYMENT_APPROVED",
  "orderId": "uuid",
  "vendorId": "uuid",
  "status": "paid",
  "customerEmail": "customer@example.com",
  "amount": 5660,
  "currency": "BRL",
  "occurredAt": "2025-10-26T10:00:00Z"
}
```

**Headers:**
```
Content-Type: application/json
X-Webhook-Signature: hmac-sha256-signature
X-Webhook-Event: PAYMENT_APPROVED
X-Webhook-Timestamp: 2025-10-26T10:00:00Z
```

**Retry schedule:**
- Tentativa 1: imediato
- Tentativa 2: 5 min depois
- Tentativa 3: 15 min depois
- Tentativa 4: 1 hora depois
- Tentativa 5: 6 horas depois
- Depois: desiste

---

### **4. Integração com n8n**

**Variável de ambiente:**
```
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/orders
```

**Payload:**
```json
{
  "orderId": "uuid",
  "vendorId": "uuid",
  "eventType": "PAYMENT_APPROVED",
  "status": "paid",
  "customerEmail": "customer@example.com",
  "amount": 5660,
  "occurredAt": "2025-10-26T10:00:00Z"
}
```

**Workflows no n8n:**
- Enviar e-mail de compra aprovada
- Enviar e-mail de abandono
- Notificar vendedor
- Atualizar CRM
- etc.

---

## 🔐 Segurança

### **Validação de Assinatura (Entrada)**

```typescript
const signature = req.headers.get('x-pushingpay-signature');
const isValid = await verifyPushingPaySignature(payload, signature, secret);
```

### **Geração de Assinatura (Saída)**

```typescript
const signature = await generateSignature(payloadString, secret);
// Header: X-Webhook-Signature: {signature}
```

### **Validação no Receptor**

```python
import hmac
import hashlib

def verify_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

---

## 🚀 Deploy

### **1. Criar Edge Functions**

```bash
# Webhook de entrada
supabase functions deploy webhook-pushingpay

# Heartbeat
supabase functions deploy checkout-heartbeat

# Jobs
supabase functions deploy detect-abandoned-checkouts
supabase functions deploy retry-webhooks
```

### **2. Configurar Variáveis de Ambiente**

```bash
supabase secrets set PUSHINGPAY_WEBHOOK_SECRET=your-secret
supabase secrets set N8N_WEBHOOK_URL=https://n8n.example.com/webhook/orders
supabase secrets set CRON_SECRET=your-cron-secret
```

### **3. Configurar Cron Jobs**

**Opção 1: Supabase Cron (pg_cron)**

```sql
SELECT cron.schedule(
  'detect-abandoned-checkouts',
  '*/10 * * * *', -- A cada 10 minutos
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/detect-abandoned-checkouts',
    headers := '{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'retry-webhooks',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/retry-webhooks',
    headers := '{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
  );
  $$
);
```

**Opção 2: Serviço externo (cron-job.org, GitHub Actions, etc.)**

---

## 📊 Monitoramento

### **Logs de Eventos**

```sql
-- Eventos recentes
SELECT *
FROM order_events
ORDER BY occurred_at DESC
LIMIT 100;

-- Eventos por tipo
SELECT type, COUNT(*)
FROM order_events
GROUP BY type
ORDER BY COUNT(*) DESC;
```

### **Webhooks Pendentes**

```sql
SELECT *
FROM webhook_deliveries
WHERE status = 'pending_retry'
ORDER BY next_retry_at;
```

### **Checkouts Abandonados**

```sql
SELECT *
FROM orders
WHERE status = 'abandoned'
ORDER BY updated_at DESC;
```

---

## 🧪 Testes

### **Testar Webhook de Entrada**

```bash
curl -X POST https://your-project.supabase.co/functions/v1/webhook-pushingpay \
  -H "Content-Type: application/json" \
  -H "x-pushingpay-signature: your-signature" \
  -d '{
    "type": "payment.approved",
    "id": "evt_test_123",
    "payment_id": "pay_test_456",
    "amount": 5660,
    "paid_at": "2025-10-26T10:00:00Z"
  }'
```

### **Testar Heartbeat**

```bash
curl -X POST https://your-project.supabase.co/functions/v1/checkout-heartbeat \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "your-session-id"}'
```

### **Testar Job de Abandono**

```bash
curl -X POST https://your-project.supabase.co/functions/v1/detect-abandoned-checkouts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📚 Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [HMAC SHA-256](https://en.wikipedia.org/wiki/HMAC)
- [State Machine Pattern](https://en.wikipedia.org/wiki/Finite-state_machine)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)

