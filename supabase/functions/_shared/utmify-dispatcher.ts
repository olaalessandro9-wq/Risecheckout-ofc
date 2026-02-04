/**
 * ============================================================================
 * UTMify Event Dispatcher - Backend SSOT
 * ============================================================================
 * 
 * @module _shared/utmify-dispatcher
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Centraliza disparo de eventos para UTMify no backend.
 * Usado por todos os webhooks que precisam notificar o UTMify.
 * 
 * Eventos suportados:
 * - pix_generated: Quando PIX é criado
 * - purchase_approved: Quando pagamento é confirmado
 * - purchase_refused: Quando pagamento é recusado
 * - refund: Quando pedido é reembolsado
 * - chargeback: Quando ocorre chargeback
 * 
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("UTMifyDispatcher");

// URL da API UTMify
const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";

// Plataforma registrada
const PLATFORM_NAME = "RiseCheckout";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Eventos suportados pelo UTMify
 */
export type UTMifyEventType = 
  | "pix_generated"
  | "purchase_approved" 
  | "purchase_refused"
  | "refund"
  | "chargeback";

/**
 * Mapeamento de eventos para status da API UTMify
 */
const STATUS_MAP: Record<UTMifyEventType, string> = {
  pix_generated: "waiting_payment",
  purchase_approved: "paid",
  purchase_refused: "refused",
  refund: "refunded",
  chargeback: "chargedback",
};

/**
 * Dados do pedido para envio ao UTMify
 */
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
 * Resultado do disparo de evento
 */
