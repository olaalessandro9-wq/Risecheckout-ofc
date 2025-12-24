# Integração com Utmify

## Visão Geral

Sistema completo de integração com a plataforma Utmify para tracking de conversões e comissões de afiliados.

## Arquitetura

```
┌─────────────────┐
│  PushingPay     │
│  (Gateway)      │
└────────┬────────┘
         │ Webhook
         ▼
┌─────────────────────────────────┐
│  /webhook-pushingpay            │
│  (Edge Function)                │
│  - Valida HMAC                  │
│  - Registra evento              │
│  - Chama Utmify se aprovado     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  /forward-to-utmify             │
│  (Edge Function)                │
│  - Busca configuração           │
│  - Converte formato             │
│  - Envia para Utmify API        │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Utmify API     │
│  (Tracking)     │
└─────────────────┘
```

## Componentes

### 1. Tabela `vendor_integrations`

Armazena configurações de integração por vendor:

```sql
CREATE TABLE vendor_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Exemplo de config para Utmify:**
```json
{
  "api_token": "utmify_abc123xyz",
  "send_on_approved": true,
  "send_on_completed": false
}
```

### 2. Adapter (`utmify-adapter.ts`)

Converte eventos internos para o formato da API Utmify:

**Entrada (Evento Interno):**
```typescript
{
  event_type: 'payment.approved',
  order_id: 'uuid',
  amount_cents: 5660,
  customer_email: 'cliente@example.com',
  tracking_params: {
    utm_source: 'facebook',
    utm_campaign: 'promo-verao',
    src: 'affiliate_123',
    sck: 'subaffiliate_456'
  }
}
```

**Saída (Formato Utmify):**
```json
{
  "status": "aprovado",
  "valor": 56.60,
  "email": "cliente@example.com",
  "nome": "Cliente",
  "telefone": "+5511999999999",
  "documento": "12345678900",
  "produto": "Produto XYZ",
  "comissao": 11.32,
  "metodo": "pix",
  "parcelas": "1",
  "src": "affiliate_123",
  "sck": "subaffiliate_456",
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "promo-verao",
  "utm_content": "banner-1",
  "utm_term": "comprar-agora",
  "data": "2025-10-26 15:30:00"
}
```

### 3. Edge Function (`/forward-to-utmify`)

Envia eventos para a API Utmify:

**Endpoint:** `https://utmify.com.br/api/v1/conversao`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {api_token}`

