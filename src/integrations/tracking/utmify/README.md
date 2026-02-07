# UTMify Integration Module
**Módulo**: `src/integrations/tracking/utmify`  
**Status**: ✅ Implementado  
**Versão**: 5.0.0 - Arquitetura Híbrida (Backend SSOT + Frontend Pixel)  
**RISE V3 Score**: 10.0/10

---

## ⚠️ IMPORTANTE: Arquitetura Híbrida (Backend SSOT + Frontend Pixel)

A partir da versão 5.0.0, o UTMify usa uma **arquitetura híbrida**:

- **Backend SSOT**: Eventos transacionais (purchase_approved, pix_generated, refund, chargeback) disparados via webhooks de pagamento
- **Frontend Pixel**: Eventos comportamentais (InitiateCheckout) disparados pelo script CDN do UTMify

### O que mudou?

| Antes (v2.x) | Agora (v5.x) |
|--------------|--------------|
| Frontend enviava conversões via Edge Function | Backend dispara eventos automaticamente |
| `trackPurchase()` chamado no frontend | Webhook de pagamento dispara `purchase_approved` |
| Token exposto ao frontend | Token armazenado no Vault (nunca sai do backend) |

### Por que Backend SSOT?

1. **Segurança**: Token nunca é exposto ao frontend
2. **Confiabilidade**: Eventos disparados após confirmação real do pagamento
3. **Consistência**: Um único ponto de disparo (webhooks de gateway)
4. **Auditoria**: Fingerprint SHA-256 em logs para rastreamento

---

## 📋 Visão Geral

Este módulo frontend exporta **utilitários, tipos, hooks e o componente Pixel**. A lógica de disparo de eventos transacionais está em `supabase/functions/_shared/utmify/`.

### Estrutura do Módulo Frontend

```
src/integrations/tracking/utmify/
├── index.ts          # Barrel export (utils + types + hooks + Pixel)
├── types.ts          # Tipos e interfaces TypeScript
├── events.ts         # Utils: extractUTMParameters, formatDateForUTMify
├── utils.ts          # Utils: convertToCents, convertToReais
├── hooks.ts          # Hooks React para config
├── Pixel.tsx         # Componente: injeta CDN script + dispara InitiateCheckout
└── README.md         # Este arquivo
```

### Estrutura do Módulo Backend (SSOT)

```
supabase/functions/_shared/utmify/
├── index.ts              # Barrel export
├── types.ts              # Tipos unificados
├── constants.ts          # URL API, STATUS_MAP
├── token-normalizer.ts   # SSOT: normalização de tokens
├── date-formatter.ts     # Formatação UTC
├── payment-mapper.ts     # Mapeamento de métodos
├── config-checker.ts     # Verificação de eventos habilitados
├── token-retriever.ts    # Recuperação do Vault
├── payload-builder.ts    # Construção do payload
├── order-fetcher.ts      # Busca de pedido
├── dispatcher.ts         # Função principal de disparo
└── tests/
    └── token-normalizer.test.ts
```

---

## 🚀 Como Usar (Frontend)

### 1. Import Centralizado

```typescript
import * as UTMify from "@/integrations/tracking/utmify";
```

### 2. Extrair Parâmetros UTM (para persistir no pedido)

```typescript
const utmParams = UTMify.extractUTMParameters();
// Usado pelo createOrderActor para salvar UTMs na tabela orders
```

### 3. Carregar Configuração (Admin)

```typescript
const { data: utmifyIntegration } = UTMify.useUTMifyConfig(vendorId);
```

### 4. Verificar se Habilitado (Admin)

```typescript
const shouldRun = UTMify.shouldRunUTMify(utmifyIntegration, productId);
```

---

## 📚 Exports Disponíveis

### Funções Utilitárias

| Função | Descrição |
|--------|-----------|
| `extractUTMParameters()` | Extrai parâmetros UTM da URL |
| `formatDateForUTMify()` | Formata data para UTC |
| `convertToCents()` | Converte reais para centavos |
| `convertToReais()` | Converte centavos para reais |

### Hooks React

| Hook | Descrição |
|------|-----------|
| `useUTMifyConfig(vendorId)` | Carregar config do banco (cache 5 min) |
| `shouldRunUTMify(integration, productId)` | Verificar se deve rodar |
| `useUTMifyForProduct(vendorId, productId)` | Hook combinado |
| `isEventEnabledForUTMify(integration, eventType)` | Verificar evento habilitado |

### Componente

| Componente | Descrição |
|------------|-----------|
| `Pixel` | Injeta script CDN do UTMify e dispara InitiateCheckout |

### ❌ Funções REMOVIDAS (Backend SSOT)

As seguintes funções **NÃO existem mais** no frontend:

- ~~`sendUTMifyConversion()`~~ → Disparado pelo backend
- ~~`trackPageView()`~~ → Não suportado
- ~~`trackAddToCart()`~~ → Não suportado
- ~~`trackPurchase()`~~ → Disparado pelo backend via webhook
- ~~`trackRefund()`~~ → Disparado pelo backend via webhook
- ~~`Tracker`~~ → Substituído por `Pixel` (v5.0.0)

