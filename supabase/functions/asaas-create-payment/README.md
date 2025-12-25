# Asaas Create Payment

> Edge Function para criar cobranças PIX e Cartão via Asaas.

---

## 📋 Resumo

| Propriedade | Valor |
|-------------|-------|
| **Endpoint** | `POST /functions/v1/asaas-create-payment` |
| **Auth** | Não requer JWT (público) |
| **Rate Limit** | 10 req/min por IP |
| **Gateway** | Asaas (PIX + Cartão) |

---

## 🏪 Modelo Marketplace

Esta função opera sob o **Modelo Marketplace Asaas**:

```
┌─────────────────────────────────────────────────────────────────┐
│              MODELO MARKETPLACE - SPLIT BINÁRIO                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ REGRA: Todas cobranças na conta RiseCheckout                    │
│        Split SEMPRE binário (nunca 3 partes)                    │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ CENÁRIO 1: OWNER DIRETO                                     │ │
│ │ └─► 100% → RiseCheckout (sem split)                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ CENÁRIO 2: OWNER + AFILIADO                                 │ │
│ │ └─► Afiliado: X% × 0.96                                     │ │
│ │ └─► Owner: 100% - (X% × 0.96)                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ CENÁRIO 3: VENDEDOR COMUM                                   │ │
│ │ └─► 96% → Vendedor                                          │ │
│ │ └─► 4%  → Plataforma                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📥 Request

### Headers

```http
Content-Type: application/json
```

### Body

```typescript
interface PaymentRequest {
  vendorId: string;           // UUID do vendedor
  orderId: string;            // UUID da ordem (já criada)
  amountCents: number;        // Valor em centavos
  paymentMethod: 'pix' | 'credit_card';
  customer: {
    name: string;
    email: string;
    document: string;         // CPF ou CNPJ
    phone?: string;
  };
  description?: string;
  cardToken?: string;         // Obrigatório para credit_card
  installments?: number;      // Parcelas (1-12)
}
```

### Exemplo PIX

```json
{
  "vendorId": "ccff612c-93e6-4acc-85d9-7c9d978a7e4e",
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "amountCents": 9900,
  "paymentMethod": "pix",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "document": "123.456.789-00",
    "phone": "11999999999"
  },
  "description": "Curso de Marketing Digital"
}
```

### Exemplo Cartão

```json
{
  "vendorId": "ccff612c-93e6-4acc-85d9-7c9d978a7e4e",
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "amountCents": 19900,
  "paymentMethod": "credit_card",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "document": "123.456.789-00"
  },
  "cardToken": "tok_abc123xyz",
  "installments": 3
}
```

---

## 📤 Response

### Sucesso (200)

```typescript
interface PaymentResponse {
  success: true;
  transactionId: string;      // ID do pagamento no Asaas
  status: 'pending' | 'approved';
  qrCode?: string;            // Base64 do QR Code (PIX)
  qrCodeText?: string;        // Payload copia e cola (PIX)
  splitApplied: boolean;
  splitDetails: {
    platformFeeCents: number;
    affiliateCommissionCents: number;
    vendorNetCents: number;
    hasAffiliate: boolean;
  };
  rawResponse: object;        // Resposta completa do Asaas
}
```

### Erro de Validação (400)

```json
{
  "success": false,
  "error": "Campos obrigatórios: vendorId, orderId, amountCents, customer"
}
```

### Rate Limit (429)

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45
}
```

### Erro Interno (500)

```json
{
  "success": false,
  "error": "Erro ao criar cobrança"
}
```

---

## 🔄 Fluxo de Execução

