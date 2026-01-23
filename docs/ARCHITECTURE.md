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
│  └────────────────────────────────────────────────────────────────┬─┘   │
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
| `unified-auth` | Login/Register/Refresh (SSOT) |

---

## 🔑 Sistema de Autenticação (RISE V3 - Unified Auth)

RiseCheckout utiliza autenticação **100% unificada** via tabela `sessions`.

### Componentes

| Componente | Descrição |
|------------|-----------|
| `sessions` | Tabela única de sessões (producers + buyers) |
| `unified-auth` | Edge Function de login/register/refresh |
| `unified-auth-v2.ts` | Módulo compartilhado de validação |

### Fluxo (Cookies httpOnly)

```
┌────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Frontend  │────▶│   unified-auth   │────▶│    sessions     │
│   Login    │     │  Edge Function   │     │    (tabela)     │
└────────────┘     └──────────────────┘     └─────────────────┘
       │                    │                       │
       │ Set-Cookie: __Host-rise_access (httpOnly)
       ▼                    │                       │
┌────────────┐     ┌──────────────────┐             │
│  Frontend  │────▶│  Edge Function   │─────────────┘
│   Request  │     │   (protegida)    │ Valida via unified-auth-v2.ts
│ credentials:include      │            (extrai token do cookie)
└────────────┘     └──────────────────┘
```

### Cookies

- `__Host-rise_access`: Token de acesso (60 min, httpOnly, Secure)
- `__Host-rise_refresh`: Token de refresh (30 dias, httpOnly, Secure)

### RISE ARCHITECT PROTOCOL V3

Este sistema segue 100% o protocolo:
- ✅ Zero fallbacks para sistemas legados
- ✅ Caminho único de autenticação
- ✅ Sem código morto
- ✅ Tabela única `sessions`

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
- [Módulo de Trackeamento](./TRACKING_MODULE.md) - Pixels + UTMify (XState)
- [Sistema de Pixels](./PIXEL_SYSTEM.md) - Detalhes técnicos de pixels
- [Arquitetura do Sidebar](./SIDEBAR_ARCHITECTURE.md) - Navegação responsiva
- [Sistema de Status](./ORDER_STATUS_MODEL.md) - Modelo Hotmart/Kiwify

### Autenticação e Segurança
- [Sistema de Autenticação Unificado](./UNIFIED_AUTH_SYSTEM.md)
- [Segurança de Rotas Admin](./ADMIN_ROUTES_SECURITY.md)
- [Módulos Compartilhados](../supabase/functions/_shared/README.md)

### Edge Functions
- [Asaas Create Payment](../supabase/functions/asaas-create-payment/README.md)
- [Asaas Webhook](../supabase/functions/asaas-webhook/README.md)
- [Stripe Create Payment](../supabase/functions/stripe-create-payment/README.md)
- [Stripe Webhook](../supabase/functions/stripe-webhook/README.md)

---

## 🚫 Zero Database Access (Frontend)

Seguindo o **RISE ARCHITECT PROTOCOL V3**, o frontend **NUNCA** acessa o banco diretamente.

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
