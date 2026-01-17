# Arquitetura RiseCheckout

## 🏗️ Visão Geral

RiseCheckout é uma plataforma de checkout high-end no modelo **Marketplace**.

## 💰 Modelo de Split de Pagamentos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FLUXO DE SPLIT - MODELO MARKETPLACE                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CLIENTE                                                                 │
│     │                                                                    │
│     │ Paga R$100                                                         │
│     ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    CONTA RISECHECKOUT                             │   │
│  │                    (Recebe 100% inicial)                          │   │
│  └────────────────────────────┬─────────────────────────────────────┘   │
│                               │                                          │
│         ┌─────────────────────┼─────────────────────┐                   │
│         │                     │                     │                   │
│         ▼                     ▼                     ▼                   │
│   ┌──────────┐         ┌──────────┐         ┌──────────────┐            │
│   │  OWNER   │         │  OWNER   │         │  VENDEDOR    │            │
│   │  DIRETO  │         │ +AFILIADO│         │   COMUM      │            │
│   └────┬─────┘         └────┬─────┘         └──────┬───────┘            │
│        │                    │                      │                    │
│        ▼                    ▼                      ▼                    │
│   ┌──────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│   │   100%   │    │ Afiliado: X%×96│    │ Vendedor: 96%   │            │
│   │ RiseChk  │    │ Owner: resto   │    │ Plataforma: 4%  │            │
│   └──────────┘    └─────────────────┘    └─────────────────┘            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔐 Camadas de Segurança

| Camada | Implementação |
|--------|---------------|
| Rate Limiting | `_shared/rate-limit.ts` (10 req/min) |
| Auditoria | `_shared/audit-logger.ts` |
| RBAC | `_shared/role-validator.ts` |
| RLS | Policies no Supabase |
| Webhook Auth | Tokens validados por gateway |

## 📊 Tabelas Principais

- `orders` - Pedidos
- `order_items` - Itens do pedido
- `order_events` - Histórico de eventos
- `profiles` - Dados de vendedores (wallet IDs)
- `affiliates` - Afiliações

## 🔗 Edge Functions

| Função | Propósito |
|--------|-----------|
| `asaas-create-payment` | Criar cobranças Asaas |
| `asaas-webhook` | Processar eventos Asaas |
| `stripe-create-payment` | Criar Payment Intents |
| `stripe-webhook` | Processar eventos Stripe |
| `create-order` | Criar pedidos |
| `trigger-webhooks` | Disparar webhooks do vendedor |
| `producer-auth` | Login/logout de produtores |

---

## 🔑 Sistema de Autenticação

RiseCheckout utiliza autenticação customizada via `producer_sessions`, independente do Supabase Auth.

### Componentes

| Componente | Descrição |
|------------|-----------|
| `producer_sessions` | Tabela de sessões ativas |
| `producer-auth` | Edge Function de login/logout |
| `unified-auth.ts` | Módulo compartilhado de validação |

### Fluxo

```
┌────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Frontend  │────▶│  producer-auth   │────▶│producer_sessions│
│   Login    │     │  Edge Function   │     │    (tabela)     │
└────────────┘     └──────────────────┘     └─────────────────┘
       │                                            │
       │ Recebe session_token                       │
       ▼                                            │
┌────────────┐     ┌──────────────────┐             │
│  Frontend  │────▶│  Edge Function   │─────────────┘
│   Request  │     │   (protegida)    │ Valida via unified-auth.ts
└────────────┘     └──────────────────┘
```

### Header de Autenticação

```
X-Producer-Session-Token: <token_64_caracteres>
```

### RISE ARCHITECT PROTOCOL

Este sistema segue 100% o protocolo:
- ✅ Zero fallbacks
- ✅ Caminho único de autenticação
- ✅ Sem código morto

---

## 📦 Sistema de Status de Pedidos

O RiseCheckout utiliza o **modelo Hotmart/Kiwify** com arquitetura dual-layer:

### Status Canônicos (UI)

| Status | Display | Descrição |
|--------|---------|-----------|
| `paid` | Pago | Pagamento confirmado |
| `pending` | Pendente | Aguardando (inclui expirados) |
| `refunded` | Reembolso | Valor devolvido |
| `chargeback` | Chargeback | Contestação |

### Technical Status (Interno)

| Status | Descrição |
|--------|-----------|
| `active` | Aguardando pagamento |
| `expired` | PIX/boleto expirou |
| `gateway_cancelled` | Cancelado pelo gateway |
| `gateway_error` | Erro no processamento |

> **Documentação completa:** [ORDER_STATUS_MODEL.md](./ORDER_STATUS_MODEL.md)

---

## 📖 Documentação Relacionada

### Arquitetura de Componentes
- [Sistema de Pixels](./PIXEL_SYSTEM.md) - Tracking multi-plataforma
- [Arquitetura do Sidebar](./SIDEBAR_ARCHITECTURE.md) - Navegação responsiva
- [Sistema de Status](./ORDER_STATUS_MODEL.md) - Modelo Hotmart/Kiwify

### Autenticação e Segurança
- [Sistema de Autenticação Completo](./AUTHENTICATION_SYSTEM.md)
- [Segurança de Rotas Admin](./ADMIN_ROUTES_SECURITY.md)
- [Módulos Compartilhados](../supabase/functions/_shared/README.md)
- [Módulo unified-auth.ts](../supabase/functions/_shared/README.md#8-unified-authts)

### Edge Functions
- [Asaas Create Payment](../supabase/functions/asaas-create-payment/README.md)
- [Asaas Webhook](../supabase/functions/asaas-webhook/README.md)
- [Stripe Create Payment](../supabase/functions/stripe-create-payment/README.md)
- [Stripe Webhook](../supabase/functions/stripe-webhook/README.md)

---

## 🚫 Zero Database Access (Frontend)

Seguindo o **RISE ARCHITECT PROTOCOL V2**, o frontend **NUNCA** acessa o banco diretamente.

### Princípios

| Regra | Status |
|-------|--------|
| Zero `supabase.from()` no frontend | ✅ 100% |
| 100% das operações via Edge Functions | ✅ |
| Arquivos API obsoletos removidos | ✅ |
| Código morto eliminado | ✅ |

### Fluxo de Dados

```
┌──────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Frontend │────▶│  Edge Function  │────▶│ Supabase Database│
│          │     │                 │     │                  │
└──────────┘     └─────────────────┘     └──────────────────┘
     ▲                                          │
     │                                          │
     └──────────────── Response ────────────────┘
```

### Edge Functions de Dados

| Categoria | Função | Operações |
|-----------|--------|-----------|
| Admin | `admin-data` | 15+ actions administrativas |
| Webhooks | `webhook-crud` | CRUD completo + listagem |
| Checkout | `checkout-public-data` | Dados públicos + status |
| Storage | `storage-management` | Upload, copy, remove |

### Migração Realizada (2026-01-16)

10 arquivos frontend migrados para usar Edge Functions:

1. `WebhooksConfig.tsx` → `webhook-crud`
2. `WebhookForm.tsx` → `webhook-crud`
3. `AffiliatesTab.tsx` → `admin-data`
4. `MarketplaceSettings.tsx` → `admin-data`
5. `useMembersAreaSettings.ts` → `admin-data`
6. `MenuPreview.tsx` → `admin-data`
7. `StripePix.tsx` → `checkout-public-data`
8. `uniqueCheckoutName.ts` → `admin-data`
9. `useAdminAnalytics.ts` → `admin-data`
10. `useOffers.ts` → `admin-data`

### Arquivos Removidos

- `src/api/storage/remove.ts` - Substituído por `storage-management`
- `src/lib/utils/slug.ts` - Código morto (lógica movida para Edge Functions)