```
┌──────────────────────────────────────────────────────────────────┐
│                      FLUXO DE EXECUÇÃO                            │
└──────────────────────────────────────────────────────────────────┘

     ┌─────────────┐
     │   REQUEST   │
     └──────┬──────┘
            │
            ▼
   ┌────────────────┐
   │  Rate Limit    │──── BLOCKED ────► 429 Too Many Requests
   └───────┬────────┘
           │ OK
           ▼
   ┌────────────────┐
   │  Validações    │──── FALHA ────► 400 Bad Request
   └───────┬────────┘
           │ OK
           ▼
   ┌────────────────────────────────┐
   │  Buscar Credenciais Gateway    │
   │  (Owner ou Vendor)             │
   └───────────────┬────────────────┘
                   │
                   ▼
   ┌────────────────────────────────┐
   │  Calcular Split Marketplace    │
   │  (asaas-split-calculator.ts)   │
   └───────────────┬────────────────┘
                   │
                   ▼
   ┌────────────────────────────────┐
   │  Buscar/Criar Customer Asaas   │
   │  (asaas-customer.ts)           │
   └───────────────┬────────────────┘
                   │
                   ▼
   ┌────────────────────────────────┐
   │  Montar Split Rules            │
   │  (baseado no cenário)          │
   └───────────────┬────────────────┘
                   │
                   ▼
   ┌────────────────────────────────┐
   │  Criar Cobrança Asaas          │
   │  POST /payments                │
   └───────────────┬────────────────┘
                   │
           ┌───────┴───────┐
           │               │
           ▼               ▼
      ┌─────────┐    ┌──────────┐
      │   PIX   │    │  CARTÃO  │
      └────┬────┘    └────┬─────┘
           │              │
           ▼              │
   ┌───────────────┐      │
   │ Obter QR Code │      │
   └───────┬───────┘      │
           │              │
           └──────┬───────┘
                  │
                  ▼
   ┌────────────────────────────────┐
   │  Atualizar Ordem no DB         │
   │  (platform_fee, gateway_id)    │
   └───────────────┬────────────────┘
                   │
                   ▼
   ┌────────────────────────────────┐
   │  Audit Log                     │
   │  (SecurityAction.PROCESS_PAY)  │
   └───────────────┬────────────────┘
                   │
                   ▼
              ┌─────────┐
              │ SUCCESS │
              └─────────┘
```

---

## 🔐 Segurança

### Rate Limiting

```typescript
const RATE_LIMIT_CONFIG = {
  maxAttempts: 10,
  windowMs: 60 * 1000, // 1 minuto
  action: 'asaas_create_payment'
};
```

### Audit Logging

Cada pagamento processado é registrado:

```typescript
await logSecurityEvent(supabase, {
  userId: vendorId,
  action: SecurityAction.PROCESS_PAYMENT,
  resource: 'orders',
  resourceId: orderId,
  metadata: {
    gateway: 'asaas',
    paymentMethod,
    amountCents,
    hasAffiliate: splitData.hasAffiliate
  }
});
```

---

## 🔗 Dependências

### Módulos Internos

- `../_shared/platform-config.ts` - Configurações e credenciais
- `../_shared/asaas-customer.ts` - Gerenciamento de clientes
- `../_shared/asaas-split-calculator.ts` - Cálculo de split
- `../_shared/rate-limit.ts` - Proteção contra abuso
- `../_shared/audit-logger.ts` - Auditoria

### Secrets Necessários

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `ASAAS_API_KEY` | API Key da conta RiseCheckout |
| `ASAAS_PLATFORM_WALLET_ID` | Wallet ID da plataforma |

---

## 📊 Logs

### Prefixo

Todos os logs usam `[asaas-create-payment]`:

```
[asaas-create-payment] ========================================
[asaas-create-payment] 🏪 MODELO MARKETPLACE ASAAS
[asaas-create-payment] ========================================
[asaas-create-payment] Payload: {...}
[asaas-create-payment] 🔑 Credenciais: Owner
[asaas-create-payment] 🌐 Ambiente: SANDBOX
[asaas-create-payment] SPLIT CALCULADO:
[asaas-create-payment] - É Owner: true
[asaas-create-payment] - Tem Afiliado: false
[asaas-create-payment] ✅ Cobrança criada: pay_abc123
[asaas-create-payment] ✅ Sucesso
```

### Onde Ver

[Logs da função asaas-create-payment](https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions/asaas-create-payment/logs)

---

## 🧪 Testando

### cURL - PIX

```bash
curl -X POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/asaas-create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "ccff612c-93e6-4acc-85d9-7c9d978a7e4e",
    "orderId": "ORDER_ID_AQUI",
    "amountCents": 100,
    "paymentMethod": "pix",
    "customer": {
      "name": "Teste",
      "email": "teste@teste.com",
      "document": "12345678900"
    }
  }'
```

---

## 🔗 Links

- [Documentação Asaas API](https://docs.asaas.com/)
- [Logs da Função](https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions/asaas-create-payment/logs)
- [Módulos Compartilhados](../_shared/README.md)