---

## 📊 Fluxo de Dados (Arquitetura Híbrida)

```
┌─────────────────────────────────────────────────────────────┐
│                    CHECKOUT FRONTEND                        │
│                                                              │
│  1. extractUTMParameters() captura UTMs da URL              │
│  2. createOrderActor persiste UTMs na tabela orders         │
│  3. UTMify.Pixel injeta CDN script + dispara IC             │
│     └─ window.utmify('track', 'InitiateCheckout')           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GATEWAY DE PAGAMENTO                      │
│                                                              │
│  - MercadoPago, Stripe, PushInPay, Asaas                    │
│  - Confirma pagamento e envia webhook                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    WEBHOOK HANDLER                           │
│                                                              │
│  - mercadopago-webhook, stripe-webhook, etc                 │
│  - Valida assinatura do webhook                             │
│  - Atualiza status do pedido                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 _shared/utmify/dispatcher.ts                 │
│                                                              │
│  1. isEventEnabled() - verifica se evento está habilitado   │
│  2. getUTMifyToken() - recupera token do Vault              │
│  3. buildUTMifyPayload() - constrói payload                 │
│  4. fetch() - envia para api.utmify.com.br                  │
│  5. Registra fingerprint para auditoria                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      UTMify API                              │
│                                                              │
│  POST https://api.utmify.com.br/api-credentials/orders      │
│  Header: x-api-token: {token}                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Segurança

- ✅ Token armazenado no Vault (nunca no frontend)
- ✅ Token normalizado via SSOT (`token-normalizer.ts`)
- ✅ Fingerprint SHA-256 em logs (token nunca exposto)
- ✅ RLS protege dados de outros vendedores
- ✅ Eventos disparados após confirmação real do gateway

---

## 🔧 Configuração no Banco de Dados

### vendor_integrations

```json
{
  "vendor_id": "uuid-do-vendedor",
  "integration_type": "UTMIFY",
  "active": true,
  "config": {
    "selected_products": ["product-id-1", "product-id-2"],
    "selected_events": ["purchase_approved", "refund"]
  }
}
```

### vault (via Edge Function vault-save)

```json
{
  "gateway": "utmify",
  "credentials": {
    "api_token": "token-normalizado"
  }
}
```

---

## 🧪 Testes

### Backend (Deno)

```bash
# Executar via ferramenta test-edge-functions
supabase/functions/_shared/utmify/tests/token-normalizer.test.ts
```

### Frontend (Vitest)

```bash
# Executar via npm test
src/integrations/tracking/utmify/__tests__/index.test.ts
```

---

## 🐛 Troubleshooting

### Problema: "Evento não foi disparado"

**Verificar**:
1. Token está salvo no Vault? (`vault-save` foi chamado)
2. Evento está em `selected_events`?
3. Produto está em `selected_products` (ou lista vazia = todos)?
4. Logs da Edge Function do webhook

### Problema: "Token inválido (401)"

**Verificar**:
1. Token foi normalizado corretamente ao salvar
2. Fingerprint no log corresponde ao esperado
3. Token não contém caracteres invisíveis

### Problema: "Parâmetros UTM não chegaram"

**Verificar**:
1. URL do checkout contém `?src=...&sck=...` ou `?utm_source=...`
2. createOrderActor persistiu UTMs na tabela orders
3. Colunas `src`, `sck`, `utm_*` estão preenchidas no pedido

---

## 📝 Changelog

### v5.0.0 (07/02/2026) - Arquitetura Híbrida (Backend SSOT + Frontend Pixel)
- ✅ Novo componente `Pixel.tsx`: injeta script CDN + dispara InitiateCheckout
- ✅ Removido `Tracker.tsx` (código morto)
- ✅ Atributos `data-utmify-prevent-*` para evitar conflito de UTMs
- ✅ Retry com polling para `window.utmify` (3 tentativas, 500ms)
- ✅ Tipagem global `UTMifyPixelFunction` em `global.d.ts`

### v4.0.0 (04/02/2026) - Backend SSOT
- ✅ Migração completa para Backend SSOT
- ✅ Modularização: 11 arquivos < 150 linhas cada
- ✅ Token normalizer SSOT (`token-normalizer.ts`)
- ✅ Fingerprint SHA-256 para auditoria
- ✅ Removidas funções de disparo do frontend
- ✅ 15 testes unitários no backend

### v2.0.0 (04/02/2026)
- ✅ Correção completa conforme documentação API UTMify
- ✅ URL corrigida: api-credentials/orders
- ✅ Header corrigido: x-api-token

### v1.0 (29/11/2025)
- ✅ Implementação inicial

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte este README
2. Verifique logs da Edge Function
3. Consulte `docs/EDGE_FUNCTIONS_REGISTRY.md`
