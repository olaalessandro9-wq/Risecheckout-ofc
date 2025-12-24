# Integração Utmify v2 - Correções Finais Aplicadas

## ✅ Status: COMPLETO

**Commit:** `9ab4adc`  
**Data:** 2025-10-26  
**Versão:** v2.0

---

## 🎯 Principais Mudanças

### **1. Valores em REAIS (não cents)**

**ANTES (v1):**
```json
{
  "products": [
    {
      "priceInCents": 5400
    }
  ],
  "commission": {
    "totalPriceInCents": 5400,
    "userCommissionInCents": 0
  }
}
```

**DEPOIS (v2):**
```json
{
  "products": [
    {
      "price": 54.00
    }
  ],
  "valor": 54.00,
  "comissao": 0.00
}
```

**Motivo:** API da Utmify espera valores em reais (decimal), não em centavos.

---

### **2. Payload Simplificado**

**Campos Adicionados:**
- ✅ `valor` (number) - Total em reais
- ✅ `comissao` (number) - Comissão em reais (sempre 0)
- ✅ `src` (string | null) - Afiliado no root (além de trackingParameters)

**Campos Removidos:**
- ❌ `commission.totalPriceInCents`
- ❌ `commission.gatewayFeeInCents`
- ❌ `commission.userCommissionInCents`
- ❌ `commission.currency`
- ❌ `customer.country`
- ❌ `customer.ip`
- ❌ `products[].planId`
- ❌ `products[].planName`

**Resultado:** Payload mais limpo e direto ao ponto.

---

### **3. Idempotency-Key**

**Header Adicionado:**
```typescript
'Idempotency-Key': `${orderId}-${status}-${approvedDate ?? 'na'}`
```

**Exemplo:**
```
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000-paid-2025-10-26 15:35:00
```

**Benefício:** Evita duplicidade em caso de retry da nossa parte ou da Utmify.

---

### **4. Adapter Otimizado**

**ANTES (v1):** 196 linhas, complexo, muitos campos

**DEPOIS (v2):** 162 linhas, simples, foco no essencial

**Principais Funções:**
```typescript
// Converte cents → reais
function centsToReais(cents?: number | null): number {
  if (!cents) return 0;
  return Math.round(cents) / 100;
}

// Converte ISO → UTC 'YYYY-MM-DD HH:MM:SS'
function toUtcYMDHMS(dateIso?: string | null): string | null {
  // ...
}

// Mapeia status interno → Utmify
function mapStatus(s: string): string {
  // ...
}

// Converte pedido → payload Utmify
export function convertToUtmifyFormat(event: OrderEvent): UtmifyPayload | null {
  // Retorna null para abandono
  // Comissão sempre 0
  // Valores em reais
}
```

---

### **5. Edge Function Atualizada**

**Mudanças:**
- ✅ Monta `OrderEvent` completo com todos os campos
- ✅ Passa evento para `convertToUtmifyFormat()`
- ✅ Usa `sendOrderToUtmify()` com idempotency-key
- ✅ Retorna 204 se vendor não tem integração ativa

**Fluxo:**
1. Recebe `{ orderId }`
2. Busca pedido no banco
3. Busca integração do vendor
4. Verifica se está ativa e tem token
5. Monta evento
6. Converte para formato Utmify
7. Envia com idempotency-key
8. Retorna sucesso/erro

---

## 📊 Exemplo de Payload Final

### **Venda Direta (Sem Afiliado)**

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "platform": "checkout-builder",
  "paymentMethod": "pix",
  "status": "paid",
  "createdAt": "2025-10-26 15:30:00",
  "approvedDate": "2025-10-26 15:35:00",
  "refundedAt": null,
  "customer": {
    "email": "cliente@example.com",
    "name": "João Silva",
    "phone": "+5511999999999",
    "document": "12345678900"
  },
  "products": [
    {
      "id": "prod-123",
      "name": "Curso de Marketing",
      "quantity": 1,
      "price": 54.00
    }
  ],
  "trackingParameters": {
    "src": null,
    "utm_source": "google",
    "utm_campaign": "promo-verao"
  },
  "valor": 54.00,
  "comissao": 0.00,
  "isTest": false,
  "src": null
}
```

**Resultado:** Produtor recebe R$ 54,00 (100%), sem comissão.

---

### **Venda com Afiliado**

```json
{
  "orderId": "660e8400-e29b-41d4-a716-446655440001",
  "platform": "checkout-builder",
  "paymentMethod": "pix",
  "status": "paid",
  "createdAt": "2025-10-26 16:00:00",
  "approvedDate": "2025-10-26 16:05:00",
  "refundedAt": null,
  "customer": {
    "email": "maria@example.com",
    "name": "Maria Santos",
    "phone": "+5511988888888",
    "document": "98765432100"
  },
  "products": [
    {
      "id": "prod-456",
      "name": "Ebook de Vendas",
      "quantity": 1,
      "price": 56.60
    }
  ],
  "trackingParameters": {
    "src": "affiliate_123",
    "sck": "sub_456",
    "utm_source": "facebook",
    "utm_campaign": "black-friday"
  },
  "valor": 56.60,
  "comissao": 0.00,
  "isTest": false,
  "src": "affiliate_123"
}
```

**Resultado:** Produtor recebe R$ 56,60 (100%), comissão 0 até configurar taxa no produto.

---

## 🔄 Mapeamento de Status

| Status Interno | Status Utmify | Enviado? |
|----------------|---------------|----------|
| `pix_pending` | `waiting_payment` | ✅ Sim |
| `initiated` | `waiting_payment` | ✅ Sim |
| `authorized` | `waiting_payment` | ✅ Sim |
| `paid` | `paid` | ✅ Sim |
| `declined` | `refused` | ✅ Sim |
| `canceled` | `refused` | ✅ Sim |
| `refunded` | `refunded` | ✅ Sim |
| `chargeback` | `chargedback` | ✅ Sim |
| `abandoned` | - | ❌ Não |

---

## 🔐 Segurança

- ✅ Token por vendor (isolado, não global)
- ✅ Token criptografado no banco
- ✅ Idempotency-Key para evitar duplicidade
- ✅ HTTPS obrigatório
- ✅ Logs de todas as tentativas
- ✅ Não quebra webhook principal se Utmify falhar

---

## 📝 Regras de Negócio

### **Quando Enviar para Utmify?**
- ✅ Vendor tem integração ativa (`is_active = true`)
- ✅ Vendor tem API token configurado
- ✅ Status não é `abandoned`
- ✅ Independente de ter afiliado ou não

### **Comissão:**
- ✅ Sempre 0 por enquanto (produtor recebe 100%)
- ✅ Venda direta (sem `src`): comissão = 0
- ✅ Venda com afiliado (com `src`): comissão = 0 (TODO: configurável)
- 🔮 Futuro: buscar `affiliate_commission_rate` do produto

### **Datas:**
- ✅ Formato UTC: `YYYY-MM-DD HH:MM:SS`
- ✅ `createdAt` imutável por `orderId`
- ✅ `approvedDate` preenchido quando status = `paid`
- ✅ `refundedAt` preenchido quando status = `refunded`

---

## 🧪 Testes

### **Teste 1: Venda Direta**
```bash
# Input
{
  "amount_cents": 5400,
  "status": "paid",
  "tracking_params": { "utm_source": "google" }
}

