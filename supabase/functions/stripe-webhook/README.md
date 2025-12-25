# Stripe Webhook

> Edge Function para processar eventos do Stripe.

## 📋 Resumo

| Propriedade | Valor |
|-------------|-------|
| **Endpoint** | `POST /functions/v1/stripe-webhook` |
| **Auth** | Assinatura via `stripe-signature` header |

## 📥 Eventos Processados

| Evento | Ação |
|--------|------|
| `payment_intent.succeeded` | Atualiza ordem → PAID |
| `payment_intent.payment_failed` | Atualiza ordem → FAILED |
| `charge.refunded` | Atualiza ordem → REFUNDED |
| `charge.dispute.created` | Registra evento de disputa |
| `account.updated` | Atualiza status Connect |

## 🔐 Segurança

Valida assinatura do webhook:
```typescript
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

**Rejeita webhooks sem assinatura em produção.**

## 🔗 Secrets

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 📊 Logs

[Ver logs](https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions/stripe-webhook/logs)
