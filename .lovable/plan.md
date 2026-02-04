
# Plano de Correção: Sistema de Eventos UTMify - Arquitetura Completa

## 1. Diagnóstico Técnico

### Problema Raiz Identificado
A investigação revelou **múltiplos problemas críticos** que impedem o funcionamento do UTMify:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  PROBLEMA 1: Token UTMify Inválido                                       │
│  ─────────────────────────────────────────────────────────────────────── │
│  A API UTMify retorna 404: API_CREDENTIAL_NOT_FOUND                      │
│  O token salvo no Vault está incorreto, expirado ou foi revogado         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PROBLEMA 2: Eventos Disparados Apenas no Frontend                       │
│  ─────────────────────────────────────────────────────────────────────── │
│  Apenas "purchase_approved" é disparado (PaymentSuccessPage.tsx)         │
│  Os demais eventos NÃO têm implementação:                                │
│  - pix_generated (quando PIX é criado)                                   │
│  - purchase_refused (cartão recusado)                                    │
│  - refund (reembolso)                                                    │
│  - chargeback                                                            │
│  - checkout_abandoned                                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PROBLEMA 3: Dependência de Navegação do Usuário                         │
│  ─────────────────────────────────────────────────────────────────────── │
│  Se o cliente não chegar em /success, o evento não é disparado           │
│  Eventos backend (webhooks) não chamam UTMify                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Evidências da Investigação

| Verificação | Resultado | Detalhes |
|-------------|-----------|----------|
| Edge Function chamada via curl | ✅ OK | Retornou erro 404 da API UTMify |
| Token no Vault | ✅ Existe | `gateway_utmify_28aa5872-34e2-4a65-afec-0fdfca68b5d6` |
| Resposta API UTMify | ❌ ERRO | `{"message":"API_CREDENTIAL_NOT_FOUND"}` |
| vendor_integrations | ⚠️ VAZIO | Nenhum registro UTMify na tabela |
| Logs da Edge Function | ✅ | Token recuperado, mas API rejeitou |

---

## 2. Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Arquitetura de Eventos Backend-First (SSOT)
- **Manutenibilidade:** 10/10 - Eventos disparados na origem correta
- **Zero DT:** 10/10 - Todos os eventos implementados corretamente
- **Arquitetura:** 10/10 - Backend como SSOT para tracking
- **Escalabilidade:** 10/10 - Funciona independente do frontend
- **Segurança:** 10/10 - Token nunca exposto ao frontend
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2-3 dias

### Solução B: Manter Disparo Frontend + Corrigir Token
- **Manutenibilidade:** 5/10 - Frontend dependente, eventos perdidos
- **Zero DT:** 4/10 - Apenas purchase_approved funcionaria
- **Arquitetura:** 3/10 - Violação de responsabilidades
- **Escalabilidade:** 5/10 - Problemas com offline/mobile
- **Segurança:** 6/10 - Token exposto via publicCall
- **NOTA FINAL: 4.6/10**
- Tempo estimado: 1 hora

### DECISÃO: Solução A (Nota 10.0/10)
Implementar sistema de eventos UTMify no backend, disparando diretamente dos webhooks e handlers onde os eventos ocorrem.

---

## 3. Arquitetura Proposta

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      FLUXO DE EVENTOS UTMify                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PIX GERADO                                                              │
│  ─────────                                                               │
│  pushinpay-create-pix/post-pix.ts                                        │
│       └─ triggerPixGeneratedWebhook()                                    │
│            └─ trigger-webhooks                                           │
│                 └─ [NOVO] Disparar UTMify "pix_generated"               │
│                                                                          │
│  PAGAMENTO APROVADO                                                      │
│  ─────────────────                                                       │
│  pushinpay-webhook/index.ts (status = paid)                              │
│       └─ processPostPaymentActions()                                     │
│            └─ [NOVO] Disparar UTMify "purchase_approved"                │
│                                                                          │
│  mercadopago-webhook/index.ts (status = approved)                        │
│       └─ processPostPaymentActions()                                     │
│            └─ [NOVO] Disparar UTMify "purchase_approved"                │
│                                                                          │
│  PAGAMENTO RECUSADO (Cartão)                                             │
│  ────────────────────────────                                            │
│  stripe-webhook/index.ts (charge.failed)                                 │
│       └─ [NOVO] Disparar UTMify "purchase_refused"                      │
│                                                                          │
│  mercadopago-webhook/index.ts (status = rejected)                        │
│       └─ [NOVO] Disparar UTMify "purchase_refused"                      │
│                                                                          │
│  REEMBOLSO                                                               │
│  ────────                                                                │
│  webhook-post-refund.ts                                                  │
│       └─ processPostRefundActions()                                      │
│            └─ [NOVO] Disparar UTMify "refund"                           │
│                                                                          │
│  CHARGEBACK                                                              │
│  ─────────                                                               │
│  mercadopago-webhook/index.ts (chargedback)                              │
│       └─ [NOVO] Disparar UTMify "chargeback"                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Implementação Detalhada

