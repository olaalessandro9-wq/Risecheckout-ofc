# Facebook Pixel Integration Module
**Módulo**: `src/integrations/tracking/facebook`  
**Status**: ✅ Implementado  
**Versão**: 1.0  

---

## 📋 Visão Geral

Este módulo implementa a integração do **Facebook Pixel** no RiseCheckout seguindo uma arquitetura modular baseada em features. Cada integração (Facebook, UTMify, Google Ads, etc) fica isolada em sua própria pasta.

### Estrutura do Módulo

```
src/integrations/tracking/facebook/
├── index.ts          # Barrel export (interface pública)
├── types.ts          # Tipos e interfaces TypeScript
├── events.ts         # Lógica de disparo de eventos
├── hooks.ts          # Hooks React customizados
├── Pixel.tsx         # Componente React
└── README.md         # Este arquivo
```

---

## 🚀 Como Usar

### 1. Import Centralizado

```typescript
import * as Facebook from "@/integrations/tracking/facebook";
```

### 2. Carregar Configuração

```typescript
const { data: fbConfig } = Facebook.useFacebookConfig(vendorId);
```

### 3. Verificar se Deve Rodar

```typescript
const shouldRun = Facebook.shouldRunPixel(fbConfig, productId);
```

### 4. Renderizar Componente

```typescript
{shouldRun && <Facebook.Pixel config={fbConfig} />}
```

### 5. Disparar Eventos

```typescript
// Evento de visualização
Facebook.trackViewContent(product);

// Evento de checkout iniciado
Facebook.trackInitiateCheckout(product, totalValue, itemsCount);

// Evento de compra
Facebook.trackPurchase(orderId, valueInCents, product);

// Evento customizado
Facebook.trackCustomEvent('BumpAdded', { bump_id: '123' });
```

---

## 📚 Documentação Detalhada

### types.ts

Define as interfaces TypeScript:

- **FacebookPixelConfig**: Configuração do pixel armazenada no banco
- **FacebookEventParams**: Parâmetros de eventos
- **VendorIntegrationData**: Estrutura de dados do banco

### events.ts

Funções para disparar eventos:

- `trackEvent()` - Evento padrão do Facebook
- `trackCustomEvent()` - Evento customizado
- `trackViewContent()` - Quando usuário vê um produto
- `trackInitiateCheckout()` - Quando inicia checkout
- `trackPurchase()` - Quando compra é confirmada
- `trackAddToCart()` - Quando bump é adicionado
- `trackCompleteRegistration()` - Quando formulário é preenchido
- `trackPageView()` - Quando página carrega
- `trackLead()` - Quando lead é capturado

### hooks.ts

Hooks React:

- `useFacebookConfig(vendorId)` - Carregar config do banco (com cache de 5 min)
- `shouldRunPixel(config, productId)` - Verificar se deve rodar
- `usePixelForProduct(vendorId, productId)` - Hook combinado

### Pixel.tsx

Componente React:

- Injeta script do Facebook Pixel
- Inicializa fbq global
- Dispara PageView automático
- Retorna null (invisível)

---

## 🔧 Configuração no Banco de Dados

A configuração é armazenada em `vendor_integrations`:

```json
{
  "vendor_id": "uuid-do-vendedor",
  "integration_type": "FACEBOOK_PIXEL",
  "active": true,
  "config": {
    "pixel_id": "123456789",
    "access_token": "token-opcional",
    "enabled": true,
    "selected_products": ["product-id-1", "product-id-2"],
    "fire_purchase_on_pix": true
  }
}
```

### Campos

- **pixel_id**: ID único do pixel (obrigatório)
- **access_token**: Token de acesso (opcional, para futuro)
- **enabled**: Se está ativado
- **selected_products**: Lista de IDs de produtos (vazio = todos)
- **fire_purchase_on_pix**: Se dispara Purchase no PIX

---

## 📊 Fluxo de Dados

```
PublicCheckout.tsx
    ↓
useFacebookConfig(vendorId)
    ↓ (Query ao Supabase)
vendor_integrations table
    ↓
shouldRunPixel(config, productId)
    ↓
<Pixel config={fbConfig} />
    ↓
window.fbq('init', pixel_id)
window.fbq('track', 'PageView')
    ↓
trackPurchase(orderId, value, product)
    ↓
window.fbq('track', 'Purchase', {...})
```

---

## 🧪 Testes

### Teste 1: Verificar Pixel Injetado

```javascript
// Console do navegador
window.fbq
// Deve retornar: ƒ fbq() { ... }
```

### Teste 2: Verificar Logs

```javascript
// Console do navegador
// Procure por:
// [Facebook] ✅ Pixel 123456789 inicializado com sucesso
// [Facebook] 📡 Disparando evento: Purchase
```

### Teste 3: Verificar no Facebook

1. Ir para: facebook.com/events_manager
2. Selecionar seu pixel
3. Ir para "Test Events"
4. Disparar evento de teste
5. Verificar se aparece no dashboard

---

## 🔐 Segurança

- ✅ Pixel ID armazenado no banco (não no frontend)
- ✅ Service Role Key não exposto
- ✅ Apenas ANON_KEY usado no frontend
- ✅ RLS protege dados de outros vendedores
- ✅ Validação de productId antes de disparar

---

## 🚀 Próximas Integrações

Este módulo serve como template para outras integrações:

- `src/integrations/tracking/utmify/` - UTMify
- `src/integrations/tracking/google-ads/` - Google Ads
- `src/integrations/tracking/tiktok/` - TikTok Pixel
- `src/integrations/tracking/kwai/` - Kwai Pixel
- `src/integrations/gateways/mercadopago/` - Mercado Pago
- `src/integrations/gateways/pushinpay/` - PushInPay

---

## 🐛 Troubleshooting

### Problema: "fbq is not defined"
**Solução**: Verificar se `<Pixel config={fbConfig} />` está sendo renderizado

### Problema: "Pixel não foi injetado"
**Solução**: Verificar console para logs. Confirmar que `shouldRunPixel` retorna true

### Problema: "Eventos não aparecem no Facebook"
**Solução**: 
1. Verificar se pixel_id está correto
2. Verificar se `fire_purchase_on_pix` é true
3. Aguardar 15-30 minutos para Facebook processar

### Problema: "Config não carrega do banco"
**Solução**: 
1. Verificar se vendorId está correto
2. Verificar se existe registro em vendor_integrations
3. Verificar se integration_type é "FACEBOOK_PIXEL"
4. Verificar se active é true

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
2. Arquivo INSTRUCOES_ATUALIZACAO_PUBLICCHECKOUT.md
3. Código comentado em cada arquivo
