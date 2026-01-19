/**
 * UTMify Helper
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("UTMifyHelper");

interface UTMifyOrderData {
  orderId: string;
  paymentMethod?: string;
  status: string;
  createdAt: string;
  approvedDate?: string | null;
  refundedAt?: string | null;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    document?: string | null;
    country?: string;
    ip?: string;
  };
  products: Array<{
    id: string;
    name: string;
    planId?: string | null;
    planName?: string | null;
    quantity?: number;
    priceInCents: number;
  }>;
  trackingParameters?: {
    src?: string | null;
    sck?: string | null;
    utm_source?: string | null;
    utm_campaign?: string | null;
    utm_medium?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
  };
  commission?: {
    totalPriceInCents?: number;
    gatewayFeeInCents?: number;
    userCommissionInCents?: number;
    currency?: string;
  };
  totalPriceInCents: number;
  isTest?: boolean;
}

interface UTMifyConversionResponse {
  success: boolean;
  message?: string;
}

/**
 * Envia conversão para a API da UTMify via Edge Function
 */
export async function sendUTMifyConversion(
  vendorId: string,
  orderData: UTMifyOrderData,
  eventType?: string,
  productId?: string
): Promise<void> {
  try {
    log.debug("Enviando conversão para vendor:", vendorId, "Evento:", eventType, "Produto:", productId);

    const { data, error } = await api.publicCall<UTMifyConversionResponse>("utmify-conversion", {
      vendorId,
      orderData,
      eventType,
      productId,
    });

    if (error) {
      log.error("Erro ao invocar Edge Function:", error);
      throw error;
    }

    log.trace("Resposta da Edge Function:", data);

    if (!data?.success) {
      log.warn("Conversão não foi enviada:", data?.message);
    } else {
      log.info("Conversão enviada com sucesso");
    }
  } catch (error: unknown) {
    log.error("Erro ao enviar conversão:", error);
    // Não propagar o erro para não interromper o fluxo de checkout
  }
}

/**
 * Extrai parâmetros UTM da URL
 */
export function extractUTMParameters(url?: string): {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
} {
  if (!url) {
    url = window.location.href;
  }

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
}

/**
 * Formata data para o formato UTC esperado pela UTMify (YYYY-MM-DD HH:MM:SS)
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
 */
export function convertToCents(value: number): number {
  return Math.round(value * 100);
}
