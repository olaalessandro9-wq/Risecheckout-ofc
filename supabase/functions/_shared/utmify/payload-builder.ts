/**
 * ============================================================================
 * UTMify Payload Builder
 * ============================================================================
 * 
 * @module _shared/utmify/payload-builder
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Construção de payloads para a API UTMify.
 * ============================================================================
 */

import { PLATFORM_NAME, STATUS_MAP } from "./constants.ts";
import { formatDateUTC } from "./date-formatter.ts";
import { mapPaymentMethod } from "./payment-mapper.ts";
import type { UTMifyEventType, UTMifyOrderData, DatabaseOrder } from "./types.ts";

/**
 * Constrói payload para API UTMify conforme documentação oficial
 * 
 * @param orderData - Dados do pedido
 * @param eventType - Tipo do evento
 * @returns Payload pronto para envio
 */
export function buildUTMifyPayload(
  orderData: UTMifyOrderData,
  eventType: UTMifyEventType
): Record<string, unknown> {
  return {
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
      // RISE V3: API UTMify REJEITA null para IP - usar "0.0.0.0" como fallback
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
}

/**
 * Converte ordem do banco de dados para UTMifyOrderData
 * 
 * @param order - Ordem do banco de dados
 * @param overrides - Campos para sobrescrever (opcional)
 * @returns Dados formatados para UTMify
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