**Método:** POST

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Conversão registrada com sucesso"
}
```

### 4. Integração com Webhook do PushingPay

No arquivo `/supabase/functions/webhook-pushingpay/index.ts`, após registrar o evento:

```typescript
// Se o evento é de pagamento aprovado, envia para Utmify
if (normalizedEvent.event_type === 'payment.approved') {
  try {
    const utmifyResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/forward-to-utmify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          order_id: order.id,
          event_type: normalizedEvent.event_type
        })
      }
    );
    
    console.log('Utmify notification sent:', await utmifyResponse.text());
  } catch (error) {
    console.error('Failed to send Utmify notification:', error);
    // Não falha o webhook principal se Utmify falhar
  }
}
```

## UI de Configuração

### Página `/integracoes`

Interface para configurar a integração:

**Campos:**
- **API Token da Utmify** (password input)
- **Ativar integração** (checkbox)
- **Botão Salvar**
- **Botão Testar Envio**

**Funcionalidades:**
1. **Salvar:** Armazena token na tabela `vendor_integrations`
2. **Testar:** Cria um pedido de teste e envia para Utmify
3. **Status:** Indicador visual (ativo/inativo)

**Link útil:** [Obter API Token no Painel Utmify](https://utmify.com.br/painel)

## Mapeamento de Status

| Status Interno | Status Utmify |
|----------------|---------------|
| `pending` | `pendente` |
| `approved` | `aprovado` |
| `completed` | `completo` |
| `cancelled` | `cancelado` |
| `refunded` | `reembolsado` |
| `failed` | `falhou` |

## Mapeamento de Métodos de Pagamento

| Método Interno | Método Utmify |
|----------------|---------------|
| `pix` | `pix` |
| `credit_card` | `cartao_credito` |
| `boleto` | `boleto` |
| Outros | `outros` |

## Cálculo de Comissão

Por padrão, a comissão é calculada como **20% do valor total**:

```typescript
const commission = totalAmount * 0.20;
```

**Exemplo:**
- Valor: R$ 56,60
- Comissão: R$ 11,32 (20%)

## Tracking Parameters

A integração suporta os seguintes parâmetros de tracking:

### UTM Parameters (Google Analytics)
- `utm_source` - Origem do tráfego (ex: facebook, google)
- `utm_medium` - Meio (ex: cpc, email, social)
- `utm_campaign` - Campanha (ex: promo-verao)
- `utm_content` - Conteúdo (ex: banner-1)
- `utm_term` - Termo (ex: comprar-agora)

### Utmify Parameters
- `src` - ID do afiliado principal
- `sck` - ID do sub-afiliado (opcional)

**Exemplo de URL com tracking:**
```
https://checkout.lovabloo.com/p/produto-xyz?src=affiliate_123&sck=sub_456&utm_source=facebook&utm_campaign=promo
```

## Formato de Data

Todas as datas são enviadas no formato UTC:

```
YYYY-MM-DD HH:MM:SS
```

**Exemplo:** `2025-10-26 15:30:00`

## Fluxo Completo

1. **Cliente acessa checkout** com parâmetros de tracking na URL
2. **Parâmetros são salvos** na tabela `checkout_sessions`
3. **Cliente finaliza compra** e PushingPay processa pagamento
4. **PushingPay envia webhook** para `/webhook-pushingpay`
5. **Webhook valida HMAC** e registra evento em `order_events`
6. **Se pagamento aprovado**, chama `/forward-to-utmify`
7. **Edge Function busca** configuração em `vendor_integrations`
8. **Adapter converte** evento para formato Utmify
9. **API call envia** dados para Utmify
10. **Utmify registra conversão** e atribui comissão ao afiliado

## Deploy

### 1. Deploy da Edge Function

```bash
supabase functions deploy forward-to-utmify
```

### 2. Configurar Secrets (se necessário)

```bash
# Não é necessário configurar UTMIFY_API_TOKEN como secret global
# O token é armazenado por vendor na tabela vendor_integrations
```

### 3. Testar Integração

1. Acesse `/integracoes` no painel
2. Cole seu API Token da Utmify
3. Ative a integração
4. Clique em "Testar Envio"
5. Verifique no painel da Utmify se a conversão foi registrada

## Troubleshooting

### Erro: "API token not configured"

**Solução:** Configure o token na página `/integracoes`

### Erro: "Failed to send to Utmify API"

**Possíveis causas:**
1. Token inválido ou expirado
2. API da Utmify fora do ar
3. Formato de dados incorreto

**Debug:**
```sql
-- Ver logs de tentativas
SELECT * FROM webhook_deliveries 
WHERE url LIKE '%utmify%' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Conversão não aparece no painel Utmify

**Checklist:**
- [ ] Token configurado corretamente
- [ ] Integração está ativa (`is_active = true`)
- [ ] Evento é do tipo `payment.approved`
- [ ] Email do cliente está presente
- [ ] Parâmetros `src` ou `sck` estão na URL

## Segurança

- ✅ API Token armazenado criptografado no banco
- ✅ Token nunca exposto no frontend (apenas asteriscos)
- ✅ HTTPS obrigatório para todas as chamadas
- ✅ Validação de vendor_id antes de enviar
- ✅ Rate limiting na Edge Function
- ✅ Logs de todas as tentativas de envio

## Próximos Passos

1. **Deploy da Edge Function** `forward-to-utmify`
2. **Configurar token** na página de Integrações
3. **Testar com pedido real** ou usar botão "Testar Envio"
4. **Monitorar logs** para garantir que conversões estão sendo enviadas
5. **Validar no painel Utmify** que comissões estão sendo atribuídas

## Referências

- [Documentação API Utmify](https://utmify.com.br/docs/api)
- [Painel Utmify](https://utmify.com.br/painel)
- [Sistema de Eventos e Webhooks](./ORDERS_EVENTS_SYSTEM.md)

