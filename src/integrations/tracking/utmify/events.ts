/**
 * Lógica de Eventos do UTMify
 * Módulo: src/integrations/tracking/utmify
 * 
 * @version 3.1.0 - RISE Protocol V3 - Modularizado
 * 
 * Funções para enviar eventos e conversões ao UTMify.
 * Utils extraídos para ./utils.ts
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { UTMifyOrderData, UTMifyResponse } from "./types";
import {
  extractUTMParameters,
  formatDateForUTMify,
  convertToCents,
} from "./utils";

const log = createLogger("UTMify");

// Re-export utils for backwards compatibility
export { extractUTMParameters, formatDateForUTMify, convertToCents, convertToReais } from "./utils";

/**
 * Envia conversão para a API do UTMify via Edge Function
 */
export async function sendUTMifyConversion(
  vendorId: string,
  orderData: UTMifyOrderData,
  eventType?: string,
  productId?: string
): Promise<UTMifyResponse> {
  try {
    log.debug("📡 Enviando conversão para vendor:", vendorId, "Evento:", eventType);

    interface UTMifyApiResponse {
      success: boolean;
      message?: string;
    }

    const { data, error } = await api.publicCall<UTMifyApiResponse>("utmify-conversion", {
      vendorId,
      orderData,
      eventType,
      productId,
    });

    if (error) {
      log.error("Erro ao invocar Edge Function:", error);
      return {
        success: false,
        message: "Erro ao invocar Edge Function",
        data: error,
      };
    }

    log.trace("Resposta da Edge Function:", data);

    if (!data?.success) {
      log.warn("Conversão não foi enviada:", data?.message);
      return {
        success: false,
        message: data?.message || "Conversão não foi enviada",
        data,
      };
    }

    log.info("✅ Conversão enviada com sucesso");
    return {
      success: true,
      message: "Conversão enviada com sucesso",
      data,
    };
  } catch (error: unknown) {
    log.error("Erro ao enviar conversão:", error);
    return {
      success: false,
      message: "Erro ao enviar conversão",
      data: error,
    };
  }
}

/**
 * Envia evento de visualização de página
 */
export async function trackPageView(
  vendorId: string,
  productId: string
): Promise<UTMifyResponse> {
  const utmParams = extractUTMParameters();

  const orderData: UTMifyOrderData = {
    orderId: `pageview-${Date.now()}`,
    status: "pageview",
    createdAt: formatDateForUTMify(new Date()),
    customer: {
      name: "Anonymous",
      email: "anonymous@example.com",
    },
    products: [
      {
        id: productId,
        name: "Product View",
        priceInCents: 0,
      },
    ],
    trackingParameters: utmParams,
    totalPriceInCents: 0,
  };

  return sendUTMifyConversion(vendorId, orderData, "pageview", productId);
}

/**
 * Envia evento de adição ao carrinho
 */
export async function trackAddToCart(
  vendorId: string,
  productId: string,
  price: number
): Promise<UTMifyResponse> {
  const utmParams = extractUTMParameters();

  const orderData: UTMifyOrderData = {
    orderId: `addtocart-${Date.now()}`,
    status: "addtocart",
    createdAt: formatDateForUTMify(new Date()),
    customer: {
      name: "Anonymous",
      email: "anonymous@example.com",
    },
    products: [
      {
        id: productId,
        name: "Product Added",
        priceInCents: convertToCents(price),
      },
    ],
    trackingParameters: utmParams,
    totalPriceInCents: convertToCents(price),
  };

  return sendUTMifyConversion(vendorId, orderData, "addtocart", productId);
}

/**
 * Envia evento de compra/conversão
 */
export async function trackPurchase(
  vendorId: string,
  orderData: UTMifyOrderData
): Promise<UTMifyResponse> {
  return sendUTMifyConversion(vendorId, orderData, "purchase");
}

/**
 * Envia evento de reembolso
 */
export async function trackRefund(
  vendorId: string,
  orderId: string,
  _reason?: string
): Promise<UTMifyResponse> {
  const orderData: UTMifyOrderData = {
    orderId,
    status: "refunded",
    createdAt: formatDateForUTMify(new Date()),
    refundedAt: formatDateForUTMify(new Date()),
    customer: {
      name: "Refund",
      email: "refund@example.com",
    },
    products: [],
    totalPriceInCents: 0,
  };

  return sendUTMifyConversion(vendorId, orderData, "refund");
}
