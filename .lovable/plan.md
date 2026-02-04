

# Auditoria Completa: Sistema UTMify e Pixels de Tracking no Checkout

## Sumário Executivo

Realizei uma auditoria profunda do sistema de tracking UTMify e pixels no checkout. **Encontrei 3 problemas CRÍTICOS** que precisam ser corrigidos.

---

## Arquitetura Atual (Visão Geral)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE TRACKING - CHECKOUT                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐   resolve-universal   ┌──────────────────────────────┐   │
│  │  Checkout    │ ──────────────────────> │   BFF (resolve-and-load)    │   │
│  │  Público     │                         │   - productPixels[]          │   │
│  │              │ <────────────────────── │   - vendorIntegration        │   │
│  └──────────────┘                         └──────────────────────────────┘   │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     TrackingManager                                   │   │
│  │  ├── Facebook Pixels (product_pixels)                                │   │
│  │  ├── TikTok Pixels (product_pixels)                                  │   │
│  │  ├── Google Ads Pixels (product_pixels)                              │   │
│  │  ├── Kwai Pixels (product_pixels)                                    │   │
│  │  └── UTMify (vendor_integrations) ◄── Sistema separado               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────┐                      ┌──────────────┐                     │
│  │  Pagamento   │ ───── PIX ─────────> │  usePixPay.. │ ─> sendUTMify ✅   │
│  │  Realizado   │                       │  Status      │                     │
│  │              │ ───── CARTÃO ──────> │  Success     │ ─> ??? ❌           │
│  │              │                       │  Page        │    (NÃO DISPARA!)  │
│  └──────────────┘                      └──────────────┘                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Problemas Identificados

### PROBLEMA 1: UTMify NÃO dispara para pagamentos com CARTÃO DE CRÉDITO (CRÍTICO)

**Severidade:** 🔴 CRÍTICA  
**Impacto:** 100% das conversões por cartão NÃO são rastreadas na UTMify

**Evidência:**

| Local | Dispara UTMify? | Observação |
|-------|-----------------|------------|
| `usePixPaymentStatus.ts` (L133-178) | ✅ SIM | Apenas para PushinPay |
| `usePixPaymentStatus.ts` (L83-94) | ❌ NÃO | MercadoPago/Asaas/Stripe PIX não disparam |
| `PaymentSuccessPage.tsx` | ❌ NÃO | Nenhum tracking implementado |
| `processCardPaymentActor.ts` | ❌ NÃO | Apenas processa pagamento |

**Código problemático em `usePixPaymentStatus.ts`:**

```typescript
// Linhas 83-94 - MercadoPago/Asaas/Stripe PIX
if (status === "PAID" || status === "APPROVED") {
  setPaymentStatus("paid");
  toast.success("Pagamento confirmado!");
  
  setTimeout(() => {
    navigate(`/success/${orderId}`);  // ❌ NÃO DISPARA UTMIFY!
  }, 2000);
  
  return { paid: true };
}
```

**Apenas PushinPay dispara UTMify (L129-179)** - Os outros gateways navegam direto para a página de sucesso sem tracking.

---

### PROBLEMA 2: `firePurchase` do hook `useTrackingService` NUNCA é chamado (CRÍTICO)

**Severidade:** 🔴 CRÍTICA  
**Impacto:** A função existe mas não é usada

**Evidência:**

```typescript
// src/hooks/checkout/useTrackingService.ts
export function useTrackingService(...) {
  // ...
  const firePurchase = useCallback((...) => { 
    // Lógica de tracking
  }, []);
  
  return {
    fireInitiateCheckout,  // ✅ USADO no CheckoutPublicContent.tsx L268, L288
    firePurchase,          // ❌ NUNCA USADO em lugar nenhum!
  };
}
```

**Busca confirmando que `firePurchase(` só aparece em testes:**
- `useTrackingService.test.ts` - Apenas em testes

---

### PROBLEMA 3: Duplicação de código entre módulos UTMify (MÉDIA)

**Severidade:** 🟠 MÉDIA  
**Impacto:** Manutenibilidade comprometida

Existem DUAS implementações de `sendUTMifyConversion`:

| Arquivo | Localização |
|---------|-------------|
| `src/integrations/tracking/utmify/events.ts` | L28 |
| `src/lib/utmify-helper.ts` | L62 |

Ambas fazem a mesma coisa (chamam `api.publicCall("utmify-conversion", ...)`).

---

## O que está FUNCIONANDO CORRETAMENTE

