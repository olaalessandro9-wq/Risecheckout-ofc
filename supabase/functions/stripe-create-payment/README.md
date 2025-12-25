# Stripe Create Payment

> Edge Function para criar Payment Intents via Stripe.

## 📋 Resumo

| Propriedade | Valor |
|-------------|-------|
| **Endpoint** | `POST /functions/v1/stripe-create-payment` |
| **Auth** | Não requer JWT |
| **Rate Limit** | 10 req/min por IP |
| **Gateway** | Stripe (PIX + Cartão) |

## 📥 Request

```typescript
interface CreatePaymentRequest {
  order_id: string;
  payment_method: "credit_card" | "pix";
  payment_method_id?: string;  // Para cartão
  return_url?: string;
}
```

## 🏪 Modelo de Split (Stripe Connect)

- **Owner direto**: 100% → RiseCheckout (sem `application_fee`)
- **Vendedor comum**: `application_fee_amount` = 4% → Plataforma
- **Com afiliado**: Transfer separado para afiliado após pagamento

## 🔗 Secrets

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 📊 Logs

[Ver logs](https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions/stripe-create-payment/logs)
