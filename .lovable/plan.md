

# Auditoria Completa: Integração UTMify vs Documentação Oficial

## Diagnóstico Técnico: 9 Erros Críticos Identificados

Após análise profunda da documentação oficial da API UTMify e do código atual, identifiquei **9 erros críticos** que estão causando falha total na integração.

---

## Sumário dos Erros

| # | Categoria | Erro | Gravidade |
|---|-----------|------|-----------|
| 1 | Endpoint | URL completamente errada | CRÍTICA |
| 2 | Header | Nome do header de autenticação errado | CRÍTICA |
| 3 | Payload | Estrutura não segue o schema da API | CRÍTICA |
| 4 | Payload | Campo `platform` ausente (obrigatório) | CRÍTICA |
| 5 | Payload | Nomes de campos incorretos | CRÍTICA |
| 6 | Database | Colunas UTM não existem na tabela `orders` | CRÍTICA |
| 7 | Database | UTM params estão em `checkout_visits`, não em `orders` | CRÍTICA |
| 8 | Fluxo | Edge Function ignora `orderData` enviado pelo frontend | ALTA |
| 9 | Validação | Sem validação de campos obrigatórios | MÉDIA |

---

## Erro 1: URL Errada

```text
ATUAL (ERRADO):
https://api.utmify.com.br/api/v1/conversion

DOCUMENTAÇÃO (CORRETO):
https://api.utmify.com.br/api-credentials/orders
```

A Edge Function está enviando para um endpoint que provavelmente nem existe ou retorna 404.

---

## Erro 2: Header de Autenticação Errado

```text
ATUAL (ERRADO):
headers: {
  'Authorization': 'Bearer ${token}',
  'Content-Type': 'application/json',
}

DOCUMENTAÇÃO (CORRETO):
headers: {
  'x-api-token': '${token}',
  'Content-Type': 'application/json',
}
```

A UTMify usa `x-api-token` no header, não `Authorization: Bearer`.

---

## Erro 3: Estrutura do Payload Incompatível

**ATUAL (Edge Function):**
```json
{
  "transaction_id": "order-123",
  "value": 99.90,
  "currency": "BRL",
  "email": "customer@example.com"
}
```

**DOCUMENTAÇÃO (Correto):**
```json
{
  "orderId": "order-123",
  "platform": "RiseCheckout",
  "paymentMethod": "pix",
  "status": "paid",
  "createdAt": "2024-07-25 15:34:14",
  "approvedDate": "2024-07-25 15:41:12",
  "refundedAt": null,
  "customer": {
    "name": "Nome Cliente",
    "email": "email@example.com",
    "phone": "11999999999",
    "document": "12345678900",
    "country": "BR",
    "ip": "192.168.1.1"
  },
  "products": [{
    "id": "product-123",
    "name": "Produto",
    "planId": null,
    "planName": null,
    "quantity": 1,
    "priceInCents": 9990
  }],
  "trackingParameters": {
    "src": null,
    "sck": null,
    "utm_source": "FB",
    "utm_campaign": "CAMPANHA_1",
    "utm_medium": "ABO",
    "utm_content": "VIDEO_1",
    "utm_term": "Instagram_Feed"
  },
  "commission": {
    "totalPriceInCents": 9990,
    "gatewayFeeInCents": 300,
    "userCommissionInCents": 9690,
    "currency": "BRL"
  },
  "isTest": false
}
```

---

## Erro 4: Campo `platform` Ausente

A documentação exige o campo `platform` (nome da plataforma integrando com UTMify), que deve ser algo como `"RiseCheckout"`. Este campo não existe no payload atual.

---

## Erro 5: Nomes de Campos Incorretos

| Campo Atual | Campo Correto (Doc) |
|-------------|---------------------|
| `transaction_id` | `orderId` |
| `value` | `commission.totalPriceInCents` |
| - | `platform` (ausente) |
| - | `paymentMethod` (não está sendo passado) |
| - | `status` (não está sendo passado) |

---

## Erro 6 e 7: Colunas UTM Não Existem na Tabela Orders

O `order-handler.ts` tenta fazer SELECT em colunas que não existem:

```sql
SELECT utm_source, utm_medium, utm_campaign, utm_content, utm_term, src, sck
FROM orders
```

**Resultado:** Essas colunas retornam `null` ou causam erro porque **não existem** na tabela `orders`.

**Onde os UTM params estão:** Na tabela `checkout_visits`, vinculada via `checkout_id`.

---

## Erro 8: Edge Function Ignora orderData

O frontend envia `orderData` completo e correto:

```typescript
await sendUTMifyConversion(vendorId, {
  orderId: orderId,
  paymentMethod: "pix",
  status: "paid",
  customer: { ... },
  products: [ ... ],
  trackingParameters: { ... },
  commission: { ... },
});
```

Mas a Edge Function **ignora** tudo isso e constrói um payload mínimo incorreto:

```typescript
const utmifyPayload = {
  transaction_id: orderId,
  value: order.amount_cents / 100,
  currency: 'BRL',
  email: order.customer_email,
  ...conversionData,  // <-- conversionData não existe!
};
```

