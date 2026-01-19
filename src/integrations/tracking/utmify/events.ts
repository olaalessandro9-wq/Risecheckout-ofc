/**
 * Lógica de Eventos do UTMify
 * Módulo: src/integrations/tracking/utmify
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 * 
 * Este arquivo contém funções para enviar eventos e conversões ao UTMify.
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import {
  UTMifyOrderData,
  UTMifyResponse,
  UTMParameters,
} from "./types";

const log = createLogger("UTMify");

/**
 * Extrai parâmetros UTM da URL
 * 
 * @param url - URL para extrair parâmetros (padrão: location.href)
 * @returns Objeto com todos os parâmetros UTM
 * 
 * @example
 * const params = extractUTMParameters();
 * console.log(params.utm_source); // "google"
 */
export function extractUTMParameters(url?: string): UTMParameters {
  if (!url) {
    url = typeof window !== "undefined" ? window.location.href : "";
  }

  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    return {
      src: params.get("src"),
      sck: params.get("sck"),
      utm_source: params.get("utm_source"),
      utm_campaign: params.get("utm_campaign"),
      utm_medium: params.get("utm_medium"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
    };
  } catch (error: unknown) {
    log.warn("Erro ao extrair parâmetros UTM:", error);
    return {
      src: null,
      sck: null,
      utm_source: null,
      utm_campaign: null,
      utm_medium: null,
      utm_content: null,
      utm_term: null,
    };
  }
}

/**
 * Formata data para o formato UTC esperado pela UTMify
 * Formato: YYYY-MM-DD HH:MM:SS
 * 
 * @param date - Data como Date ou string
 * @returns String formatada no padrão UTC
 * 
 * @example
 * const formatted = formatDateForUTMify(new Date());
 * console.log(formatted); // "2025-11-29 14:30:45"
 */
export function formatDateForUTMify(date: Date | string): string {
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
 * Converte valor em reais para centavos
 * 
 * @param value - Valor em reais
 * @returns Valor em centavos (arredondado)
 * 
 * @example
 * const cents = convertToCents(41.87);
 * console.log(cents); // 4187
 */
export function convertToCents(value: number): number {
  return Math.round(value * 100);
}

/**
 * Converte valor em centavos para reais
 * 
 * @param cents - Valor em centavos
 * @returns Valor em reais
 * 
 * @example
 * const reais = convertToReais(4187);
 * console.log(reais); // 41.87
 */
export function convertToReais(cents: number): number {
  return Math.round(cents / 100 * 100) / 100;
}

/**
 * Envia conversão para a API do UTMify via Edge Function
 * 
 * @param vendorId - ID do vendedor
 * @param orderData - Dados completos do pedido
 * @param eventType - Tipo de evento (opcional)
 * @param productId - ID do produto (opcional)
 * 
 * @example
 * await sendUTMifyConversion(vendorId, orderData, "purchase");
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
 * 
 * @param vendorId - ID do vendedor
 * @param productId - ID do produto
 * 
 * @example
 * await trackPageView(vendorId, productId);
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
 * 
 * @param vendorId - ID do vendedor
 * @param productId - ID do produto
 * @param price - Preço do produto em reais
 * 
 * @example
 * await trackAddToCart(vendorId, productId, 29.90);
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
 * 
 * @param vendorId - ID do vendedor
 * @param orderData - Dados completos do pedido
 * 
 * @example
 * await trackPurchase(vendorId, orderData);
 */
export async function trackPurchase(
  vendorId: string,
  orderData: UTMifyOrderData
): Promise<UTMifyResponse> {
  return sendUTMifyConversion(vendorId, orderData, "purchase");
}

/**
 * Envia evento de reembolso
 * 
 * @param vendorId - ID do vendedor
 * @param orderId - ID do pedido
 * @param reason - Motivo do reembolso (opcional)
 * 
 * @example
 * await trackRefund(vendorId, orderId, "Customer request");
 */
export async function trackRefund(
  vendorId: string,
  orderId: string,
  reason?: string
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
