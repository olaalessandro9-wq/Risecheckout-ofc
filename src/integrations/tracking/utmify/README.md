# UTMify Integration Module
**Módulo**: `src/integrations/tracking/utmify`  
**Status**: ✅ Implementado  
**Versão**: 1.0  

---

## 📋 Visão Geral

Este módulo implementa a integração do **UTMify** no RiseCheckout seguindo uma arquitetura modular baseada em features. Cada integração (Facebook, UTMify, Google Ads, etc) fica isolada em sua própria pasta.

### Estrutura do Módulo

```
src/integrations/tracking/utmify/
├── index.ts          # Barrel export (interface pública)
├── types.ts          # Tipos e interfaces TypeScript
├── events.ts         # Lógica de envio de eventos
├── hooks.ts          # Hooks React customizados
├── Tracker.tsx       # Componente React
└── README.md         # Este arquivo
```

---

## 🚀 Como Usar

### 1. Import Centralizado

```typescript
import * as UTMify from "@/integrations/tracking/utmify";
```

### 2. Carregar Configuração

```typescript
const { data: utmifyIntegration } = UTMify.useUTMifyConfig(vendorId);
```

### 3. Verificar se Deve Rodar

```typescript
const shouldRun = UTMify.shouldRunUTMify(utmifyIntegration, productId);
```

### 4. Renderizar Componente

```typescript
{shouldRun && <UTMify.Tracker integration={utmifyIntegration} />}
```

### 5. Enviar Conversão

```typescript
const utmParams = UTMify.extractUTMParameters();

const orderData: UTMify.UTMifyOrderData = {
  orderId: orderResponse.order_id,
  status: "approved",
  createdAt: UTMify.formatDateForUTMify(new Date()),
  customer: {
    name: logic.formData.name,
    email: logic.formData.email,
    phone: logic.formData.phone,
  },
  products: [
    {
      id: checkout.product.id,
      name: checkout.product.name,
      priceInCents: UTMify.convertToCents(checkout.product.price),
    },
  ],
  trackingParameters: utmParams,
  totalPriceInCents: totalCents,
};

await UTMify.trackPurchase(vendorId, orderData);
```

---

## 📚 Documentação Detalhada

### types.ts

Define as interfaces TypeScript:

- **UTMifyConfig**: Configuração do UTMify armazenada no banco
- **UTMParameters**: Parâmetros UTM extraídos da URL
- **UTMifyCustomer**: Dados do cliente
- **UTMifyProduct**: Dados de um produto
- **UTMifyCommission**: Dados de comissão
- **UTMifyOrderData**: Dados completos do pedido
- **UTMifyResponse**: Resposta da API
- **UTMifyIntegration**: Integração do vendedor

### events.ts

Funções para enviar eventos:

- `extractUTMParameters()` - Extrai parâmetros UTM da URL
- `formatDateForUTMify()` - Formata data para UTC
- `convertToCents()` - Converte reais para centavos
- `convertToReais()` - Converte centavos para reais
- `sendUTMifyConversion()` - Envia conversão genérica
- `trackPageView()` - Rastreia visualização de página
- `trackAddToCart()` - Rastreia adição ao carrinho
- `trackPurchase()` - Rastreia compra ⭐
- `trackRefund()` - Rastreia reembolso

### hooks.ts

Hooks React:

- `useUTMifyConfig(vendorId)` - Carregar config do banco (com cache de 5 min)
- `shouldRunUTMify(integration, productId)` - Verificar se deve rodar
- `useUTMifyForProduct(vendorId, productId)` - Hook combinado
- `isEventEnabledForUTMify(integration, eventType)` - Verificar se evento está habilitado

### Tracker.tsx

Componente React:

- Inicializa rastreamento do UTMify
- Retorna null (invisível)

---

## 🔧 Configuração no Banco de Dados

A configuração é armazenada em `vendor_integrations`:

```json
{
  "vendor_id": "uuid-do-vendedor",
  "integration_type": "UTMIFY",
  "active": true,
  "config": {
    "api_token": "token-do-utmify",
    "selected_products": ["product-id-1", "product-id-2"],
    "selected_events": ["purchase", "pageview"]
  }
}
```

### Campos

- **api_token**: Token de API do UTMify
- **selected_products**: Lista de IDs de produtos (vazio = todos)
- **selected_events**: Lista de eventos habilitados (vazio = todos)

---

## 📊 Fluxo de Dados

```
PublicCheckout.tsx
    ↓
useUTMifyConfig(vendorId)
    ↓ (Query ao Supabase)
vendor_integrations table
    ↓
shouldRunUTMify(integration, productId)
    ↓
<Tracker integration={utmifyIntegration} />
    ↓
trackPurchase(vendorId, orderData)
    ↓
Edge Function: utmify-conversion
    ↓
UTMify API
```

---

## 🧪 Testes

### Teste 1: Verificar Configuração

```javascript
// Console do navegador
const utmParams = extractUTMParameters();
console.log(utmParams);
// Deve retornar: { src: null, utm_source: "google", ... }
```

### Teste 2: Verificar Logs

```javascript
// Console do navegador
// Procure por:
// [UTMify] Configuração carregada com sucesso
// [UTMify] 📡 Enviando conversão
// [UTMify] ✅ Conversão enviada com sucesso
```

### Teste 3: Verificar no UTMify

1. Ir para: app.utmify.com.br
2. Selecionar seu projeto
3. Ir para "Conversões"
4. Verificar se aparecem os eventos

---

## 🔐 Segurança

- ✅ API Token armazenado no banco (não no frontend)
- ✅ Service Role Key não exposto
- ✅ RLS protege dados de outros vendedores
- ✅ Validação de entrada
- ✅ Tratamento de erro

---

## 🚀 Próximas Integrações

Este módulo serve como template para outras integrações:

- `src/integrations/tracking/google-ads/` - Google Ads
- `src/integrations/tracking/tiktok/` - TikTok Pixel
- `src/integrations/tracking/kwai/` - Kwai Pixel
- `src/integrations/gateways/mercadopago/` - Mercado Pago
- `src/integrations/gateways/pushinpay/` - PushInPay

---

## 🐛 Troubleshooting

### Problema: "Integração não encontrada"
**Solução**: Verificar se existe registro em vendor_integrations com integration_type="UTMIFY"

### Problema: "Conversão não foi enviada"
**Solução**: 
1. Verificar se api_token está correto
2. Verificar se Edge Function está deployada
3. Verificar logs da Edge Function

### Problema: "Parâmetros UTM não aparecem"
**Solução**: 
1. Verificar se URL tem parâmetros UTM
2. Verificar console para logs de extração

### Problema: "Produto não está habilitado"
**Solução**: 
1. Verificar se productId está em selected_products
2. Se selected_products vazio, todos os produtos devem estar habilitados

---

## 📝 Changelog

### v1.0 (29/11/2025)
- ✅ Implementação inicial
- ✅ 5 arquivos criados
- ✅ Documentação completa
- ✅ Testes recomendados

---

## 👨‍💻 Autor

Implementado como parte da Refração Modular do RiseCheckout.

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
1. Este README
2. Arquivo types.ts para interfaces
3. Código comentado em cada arquivo
