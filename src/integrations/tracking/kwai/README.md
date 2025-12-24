# Kwai Pixel Integration Module
**Módulo**: `src/integrations/tracking/kwai`  
**Status**: ✅ Implementado  
**Versão**: 1.0  

---

## 📋 Visão Geral

Este módulo implementa a integração do **Kwai Pixel** no RiseCheckout seguindo uma arquitetura modular baseada em features. Cada integração (Facebook, UTMify, Google Ads, TikTok, Kwai, etc) fica isolada em sua própria pasta.

### Estrutura do Módulo

```
src/integrations/tracking/kwai/
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
import * as Kwai from "@/integrations/tracking/kwai";
```

### 2. Carregar Configuração

```typescript
const { data: kwaiIntegration } = Kwai.useKwaiConfig(vendorId);
```

### 3. Verificar se Deve Rodar

```typescript
const shouldRun = Kwai.shouldRunKwai(kwaiIntegration, productId);
```

### 4. Renderizar Componente

```typescript
{shouldRun && <Kwai.Pixel config={kwaiIntegration} />}
```

### 5. Enviar Conversão de Compra

```typescript
const items: Kwai.KwaiItem[] = [
  {
    id: checkout.product.id,
    name: checkout.product.name,
    quantity: 1,
    price: checkout.product.price,
  },
];

const customer: Kwai.KwaiCustomer = {
  email: logic.formData.email,
  phone: logic.formData.phone,
};

await Kwai.trackPurchase(
  kwaiIntegration.config,
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

- **KwaiConfig**: Configuração do Kwai Pixel (Pixel ID)
- **KwaiCustomer**: Dados do cliente
- **KwaiItem**: Dados de um produto
- **KwaiConversionData**: Dados completos da conversão
- **KwaiResponse**: Resposta da API
- **KwaiIntegration**: Integração do vendedor
- **KwaiGlobalParams**: Parâmetros globais do kwaiq

### events.ts

Funções para enviar eventos:

- `isValidKwaiConfig()` - Valida configuração
- `sendKwaiEvent()` - Envia evento genérico
- `trackPurchase()` - Rastreia compra (usa "PlaceOrder") ⭐
- `trackViewContent()` - Rastreia visualização de conteúdo
- `trackAddToCart()` - Rastreia adição ao carrinho
- `trackPageView()` - Rastreia visualização de página
- `trackLead()` - Rastreia lead
- `trackInitiateCheckout()` - Rastreia checkout iniciado
- `trackRefund()` - Rastreia reembolso

### hooks.ts

Hooks React:

- `useKwaiConfig(vendorId)` - Carregar config do banco (com cache de 5 min)
- `shouldRunKwai(integration, productId)` - Verificar se deve rodar
- `useKwaiForProduct(vendorId, productId)` - Hook combinado

### Pixel.tsx

Componente React:

- Injeta script do Kwai Pixel (kwaiq)
- Inicializa rastreamento
- Retorna null (invisível)

---

## 🔧 Configuração no Banco de Dados

A configuração é armazenada em `vendor_integrations`:

```json
{
  "vendor_id": "uuid-do-vendedor",
  "integration_type": "KWAI_PIXEL",
  "active": true,
  "config": {
    "pixel_id": "1234567890",
    "selected_products": ["product-id-1", "product-id-2"]
  }
}
```

### Campos

- **pixel_id**: ID do Pixel do Kwai (obrigatório)
- **selected_products**: Lista de IDs de produtos (vazio = todos)

---

## 💡 Detalhe Técnico: "PlaceOrder" vs "Purchase"

**Importante**: Kwai usa "PlaceOrder" em vez de "Purchase" para conversões de compra.

```typescript
// Facebook e TikTok usam "Purchase"
Facebook.trackPurchase(...);
TikTok.trackPurchase(...);

// Kwai usa "PlaceOrder" internamente
Kwai.trackPurchase(...); // Envia como "PlaceOrder"
```

A função `trackPurchase()` do Kwai automaticamente envia como "PlaceOrder" para compatibilidade com o padrão do Kwai.

---

## 📊 Fluxo de Dados

```
PublicCheckout.tsx
    ↓
useKwaiConfig(vendorId)
    ↓ (Query ao Supabase)
vendor_integrations table
    ↓
shouldRunKwai(integration, productId)
    ↓
<Pixel config={kwaiIntegration} />
    ↓
trackPurchase(config, orderId, value, items, customer)
    ↓
window.kwaiq("PlaceOrder", {...})
    ↓
Kwai Pixel
```

---

## 🧪 Testes

### Teste 1: Verificar Configuração

```javascript
// Console do navegador
console.log(window.kwaiq);
// Deve retornar: ƒ (eventName, eventData) { ... }
```

### Teste 2: Verificar Logs

```javascript
// Console do navegador
// Procure por:
// [Kwai] Pixel 1234567890 inicializado com sucesso
// [Kwai] ✅ Evento PlaceOrder enviado com sucesso
```

### Teste 3: Verificar no Kwai Ads Manager

1. Ir para: kwai.com/ads
2. Selecionar sua conta
3. Ir para "Events" ou "Conversions"
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

- `src/integrations/gateways/mercadopago/` - Mercado Pago
- `src/integrations/gateways/pushinpay/` - PushInPay

---

## 🐛 Troubleshooting

### Problema: "Integração não encontrada"
**Solução**: Verificar se existe registro em vendor_integrations com integration_type="KWAI_PIXEL"

### Problema: "Conversão não foi enviada"
**Solução**: 
1. Verificar se pixel_id está correto
2. Verificar console para logs de erro
3. Verificar se há bloqueador de scripts

### Problema: "kwaiq não está disponível"
**Solução**: 
1. Verificar se script foi carregado
2. Verificar console para erros de rede
3. Verificar se há bloqueador de scripts

### Problema: "Produto não está habilitado"
**Solução**: 
1. Verificar se productId está em selected_products
2. Se selected_products vazio, todos os produtos devem estar habilitados

### Problema: "Evento não aparece no Kwai"
**Solução**: 
1. Verificar se está usando "PlaceOrder" (não "Purchase")
2. Confirmar que o pixel_id está correto no Kwai Ads Manager
3. Verificar se há delay de propagação (pode levar minutos)

---

## 📝 Changelog

### v1.0 (29/11/2025)
- ✅ Implementação inicial
- ✅ 6 arquivos criados
- ✅ 8 funções de eventos
- ✅ Suporte a "PlaceOrder" (padrão Kwai)
- ✅ Documentação completa
- ✅ Testes recomendados

---

## 👨‍💻 Autor

Implementado como parte da Refração Modular do RiseCheckout (Passo 5).

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
1. Este README
2. Arquivo types.ts para interfaces
3. Código comentado em cada arquivo
4. Documentação oficial do Kwai Pixel