| Componente | Status | Observação |
|------------|--------|------------|
| `TrackingManager` | ✅ OK | Renderiza pixels corretamente |
| `resolve-and-load` BFF | ✅ OK | Carrega vendorIntegration e productPixels |
| `utmify-conversion` Edge Function | ✅ OK | Busca token da tabela `users` |
| `vault-save` Edge Function | ✅ OK | Salva token no Vault |
| `vendor-integrations` Edge Function | ✅ OK | Retorna config sanitizada |
| UTMify Context/Machine (Dashboard) | ✅ OK | XState bem implementado |
| `shouldRunUTMify` | ✅ OK | Lógica de validação correta |
| `fireInitiateCheckout` | ✅ OK | Chamado corretamente no submit |

---

## Solução Proposta

### Análise de Soluções

| Solução | Nota | Tempo | Justificativa |
|---------|------|-------|---------------|
| **A: Disparar UTMify na PaymentSuccessPage** | 10.0 | 2h | SSOT - único ponto de tracking pós-pagamento |
| B: Adicionar tracking em cada gateway | 7.5 | 4h | Duplicação, fácil esquecer um gateway |
| C: Webhook server-side | 9.0 | 6h | Melhor arquitetura mas requer infra adicional |

**Decisão: Solução A** - Centralizar tracking na `PaymentSuccessPage.tsx`

### Implementação Detalhada

#### 1. Modificar `PaymentSuccessPage.tsx`

**Adicionar tracking UTMify quando o pedido for carregado:**

```typescript
// Após buscar orderDetails com sucesso, disparar UTMify
useEffect(() => {
  if (!orderDetails) return;
  
  // Disparar UTMify conversion
  const trackPurchase = async () => {
    const vendorId = orderDetails.vendor_id;
    if (!vendorId) return;
    
    await sendUTMifyConversion(
      vendorId,
      {
        orderId: orderId!,
        paymentMethod: orderDetails.payment_method || "unknown",
        status: "paid",
        createdAt: formatDateForUTMify(orderDetails.created_at || new Date()),
        approvedDate: formatDateForUTMify(new Date()),
        customer: {
          name: orderDetails.customer_name || "",
          email: orderDetails.customer_email || "",
        },
        products: orderDetails.order_items?.map(item => ({
          id: item.id,
          name: item.product_name,
          priceInCents: item.amount_cents,
          quantity: item.quantity,
        })) || [],
        trackingParameters: orderDetails.tracking_parameters || {},
        totalPriceInCents: orderDetails.amount_cents,
      },
      "purchase_approved",
      orderDetails.product_id
    );
  };
  
  trackPurchase();
}, [orderDetails, orderId]);
```

#### 2. Atualizar a Edge Function `checkout-public-data` (action: order-by-token)

**Adicionar campos necessários na resposta:**

- `vendor_id`
- `payment_method`
- `created_at`
- `tracking_parameters`

#### 3. Remover duplicação de `sendUTMifyConversion`

**Manter apenas em `src/integrations/tracking/utmify/events.ts`** e atualizar imports em `usePixPaymentStatus.ts`.

#### 4. Corrigir tracking para todos os gateways PIX

Em `usePixPaymentStatus.ts`, adicionar tracking para MercadoPago/Asaas/Stripe:

```typescript
if (status === "PAID" || status === "APPROVED") {
  setPaymentStatus("paid");
  toast.success("Pagamento confirmado!");
  
  // ADICIONAR: Enviar UTMify para todos os gateways
  if (orderData?.vendor_id) {
    sendUTMifyConversion(orderData.vendor_id, {...});
  }
  
  setTimeout(() => navigate(`/success/${orderId}`), 2000);
  return { paid: true };
}
```

---

## Arquivos Impactados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/PaymentSuccessPage.tsx` | Adicionar tracking UTMify |
| `src/pages/pix-payment/hooks/usePixPaymentStatus.ts` | Adicionar tracking para MercadoPago/Asaas/Stripe PIX |
| `src/lib/utmify-helper.ts` | Remover (usar integrations/tracking) |
| `supabase/functions/checkout-public-data/handlers/order-by-token.ts` | Adicionar campos vendor_id, tracking_parameters |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | ✅ Centralizado na PaymentSuccessPage |
| Zero Dívida Técnica | ✅ Remove duplicação de código |
| Arquitetura Correta | ✅ SSOT para tracking de purchase |
| Escalabilidade | ✅ Funciona para qualquer gateway |
| Segurança | ✅ Token buscado via Vault |

---

## Próximos Passos Recomendados

1. **Implementar correções** (estimativa: 3-4 horas)
2. **Testar fluxo completo** com um produto real
3. **Verificar logs** da Edge Function `utmify-conversion`
4. **Validar no dashboard UTMify** se conversões aparecem