export interface UTMifyDispatchResult {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verifica se o evento está habilitado para o vendor/produto
 * 
 * RISE V3: Suporta múltiplos product IDs (ordem com bumps)
 */
async function isEventEnabled(
  supabase: SupabaseClient,
  vendorId: string,
  eventType: UTMifyEventType,
  productIds?: string[]
): Promise<boolean> {
  try {
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

    // RISE V3: Se há filtro de produtos, verificar interseção
    // Pedidos com múltiplos itens (produto + bump) passam se QUALQUER item estiver selecionado
    if (selectedProducts && selectedProducts.length > 0 && productIds && productIds.length > 0) {
      const hasMatch = productIds.some(pid => selectedProducts.includes(pid));
      return hasMatch;
    }

    return true;
  } catch (error) {
    log.warn("Erro ao verificar configuração UTMify:", error);
    return false;
  }
}

/**
 * Recupera token UTMify do Vault com sanitização
 * 
 * RISE V3: Remove caracteres invisíveis para evitar rejeição pela API
 */
async function getUTMifyToken(
  supabase: SupabaseClient,
  vendorId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("get_gateway_credentials", {
      p_vendor_id: vendorId,
      p_gateway: "utmify",
    });

    if (error) {
      log.warn("Erro ao recuperar credenciais UTMify:", error.message);
      return null;
    }

    if (!data?.credentials?.api_token) {
      return null;
    }

    // RISE V3: Sanitizar token removendo caracteres invisíveis
    const rawToken = data.credentials.api_token as string;
    const sanitizedToken = rawToken
      .replace(/[\r\n\t]/g, '')  // Remove quebras de linha e tabs
      .replace(/\s+/g, '')       // Remove espaços
      .replace(/^["']|["']$/g, '') // Remove aspas envolventes
      .trim();

    // Log de diagnóstico (sem expor o token)
    if (rawToken.length !== sanitizedToken.length) {
      log.warn("Token UTMify sanitizado - tinha caracteres invisíveis", {
        originalLength: rawToken.length,
        sanitizedLength: sanitizedToken.length
      });
    }

    if (sanitizedToken.length === 0) {
      log.error("Token UTMify vazio após sanitização");
      return null;
    }

    return sanitizedToken;
  } catch (error) {
    log.warn("Exceção ao recuperar token UTMify:", error);
    return null;
  }
}

/**
 * Formata data para UTMify (YYYY-MM-DD HH:mm:ss UTC)
 * 
 * Conforme documentação da API UTMify
 */
function formatDateUTC(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return typeof date === "string" ? date : new Date().toISOString();
  }
  
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Mapeia método de pagamento para formato UTMify
 */
function mapPaymentMethod(method: string): string {
  const normalized = method.toLowerCase();
  
  if (normalized.includes("pix")) return "pix";
  if (normalized.includes("credit") || normalized.includes("card") || normalized.includes("cartao")) {
    return "credit_card";
  }
  if (normalized.includes("boleto")) return "boleto";
  
  return normalized;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Dispara evento para UTMify
 * 
 * Esta função:
 * 1. Verifica se o evento está habilitado para o vendor
 * 2. Recupera o token da API do Vault
 * 3. Constrói o payload conforme documentação UTMify
 * 4. Envia para a API e retorna o resultado
 * 
 * @param supabase - Cliente Supabase com service role
 * @param eventType - Tipo do evento (pix_generated, purchase_approved, etc)
 * @param orderData - Dados do pedido
 * @param productIds - IDs dos produtos (para filtro multi-item)
 * @returns Resultado do disparo
 */
export async function dispatchUTMifyEvent(
  supabase: SupabaseClient,
  eventType: UTMifyEventType,
  orderData: UTMifyOrderData,
  productIds?: string[]
): Promise<UTMifyDispatchResult> {
  const { vendorId, orderId } = orderData;

  // 1. Verificar se evento está habilitado (RISE V3: suporta multi-itens)
  const enabled = await isEventEnabled(supabase, vendorId, eventType, productIds);
  if (!enabled) {
    log.info(`UTMify ${eventType} não habilitado para vendor ${vendorId}`);
    return { success: true, skipped: true, reason: "not_enabled" };
  }

  // 2. Recuperar token
  const token = await getUTMifyToken(supabase, vendorId);
  if (!token) {
    log.info(`Nenhum token UTMify configurado para vendor ${vendorId}`);
    return { success: true, skipped: true, reason: "no_token" };
  }

  // 3. Construir payload conforme API UTMify
  const payload = {
    orderId: orderData.orderId,
    platform: PLATFORM_NAME,
    paymentMethod: mapPaymentMethod(orderData.paymentMethod),
    status: STATUS_MAP[eventType],
    createdAt: formatDateUTC(orderData.createdAt),
    approvedDate: orderData.approvedDate ? formatDateUTC(orderData.approvedDate) : null,
    refundedAt: orderData.refundedAt ? formatDateUTC(orderData.refundedAt) : null,
    customer: {
      name: orderData.customer.name || "Cliente",
      email: orderData.customer.email || "noemail@example.com",
      phone: orderData.customer.phone || null,
      document: orderData.customer.document || null,
      country: orderData.customer.country || "BR",
      // RISE V3: API UTMify REJEITA null - usar "0.0.0.0" como fallback
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
    log.info(`Disparando UTMify ${eventType} para order ${orderId}`, {
      tokenLength: token.length,
      payloadSize: JSON.stringify(payload).length
    });

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
      log.error(`UTMify API error (${response.status}):`, {
        orderId,
        eventType,
        statusCode: response.status,
        response: responseText.slice(0, 500)
      });
      return { success: false, error: `API Error ${response.status}: ${responseText}` };
    }

    log.info(`✅ UTMify ${eventType} enviado para order ${orderId}`);
    return { success: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log.error(`Erro ao enviar para UTMify:`, { orderId, eventType, error: errMsg });
    return { success: false, error: errMsg };
  }
}

// ============================================================================
// HELPER: Build Order Data from DB Order
// ============================================================================

/**
 * Interface para ordem do banco de dados
 */
export interface DatabaseOrder {
  id: string;
  vendor_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_document: string | null;
  customer_ip: string | null;
  amount_cents: number;
  payment_method: string | null;
  created_at: string;
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  order_items?: Array<{
    product_id: string;
    product_name: string;
    amount_cents: number;
    quantity: number | null;
  }>;
}

/**
 * Converte uma ordem do banco de dados para o formato UTMifyOrderData
 */
export function buildUTMifyOrderData(
  order: DatabaseOrder,
  overrides?: Partial<UTMifyOrderData>
): UTMifyOrderData {
  return {
    orderId: order.id,
    vendorId: order.vendor_id,
    paymentMethod: order.payment_method || "pix",
    createdAt: order.created_at,
    customer: {
      name: order.customer_name || "Cliente",
      email: order.customer_email || "noemail@example.com",
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
    ...overrides,
  };
}

// ============================================================================
// HELPER: Fetch Full Order for UTMify
// ============================================================================

/**
 * Busca dados completos do pedido para disparo UTMify
 * 
 * RISE V3: Log melhorado para distinguir "não encontrado" de "erro SQL"
 */
export async function fetchOrderForUTMify(
  supabase: SupabaseClient,
  orderId: string
): Promise<DatabaseOrder | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, vendor_id, customer_name, customer_email, customer_phone,
      customer_document, customer_ip, amount_cents, payment_method, created_at,
      src, sck, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      order_items (product_id, product_name, amount_cents, quantity)
    `)
    .eq("id", orderId)
    .single();

  if (error) {
    // RISE V3: Distinguir entre "não encontrado" e "erro SQL"
    if (error.code === 'PGRST116') {
      log.warn(`Pedido ${orderId} não encontrado para UTMify`);
    } else {
      log.error(`Erro SQL ao buscar pedido ${orderId} para UTMify:`, {
        code: error.code,
        message: error.message,
        hint: error.hint
      });
    }
    return null;
  }

  if (!data) {
    log.warn(`Pedido ${orderId} não encontrado para UTMify`);
    return null;
  }

  return data as DatabaseOrder;
}

// ============================================================================
// CONVENIENCE: Dispatch with Order Fetch
// ============================================================================

/**
 * Busca o pedido e dispara evento UTMify em uma única operação
 * 
 * RISE V3: Suporta múltiplos produtos (pedido com bumps)
 */
export async function dispatchUTMifyEventForOrder(
  supabase: SupabaseClient,
  orderId: string,
  eventType: UTMifyEventType,
  overrides?: Partial<UTMifyOrderData>
): Promise<UTMifyDispatchResult> {
  const order = await fetchOrderForUTMify(supabase, orderId);
  
  if (!order) {
    return { success: true, skipped: true, reason: "order_not_found" };
  }

  const orderData = buildUTMifyOrderData(order, overrides);
  
  // RISE V3: Passar TODOS os product_ids para filtro multi-item
  const productIds = order.order_items?.map(item => item.product_id) || [];

  return dispatchUTMifyEvent(supabase, eventType, orderData, productIds);
}