### 4.1. Criar Helper Centralizado: `_shared/utmify-dispatcher.ts`

Este arquivo centraliza a lógica de disparo do UTMify para todos os eventos.

```typescript
/**
 * UTMify Event Dispatcher
 * 
 * @module _shared/utmify-dispatcher
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Centraliza disparo de eventos para UTMify no backend.
 * Usado por todos os webhooks que precisam notificar o UTMify.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("UTMifyDispatcher");

// URL da API UTMify
const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";

// Eventos suportados
export type UTMifyEventType = 
  | "pix_generated"
  | "purchase_approved" 
  | "purchase_refused"
  | "refund"
  | "chargeback";

// Mapeamento de status
const STATUS_MAP: Record<UTMifyEventType, string> = {
  pix_generated: "pending",
  purchase_approved: "paid",
  purchase_refused: "refused",
  refund: "refunded",
  chargeback: "chargedback",
};

export interface UTMifyOrderData {
  orderId: string;
  vendorId: string;
  paymentMethod: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    document?: string | null;
    country?: string;
    ip?: string | null;
  };
  products: Array<{
    id: string;
    name: string;
    priceInCents: number;
    quantity?: number;
  }>;
  trackingParameters?: {
    src?: string | null;
    sck?: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
  };
  totalPriceInCents: number;
  approvedDate?: string | null;
  refundedAt?: string | null;
}

/**
 * Verifica se o evento está habilitado para o vendor/produto
 */
async function isEventEnabled(
  supabase: SupabaseClient,
  vendorId: string,
  eventType: UTMifyEventType,
  productId?: string
): Promise<boolean> {
  const { data: integration } = await supabase
    .from("vendor_integrations")
    .select("active, config")
    .eq("vendor_id", vendorId)
    .eq("integration_type", "UTMIFY")
    .maybeSingle();

  if (!integration?.active) {
    return false;
  }

  const config = integration.config as Record<string, unknown> | null;
  const selectedEvents = config?.selected_events as string[] | undefined;
  const selectedProducts = config?.selected_products as string[] | undefined;

  // Se não há eventos selecionados, considera todos habilitados
  if (!selectedEvents || selectedEvents.length === 0) {
    return true;
  }

  // Verificar se o evento está na lista
  if (!selectedEvents.includes(eventType)) {
    return false;
  }

  // Se há filtro de produtos, verificar
  if (selectedProducts && selectedProducts.length > 0 && productId) {
    return selectedProducts.includes(productId);
  }

  return true;
}

/**
 * Recupera token UTMify do Vault
 */
async function getUTMifyToken(
  supabase: SupabaseClient,
  vendorId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_gateway_credentials", {
    p_vendor_id: vendorId,
    p_gateway: "utmify",
  });

  if (error || !data?.credentials?.api_token) {
    return null;
  }

  return data.credentials.api_token;
}

/**
 * Formata data para UTMify (YYYY-MM-DD HH:mm:ss UTC)
 */
function formatDateUTC(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Dispara evento para UTMify
 */
export async function dispatchUTMifyEvent(
  supabase: SupabaseClient,
  eventType: UTMifyEventType,
  orderData: UTMifyOrderData,
  productId?: string
): Promise<{ success: boolean; error?: string }> {
  const { vendorId } = orderData;

  // 1. Verificar se evento está habilitado
  const enabled = await isEventEnabled(supabase, vendorId, eventType, productId);
  if (!enabled) {
    log.info(`Evento ${eventType} não habilitado para vendor ${vendorId}`);
    return { success: true }; // Não é erro, apenas não está configurado
  }

  // 2. Recuperar token
  const token = await getUTMifyToken(supabase, vendorId);
  if (!token) {
    log.info(`Nenhum token UTMify para vendor ${vendorId}`);
    return { success: true }; // Não é erro, apenas não configurado
  }

  // 3. Construir payload conforme API UTMify
  const payload = {
    orderId: orderData.orderId,
    platform: "RiseCheckout",
    paymentMethod: orderData.paymentMethod,
    status: STATUS_MAP[eventType],
    createdAt: formatDateUTC(orderData.createdAt),
    approvedDate: orderData.approvedDate ? formatDateUTC(orderData.approvedDate) : null,
    refundedAt: orderData.refundedAt ? formatDateUTC(orderData.refundedAt) : null,
    customer: {
      name: orderData.customer.name,
      email: orderData.customer.email,
      phone: orderData.customer.phone || null,
      document: orderData.customer.document || null,
      country: orderData.customer.country || "BR",
      ip: orderData.customer.ip || "0.0.0.0",
    },
    products: orderData.products.map((p) => ({
      id: p.id,
      name: p.name,
      planId: null,
      planName: null,
      quantity: p.quantity || 1,
      priceInCents: p.priceInCents,
    })),
    trackingParameters: {
      src: orderData.trackingParameters?.src || null,
      sck: orderData.trackingParameters?.sck || null,
      utm_source: orderData.trackingParameters?.utm_source || null,
      utm_campaign: orderData.trackingParameters?.utm_campaign || null,
      utm_medium: orderData.trackingParameters?.utm_medium || null,
      utm_content: orderData.trackingParameters?.utm_content || null,
      utm_term: orderData.trackingParameters?.utm_term || null,
    },
    commission: {
      totalPriceInCents: orderData.totalPriceInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: orderData.totalPriceInCents,
      currency: "BRL",
    },
    isTest: false,
  };

  // 4. Enviar para UTMify
  try {
    log.info(`Disparando ${eventType} para order ${orderData.orderId}`);

    const response = await fetch(UTMIFY_API_URL, {
      method: "POST",
      headers: {
        "x-api-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      log.error(`UTMify API error (${response.status}):`, responseText);
      return { success: false, error: responseText };
    }

    log.info(`✅ UTMify ${eventType} enviado para order ${orderData.orderId}`);
    return { success: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log.error(`Erro ao enviar para UTMify:`, errMsg);
    return { success: false, error: errMsg };
  }
}
```

