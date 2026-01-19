/**
 * Trigger Webhooks Handlers
 * 
 * Extracted handlers for trigger-webhooks edge function.
 * 
 * RISE Protocol Compliant - < 300 linhas
 */

import { createLogger } from "./logger.ts";

const log = createLogger("TriggerWebhooks");

// ============================================================================
// TYPES
// ============================================================================

export interface WebhookResult {
  success: boolean;
  status: number;
  body: string | null;
  error: string | null;
}

export interface WebhookRecord {
  id: string;
  url: string;
  name: string;
  events: string[];
  secret_encrypted?: string;
  secret?: string;
  product_id?: string;
  webhook_products?: Array<{ product_id: string }>;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  is_bump: boolean;
  amount_cents: number;
}

export interface Order {
  id: string;
  vendor_id: string;
  status: string;
  amount_cents: number;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  payment_method: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DISPATCH_TIMEOUT = 30000;

// ============================================================================
// UTILITIES
// ============================================================================

export function normalizeUUID(uuid: string | null | undefined): string {
  return uuid ? uuid.toLowerCase().trim() : "";
}

// ============================================================================
// HMAC SIGNATURE GENERATION
// ============================================================================

export async function generateHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// SSRF PROTECTION - URL VALIDATION
// ============================================================================

export function isUrlSafe(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      log.error("URL rejeitada: protocolo inválido (deve ser http ou https)", { url: urlString });
      return false;
    }
    
    const hostname = url.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^\[::1\]$/,
      /^\[fc/i,
      /^\[fd/i,
      /^\[fe80:/i,
      /^metadata\./i,
      /^internal\./i,
    ];
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        log.error("URL rejeitada: hostname bloqueado (SSRF protection)", { url: urlString, hostname });
        return false;
      }
    }
    
    log.info("URL aprovada para envio", { url: urlString });
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("URL rejeitada: formato inválido", { url: urlString, error: errorMessage });
    return false;
  }
}

// ============================================================================
// SEND TO EXTERNAL WEBHOOK
// ============================================================================

export async function sendToExternalWebhook(
  webhook: WebhookRecord,
  payload: unknown,
  productId: string,
  productName: string
): Promise<WebhookResult> {
  if (!isUrlSafe(webhook.url)) {
    log.error("SSRF Protection: URL bloqueada", { webhook_id: webhook.id, url: webhook.url });
    return {
      success: false,
      status: 0,
      body: null,
      error: 'URL blocked by SSRF protection'
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DISPATCH_TIMEOUT);

  try {
    log.info(`📡 Enviando para: ${webhook.url}`, { webhook_id: webhook.id });

    const payloadString = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    
    const webhookSecret = webhook.secret_encrypted || webhook.secret;
    if (!webhookSecret || webhookSecret.trim() === '') {
      log.error(`Webhook ${webhook.id} sem secret configurado - PULANDO`);
      return {
        success: false,
        status: 0,
        body: null,
        error: 'Webhook sem secret configurado'
      };
    }

    const signatureData = `${timestamp}.${payloadString}`;
    const signature = await generateHmacSignature(signatureData, webhookSecret);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Rise-Signature": signature,
        "X-Rise-Timestamp": timestamp,
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let responseBody = "";
    try {
      const text = await response.text();
      responseBody = text.length > 1000 ? text.substring(0, 1000) + "..." : text;
    } catch {
      responseBody = "[Sem corpo]";
    }

    return {
      success: response.ok,
      status: response.status,
      body: responseBody,
      error: response.ok ? null : `HTTP ${response.status}`
    };

  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const err = error as Error;
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      status: 0,
      body: null,
      error: isTimeout ? "Timeout (30s)" : err.message
    };
  }
}

// ============================================================================
// FILTER RELEVANT WEBHOOKS
// ============================================================================

export function filterRelevantWebhooks(
  webhooks: WebhookRecord[],
  itemProductId: string,
  eventType: string
): WebhookRecord[] {
  return webhooks.filter((wh) => {
    const supportsEvent = wh.events?.includes(eventType);
    if (!supportsEvent) {
      log.info(`  ❌ Webhook ${wh.name} não suporta evento ${eventType}`);
      return false;
    }

    const hasProductFilter = (wh.webhook_products && wh.webhook_products.length > 0) || wh.product_id;
    
    if (!hasProductFilter) {
      log.info(`  ✅ Match GLOBAL com webhook: ${wh.name}`);
      return true;
    }

    const normalizedItemId = normalizeUUID(itemProductId);
    const isLegacyMatch = normalizeUUID(wh.product_id) === normalizedItemId;
    const isRelationMatch = wh.webhook_products?.some(
      (wp) => normalizeUUID(wp.product_id) === normalizedItemId
    );

    const isMatch = isLegacyMatch || isRelationMatch;

    if (isMatch) {
      log.info(`  ✅ Match ESPECÍFICO com webhook: ${wh.name}`);
    } else {
      log.info(`  ❌ Webhook ${wh.name} não está configurado para produto`);
    }

    return isMatch;
  });
}

// ============================================================================
// BUILD PAYLOAD
// ============================================================================

export function buildWebhookPayload(
  eventType: string,
  order: Order,
  item: OrderItem
): unknown {
  return {
    event: eventType,
    created_at: new Date().toISOString(),
    data: {
      order: { 
        id: order.id, 
        status: order.status, 
        amount_cents: order.amount_cents,
        email: order.customer_email,
        name: order.customer_name,
        phone: order.customer_phone,
        payment_method: order.payment_method
      },
      item: {
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        is_bump: item.is_bump,
        price_cents: item.amount_cents
      }
    }
  };
}