---

## Plano de Correção (10.0/10)

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/utmify-conversion/index.ts` | Reescrever completamente |
| `supabase/functions/checkout-public-data/handlers/order-handler.ts` | JOIN com checkout_visits para buscar UTM |
| `src/integrations/tracking/utmify/types.ts` | Validar conformidade com API |
| `docs/EDGE_FUNCTIONS_REGISTRY.md` | Atualizar documentação |

### Fase 1: Corrigir Edge Function

Reescrever `utmify-conversion/index.ts` para:

1. Usar URL correta: `https://api.utmify.com.br/api-credentials/orders`
2. Usar header correto: `x-api-token`
3. Montar payload conforme documentação oficial
4. Aceitar `orderData` do frontend como fonte principal

### Fase 2: Corrigir Fluxo de UTM Parameters

Opção A (Recomendada): **Adicionar colunas UTM na tabela `orders`**

Adicionar migration para criar colunas:
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `src`
- `sck`

E popular essas colunas no momento da criação do order via JOIN com `checkout_visits`.

Opção B: **JOIN em tempo real**

No `order-handler.ts`, fazer JOIN com `checkout_visits` para buscar os UTM params:

```sql
SELECT orders.*, cv.utm_source, cv.utm_medium, ...
FROM orders
LEFT JOIN checkout_visits cv ON cv.checkout_id = orders.checkout_id
```

### Fase 3: Validação de Campos

Adicionar validação de campos obrigatórios antes de enviar para a API:
- `orderId` (obrigatório)
- `platform` (obrigatório, fixo como "RiseCheckout")
- `paymentMethod` (obrigatório)
- `status` (obrigatório, enum)
- `createdAt` (obrigatório, formato UTC)
- `customer.name` (obrigatório)
- `customer.email` (obrigatório)
- `products[]` (obrigatório, array não vazio)
- `commission.totalPriceInCents` (obrigatório)
- `commission.userCommissionInCents` (obrigatório)

---

## Estrutura Final da Edge Function

```text
supabase/functions/utmify-conversion/
├── index.ts              # Handler principal (reescrito)
├── types.ts              # Tipos conforme documentação
├── validators.ts         # Validação de payload
├── payload-builder.ts    # Construtor de payload
└── tests/
    ├── _shared.ts        # Atualizar URL e mocks
    ├── payload.test.ts   # Testar payload builder
    └── integration.test.ts
```

---

## Seção Técnica: Código Corrigido da Edge Function

```typescript
// CONSTANTES CORRETAS
const UTMIFY_API_URL = 'https://api.utmify.com.br/api-credentials/orders';
const PLATFORM_NAME = 'RiseCheckout';

// HEADER CORRETO
const headers = {
  'x-api-token': token,
  'Content-Type': 'application/json',
};

// PAYLOAD CORRETO
const payload = {
  orderId: orderData.orderId,
  platform: PLATFORM_NAME,
  paymentMethod: mapPaymentMethod(orderData.paymentMethod),
  status: mapStatus(orderData.status),
  createdAt: formatDateUTC(orderData.createdAt),
  approvedDate: orderData.approvedDate ? formatDateUTC(orderData.approvedDate) : null,
  refundedAt: orderData.refundedAt ? formatDateUTC(orderData.refundedAt) : null,
  customer: {
    name: orderData.customer.name,
    email: orderData.customer.email,
    phone: orderData.customer.phone || null,
    document: orderData.customer.document || null,
    country: orderData.customer.country || 'BR',
    ip: orderData.customer.ip || null,
  },
  products: orderData.products.map(p => ({
    id: p.id,
    name: p.name,
    planId: p.planId || null,
    planName: p.planName || null,
    quantity: p.quantity || 1,
    priceInCents: p.priceInCents,
  })),
  trackingParameters: {
    src: orderData.trackingParameters?.src || null,
    sck: orderData.trackingParameters?.sck || null,
    utm_source: orderData.trackingParameters?.utm_source || null,
    utm_campaign: orderData.trackingParameters?.utm_campaign || null,
    utm_medium: orderData.trackingParameters?.utm_medium || null,
    utm_content: orderData.trackingParameters?.utm_content || null,
    utm_term: orderData.trackingParameters?.utm_term || null,
  },
  commission: {
    totalPriceInCents: orderData.commission?.totalPriceInCents || orderData.totalPriceInCents,
    gatewayFeeInCents: orderData.commission?.gatewayFeeInCents || 0,
    userCommissionInCents: orderData.commission?.userCommissionInCents || orderData.totalPriceInCents,
    currency: orderData.commission?.currency || 'BRL',
  },
  isTest: orderData.isTest || false,
};
```

---

## Resumo

A integração atual está **completamente quebrada** porque:
1. Envia para URL errada
2. Usa header de autenticação errado
3. Envia payload com estrutura incorreta
4. Não envia campos obrigatórios
5. Não consegue buscar UTM params (colunas não existem)

A correção requer reescrever a Edge Function do zero, seguindo a documentação oficial, e corrigir o fluxo de dados UTM entre `checkout_visits` → `orders` → Edge Function.