# Output
{
  "valor": 54.00,
  "comissao": 0.00,
  "src": null
}
```

### **Teste 2: Venda com Afiliado**
```bash
# Input
{
  "amount_cents": 5660,
  "status": "paid",
  "tracking_params": { "src": "affiliate_123" }
}

# Output
{
  "valor": 56.60,
  "comissao": 0.00,
  "src": "affiliate_123"
}
```

### **Teste 3: Abandono**
```bash
# Input
{
  "status": "abandoned"
}

# Output
null (não envia para Utmify)
```

### **Teste 4: Idempotência**
```bash
# Enviar mesmo pedido 2x
# Utmify deve ignorar duplicata (via Idempotency-Key)
```

---

## 🚀 Deploy

### **1. Deploy da Edge Function:**
```bash
cd /home/ubuntu/lovabloo-checkout
supabase functions deploy forward-to-utmify
```

### **2. Configurar Token:**
1. Acesse `/integracoes` no painel
2. Obtenha token em [utmify.com.br/painel](https://utmify.com.br/painel)
3. Cole o token
4. Ative a integração
5. Clique em "Testar Envio"

### **3. Validar:**
- Verifique no painel Utmify se conversão apareceu
- Faça pedido real com tracking parameters
- Confirme que todas as vendas estão sendo registradas

---

## 📦 Commits

- **ff64ee3** - Integração inicial Utmify
- **ac8f613** - Documentação completa
- **d6b76ae** - Correções endpoint/header/comissão
- **3a40054** - Documentação das correções
- **9ab4adc** - ✅ **Correções finais v2 (valores em reais, payload simplificado)**

---

## 🔮 Roadmap Futuro

### **Fase 1: Comissão Configurável por Produto**
```sql
ALTER TABLE products 
ADD COLUMN affiliate_commission_rate DECIMAL(5,2) DEFAULT 0.00;
```

```typescript
// No adapter
const commissionRate = order.product?.affiliate_commission_rate || 0;
const hasAffiliate = !!order.tracking_params?.src;
const commission = hasAffiliate && commissionRate > 0
  ? total * commissionRate
  : 0;
```

### **Fase 2: Comissão por Afiliado**
```sql
CREATE TABLE affiliate_commission_rules (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  affiliate_id TEXT NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Fase 3: Comissão por Produto + Afiliado**
- Regras específicas: Produto X + Afiliado Y = Z%
- Hierarquia: Regra específica > Regra do afiliado > Regra do produto > Padrão 0%

---

## ✅ Checklist Final

- ✅ Endpoint correto: `https://api.utmify.com.br/api-credentials/orders`
- ✅ Header correto: `x-api-token`
- ✅ Valores em reais (não cents)
- ✅ Comissão sempre 0 (produtor recebe 100%)
- ✅ Idempotency-Key implementado
- ✅ Payload simplificado
- ✅ Adapter otimizado
- ✅ Edge Function atualizada
- ✅ Webhook sempre envia se vendor tem token
- ✅ Não envia abandono
- ✅ Formato de data UTC correto
- ✅ Mapeamento de status correto
- ✅ Documentação completa
- ✅ Código commitado e enviado

---

## 🎉 Conclusão

**Integração Utmify v2 100% implementada e pronta para deploy!**

Todas as correções do `PLANO_DETALHADO_UTMIFY_v2.md` foram aplicadas:
- ✅ Valores em reais
- ✅ Payload simplificado
- ✅ Idempotency-Key
- ✅ Comissão 0
- ✅ Sempre envia se vendor tem token
- ✅ Não envia abandono

**Próximo passo:** Deploy da Edge Function e teste com pedidos reais! 🚀

