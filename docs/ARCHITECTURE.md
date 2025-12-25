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

## 📖 Documentação Relacionada

- [Módulos Compartilhados](../supabase/functions/_shared/README.md)
- [Asaas Create Payment](../supabase/functions/asaas-create-payment/README.md)
- [Asaas Webhook](../supabase/functions/asaas-webhook/README.md)
- [Stripe Create Payment](../supabase/functions/stripe-create-payment/README.md)
- [Stripe Webhook](../supabase/functions/stripe-webhook/README.md)