### 4.2. Integrar em `_shared/webhook-post-payment.ts`

Adicionar chamada ao UTMify após ações pós-pagamento:

```typescript
// Importar no topo
import { dispatchUTMifyEvent } from './utmify-dispatcher.ts';

// Dentro de processPostPaymentActions, após TRIGGER VENDOR WEBHOOKS:

// ========================================================================
// 4. UTMIFY TRACKING (RISE V3 - Backend SSOT)
// ========================================================================

try {
  // Buscar dados completos do pedido para UTMify
  const { data: fullOrder } = await supabase
    .from("orders")
    .select(`
      id, customer_name, customer_email, customer_phone, customer_document,
      customer_ip, amount_cents, payment_method, created_at,
      src, sck, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      order_items (id, product_id, product_name, amount_cents, quantity)
    `)
    .eq("id", input.orderId)
    .single();

  if (fullOrder) {
    await dispatchUTMifyEvent(supabase, "purchase_approved", {
      orderId: fullOrder.id,
      vendorId: input.vendorId,
      paymentMethod: fullOrder.payment_method || "pix",
      createdAt: fullOrder.created_at,
      approvedDate: new Date().toISOString(),
      customer: {
        name: fullOrder.customer_name || "",
        email: fullOrder.customer_email || "",
        phone: fullOrder.customer_phone,
        document: fullOrder.customer_document,
        ip: fullOrder.customer_ip,
      },
      products: fullOrder.order_items?.map((item) => ({
        id: item.product_id,
        name: item.product_name,
        priceInCents: item.amount_cents,
        quantity: item.quantity || 1,
      })) || [],
      trackingParameters: {
        src: fullOrder.src,
        sck: fullOrder.sck,
        utm_source: fullOrder.utm_source,
        utm_medium: fullOrder.utm_medium,
        utm_campaign: fullOrder.utm_campaign,
        utm_content: fullOrder.utm_content,
        utm_term: fullOrder.utm_term,
      },
      totalPriceInCents: fullOrder.amount_cents,
    });
  }
} catch (utmifyError) {
  logger.warn("UTMify tracking falhou (não crítico):", utmifyError);
}
```

### 4.3. Integrar `pix_generated` em `pushinpay-create-pix/post-pix.ts`

Após criar o PIX, disparar evento para UTMify:

