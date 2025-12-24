# TikTok Pixel Integration Module
**Módulo**: `src/integrations/tracking/tiktok`  
**Status**: ✅ Implementado  
**Versão**: 1.0  

---

## 📋 Visão Geral

Este módulo implementa a integração do **TikTok Pixel** no RiseCheckout seguindo uma arquitetura modular baseada em features. Cada integração (Facebook, UTMify, Google Ads, TikTok, etc) fica isolada em sua própria pasta.

### Estrutura do Módulo

```
src/integrations/tracking/tiktok/
├── index.ts          # Barrel export (interface pública)
├── types.ts          # Tipos e interfaces TypeScript
├── events.ts         # Lógica de envio de eventos
├── hooks.ts          # Hooks React customizados
├── Pixel.tsx         # Componente React
└── README.md         # Este arquivo
```

---

## 🚀 Como Usar

### 1. Import Centralizado

```typescript
import * as TikTok from "@/integrations/tracking/tiktok";
```

### 2. Carregar Configuração

```typescript
const { data: tiktokIntegration } = TikTok.useTikTokConfig(vendorId);
```

### 3. Verificar se Deve Rodar

```typescript
const shouldRun = TikTok.shouldRunTikTok(tiktokIntegration, productId);
```

### 4. Renderizar Componente

```typescript
{shouldRun && <TikTok.Pixel config={tiktokIntegration} />}
```

### 5. Enviar Conversão de Compra

```typescript
const items: TikTok.TikTokItem[] = [
  {
    id: checkout.product.id,
    name: checkout.product.name,
    quantity: 1,
    price: checkout.product.price,
  },
];

const customer: TikTok.TikTokCustomer = {
  email: logic.formData.email,
  phone: logic.formData.phone,
};

await TikTok.trackPurchase(
  tiktokIntegration.config,
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

- **TikTokConfig**: Configuração do TikTok Pixel (Pixel ID)
- **TikTokCustomer**: Dados do cliente
- **TikTokItem**: Dados de um produto
- **TikTokConversionData**: Dados completos da conversão
- **TikTokResponse**: Resposta da API
- **TikTokIntegration**: Integração do vendedor
- **TikTokGlobalParams**: Parâmetros globais do ttq

### events.ts

Funções para enviar eventos:

- `isValidTikTokConfig()` - Valida configuração
- `sendTikTokEvent()` - Envia evento genérico
- `trackPurchase()` - Rastreia compra ⭐
- `trackViewContent()` - Rastreia visualização de conteúdo
- `trackAddToCart()` - Rastreia adição ao carrinho
- `trackPageView()` - Rastreia visualização de página
- `trackLead()` - Rastreia lead
- `trackInitiateCheckout()` - Rastreia checkout iniciado
- `trackRefund()` - Rastreia reembolso

### hooks.ts

Hooks React:

- `useTikTokConfig(vendorId)` - Carregar config do banco (com cache de 5 min)
- `shouldRunTikTok(integration, productId)` - Verificar se deve rodar
- `useTikTokForProduct(vendorId, productId)` - Hook combinado

### Pixel.tsx

Componente React:

- Injeta script do TikTok Pixel (ttq)
- Inicializa rastreamento
- Retorna null (invisível)

---

## 🔧 Configuração no Banco de Dados

A configuração é armazenada em `vendor_integrations`:

```json
{
  "vendor_id": "uuid-do-vendedor",
  "integration_type": "TIKTOK_PIXEL",
  "active": true,
  "config": {
    "pixel_id": "1234567890123456",
    "selected_products": ["product-id-1", "product-id-2"]
  }
}
```

### Campos

- **pixel_id**: ID do Pixel do TikTok (obrigatório)
- **selected_products**: Lista de IDs de produtos (vazio = todos)

---

## 📊 Fluxo de Dados

```
PublicCheckout.tsx
    ↓
useTikTokConfig(vendorId)
    ↓ (Query ao Supabase)
vendor_integrations table
    ↓
shouldRunTikTok(integration, productId)
    ↓
<Pixel config={tiktokIntegration} />
    ↓
trackPurchase(config, orderId, value, items, customer)
    ↓
window.ttq.track("Purchase", {...})
    ↓
TikTok Pixel
```

---

## 🧪 Testes

### Teste 1: Verificar Configuração

```javascript
// Console do navegador
console.log(window.ttq);
// Deve retornar: { track: ƒ track() { ... } }
```

### Teste 2: Verificar Logs

```javascript
// Console do navegador
// Procure por:
// [TikTok] Pixel 1234567890123456 inicializado com sucesso
// [TikTok] ✅ Evento Purchase enviado com sucesso
```

### Teste 3: Verificar no TikTok Ads Manager

1. Ir para: ads.tiktok.com
2. Selecionar sua conta
3. Ir para "Events"
4. Verificar se aparecem os eventos

---

## 🔐 Segurança

- ✅ Pixel ID armazenado no banco (não no frontend)
- ✅ Service Role Key não exposto
- ✅ RLS protege dados de outros vendedores
- ✅ Validação de entrada
- ✅ Tratamento de erro

---

## 🚀 Próximas Integrações

Este módulo serve como template para outras integrações:

- `src/integrations/tracking/kwai/` - Kwai Pixel
- `src/integrations/gateways/mercadopago/` - Mercado Pago
- `src/integrations/gateways/pushinpay/` - PushInPay

---

## 🐛 Troubleshooting

### Problema: "Integração não encontrada"
**Solução**: Verificar se existe registro em vendor_integrations com integration_type="TIKTOK_PIXEL"

### Problema: "Conversão não foi enviada"
**Solução**: 
1. Verificar se pixel_id está correto
2. Verificar console para logs de erro
3. Verificar se há bloqueador de scripts

### Problema: "ttq não está disponível"
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
- ✅ 8 funções de eventos
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
