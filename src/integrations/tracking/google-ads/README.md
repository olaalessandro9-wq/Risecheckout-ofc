# Google Ads Integration Module
**Módulo**: `src/integrations/tracking/google-ads`  
**Status**: ✅ Implementado  
**Versão**: 1.0  

---

## 📋 Visão Geral

Este módulo implementa a integração do **Google Ads** no RiseCheckout seguindo uma arquitetura modular baseada em features. Cada integração (Facebook, UTMify, Google Ads, etc) fica isolada em sua própria pasta.

### Estrutura do Módulo

```
src/integrations/tracking/google-ads/
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
import * as GoogleAds from "@/integrations/tracking/google-ads";
```

### 2. Carregar Configuração

```typescript
const { data: googleAdsIntegration } = GoogleAds.useGoogleAdsConfig(vendorId);
```

### 3. Verificar se Deve Rodar

```typescript
const shouldRun = GoogleAds.shouldRunGoogleAds(googleAdsIntegration, productId);
```

### 4. Renderizar Componente

```typescript
{shouldRun && <GoogleAds.Tracker integration={googleAdsIntegration} />}
```

### 5. Enviar Conversão de Compra

```typescript
const items: GoogleAds.GoogleAdsItem[] = [
  {
    id: checkout.product.id,
    name: checkout.product.name,
    quantity: 1,
    price: checkout.product.price,
  },
];

const customer: GoogleAds.GoogleAdsCustomer = {
  email: logic.formData.email,
  phone: logic.formData.phone,
};

await GoogleAds.trackPurchase(
  googleAdsIntegration.config,
  orderId,
  totalValue,
  items,
  customer
);
```

---

## 📚 Documentação Detalhada

### types.ts

Define as interfaces TypeScript:

- **GoogleAdsEventLabel**: Label de conversão para um evento
- **GoogleAdsConfig**: Configuração do Google Ads (Conversion ID + Labels)
- **GoogleAdsCustomer**: Dados do cliente
- **GoogleAdsItem**: Dados de um produto
- **GoogleAdsConversionData**: Dados completos da conversão
- **GoogleAdsResponse**: Resposta da API
- **GoogleAdsIntegration**: Integração do vendedor
- **GoogleAdsGlobalParams**: Parâmetros globais do gtag

### events.ts

Funções para enviar eventos:

- `getConversionLabel()` - Obtém label para um evento
- `isValidGoogleAdsConfig()` - Valida configuração
- `sendGoogleAdsConversion()` - Envia conversão genérica
- `trackPurchase()` - Rastreia compra ⭐
- `trackLead()` - Rastreia lead
- `trackPageView()` - Rastreia visualização de página
- `trackAddToCart()` - Rastreia adição ao carrinho
- `trackViewItem()` - Rastreia visualização de produto

### hooks.ts

Hooks React:

- `useGoogleAdsConfig(vendorId)` - Carregar config do banco (com cache de 5 min)
- `shouldRunGoogleAds(integration, productId)` - Verificar se deve rodar
- `useGoogleAdsForProduct(vendorId, productId)` - Hook combinado
- `isEventEnabledForGoogleAds(integration, eventType)` - Verificar se evento está habilitado
- `useConversionLabel(integration, eventType)` - Obter label de conversão

### Tracker.tsx

Componente React:

- Injeta script do Google Ads (gtag)
- Inicializa rastreamento
- Retorna null (invisível)

---

## 🔧 Configuração no Banco de Dados

A configuração é armazenada em `vendor_integrations`:

```json
{
  "vendor_id": "uuid-do-vendedor",
  "integration_type": "GOOGLE_ADS",
  "active": true,
  "config": {
    "conversion_id": "AW-123456789",
    "conversion_label": "Kj2nCNOytGMQ_4...",
    "event_labels": [
      {
        "eventType": "purchase",
        "label": "Kj2nCNOytGMQ_4...",
        "enabled": true
      },
      {
        "eventType": "lead",
        "label": "Kj2nCNOytGMQ_5...",
        "enabled": true
      }
    ],
    "selected_products": ["product-id-1", "product-id-2"]
  }
}
```

### Campos

- **conversion_id**: ID de conversão do Google Ads (obrigatório)
- **conversion_label**: Label global de conversão (fallback)
- **event_labels**: Labels específicos por evento
- **selected_products**: Lista de IDs de produtos (vazio = todos)

---

## 📊 Fluxo de Dados

```
PublicCheckout.tsx
    ↓
useGoogleAdsConfig(vendorId)
    ↓ (Query ao Supabase)
vendor_integrations table
    ↓
shouldRunGoogleAds(integration, productId)
    ↓
<Tracker integration={googleAdsIntegration} />
    ↓
trackPurchase(config, orderId, value, items, customer)
    ↓
window.gtag("event", "conversion", {...})
    ↓
Google Ads
```

---

## 🧪 Testes

### Teste 1: Verificar Configuração

```javascript
// Console do navegador
console.log(window.gtag);
// Deve retornar: ƒ gtag() { ... }
```

### Teste 2: Verificar Logs

```javascript
// Console do navegador
// Procure por:
// [Google Ads] Tracker AW-123456789 inicializado com sucesso
// [Google Ads] ✅ Conversão enviada com sucesso
```

### Teste 3: Verificar no Google Ads

1. Ir para: ads.google.com
2. Selecionar sua conta
3. Ir para "Conversões"
4. Verificar se aparecem os eventos

### Teste 4: Verificar no Google Tag Manager (GTM)

1. Ir para: tagmanager.google.com
2. Selecionar seu container
3. Ir para "Resumo"
4. Procurar por eventos de conversão

---

## 🔐 Segurança

- ✅ Conversion ID armazenado no banco (não no frontend)
- ✅ Service Role Key não exposto
- ✅ RLS protege dados de outros vendedores
- ✅ Validação de entrada
- ✅ Tratamento de erro

---

## 🚀 Próximas Integrações

Este módulo serve como template para outras integrações:

- `src/integrations/tracking/tiktok/` - TikTok Pixel
- `src/integrations/tracking/kwai/` - Kwai Pixel
- `src/integrations/gateways/mercadopago/` - Mercado Pago
- `src/integrations/gateways/pushinpay/` - PushInPay

---

## 🐛 Troubleshooting

### Problema: "Integração não encontrada"
**Solução**: Verificar se existe registro em vendor_integrations com integration_type="GOOGLE_ADS"

### Problema: "Conversão não foi enviada"
**Solução**: 
1. Verificar se conversion_id está correto
2. Verificar se conversion_label está configurado
3. Verificar console para logs de erro

### Problema: "gtag não está disponível"
**Solução**: 
1. Verificar se script foi carregado
2. Verificar console para erros de rede
3. Verificar se há bloqueador de scripts

### Problema: "Produto não está habilitado"
**Solução**: 
1. Verificar se productId está em selected_products
2. Se selected_products vazio, todos os produtos devem estar habilitados

---

## 📝 Changelog

### v1.0 (29/11/2025)
- ✅ Implementação inicial
- ✅ 6 arquivos criados
- ✅ Suporte a Conversion ID + Labels
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