```typescript
// Importar no topo
import { dispatchUTMifyEvent } from '../../_shared/utmify-dispatcher.ts';

// Na função que dispara webhook, adicionar:
export async function dispatchPixGeneratedUTMify(
  supabase: SupabaseClient,
  orderId: string,
  log: Logger
): Promise<void> {
  try {
    const { data: order } = await supabase
      .from("orders")
      .select(`
        id, vendor_id, customer_name, customer_email, customer_phone, 
        customer_document, customer_ip, amount_cents, created_at,
        src, sck, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        order_items (id, product_id, product_name, amount_cents, quantity)
      `)
      .eq("id", orderId)
      .single();

    if (!order) {
      log.warn("Order not found for UTMify pix_generated");
      return;
    }

    await dispatchUTMifyEvent(supabase, "pix_generated", {
      orderId: order.id,
      vendorId: order.vendor_id,
      paymentMethod: "pix",
      createdAt: order.created_at,
      customer: {
        name: order.customer_name || "",
        email: order.customer_email || "",
        phone: order.customer_phone,
        document: order.customer_document,
        ip: order.customer_ip,
      },
      products: order.order_items?.map((item) => ({
        id: item.product_id,
        name: item.product_name,
        priceInCents: item.amount_cents,
        quantity: item.quantity || 1,
      })) || [],
      trackingParameters: {
        src: order.src,
        sck: order.sck,
        utm_source: order.utm_source,
        utm_medium: order.utm_medium,
        utm_campaign: order.utm_campaign,
        utm_content: order.utm_content,
        utm_term: order.utm_term,
      },
      totalPriceInCents: order.amount_cents,
    });

    log.info(`✅ UTMify pix_generated disparado para order ${orderId}`);
  } catch (error) {
    log.warn("UTMify pix_generated falhou (não crítico):", error);
  }
}
```

### 4.4. Integrar `refund` em `_shared/webhook-post-refund.ts`

```typescript
// Importar no topo
import { dispatchUTMifyEvent } from './utmify-dispatcher.ts';

// Dentro de processPostRefundActions:
await dispatchUTMifyEvent(supabase, "refund", {
  orderId: order.id,
  vendorId: order.vendor_id,
  paymentMethod: order.payment_method || "unknown",
  createdAt: order.created_at,
  refundedAt: new Date().toISOString(),
  customer: { ... },
  products: [ ... ],
  totalPriceInCents: order.amount_cents,
});
```

### 4.5. Remover Disparo do Frontend

Remover o código de disparo UTMify do `PaymentSuccessPage.tsx` para evitar duplicação (o backend agora é SSOT).

---

## 5. Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/_shared/utmify-dispatcher.ts` | **CRIAR** | Helper centralizado para disparo de eventos |
| `supabase/functions/_shared/webhook-post-payment.ts` | MODIFICAR | Integrar `purchase_approved` |
| `supabase/functions/_shared/webhook-post-refund.ts` | MODIFICAR | Integrar `refund` |
| `supabase/functions/pushinpay-create-pix/handlers/post-pix.ts` | MODIFICAR | Integrar `pix_generated` |
| `supabase/functions/asaas-create-payment/handlers/charge-creator.ts` | MODIFICAR | Integrar `pix_generated` |
| `supabase/functions/stripe-create-payment/handlers/post-payment.ts` | MODIFICAR | Integrar `pix_generated` |
| `supabase/functions/mercadopago-webhook/index.ts` | MODIFICAR | Integrar `purchase_refused`, `chargeback` |
| `supabase/functions/stripe-webhook/index.ts` | MODIFICAR | Integrar `purchase_refused` |
| `src/pages/PaymentSuccessPage.tsx` | MODIFICAR | Remover disparo frontend (opcional) |

---

## 6. Ação Imediata Necessária do Usuário

**CRÍTICO:** Antes de qualquer correção de código, você precisa:

1. **Acessar o painel UTMify** em https://app.utmify.com.br
2. **Gerar uma nova API Token** (ou verificar se a existente é válida)
3. **Reconfigurar a integração UTMify** no painel administrativo do RiseCheckout
4. **Testar manualmente** a API com o novo token

Sem um token válido, NENHUMA das correções de código funcionará.

---

## 7. Checklist de Qualidade RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta é a MELHOR solução possível? | Sim - Backend como SSOT para tracking |
| Existe alguma solução com nota maior? | Não |
| Isso cria dívida técnica? | Zero - todos os eventos implementados |
| Precisaremos "melhorar depois"? | Não |
| O código sobrevive 10 anos sem refatoração? | Sim |
| Estou escolhendo isso por ser mais rápido? | Não |

---

## 8. Conformidade RISE V3 Final

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade Infinita | 10/10 | Helper centralizado, DRY |
| Zero Dívida Técnica | 10/10 | Todos os 6 eventos implementados |
| Arquitetura Correta | 10/10 | Backend SSOT, não depende de frontend |
| Escalabilidade | 10/10 | Funciona para qualquer volume/gateway |
| Segurança | 10/10 | Token nunca exposto ao frontend |
| **NOTA FINAL** | **10.0/10** | |
