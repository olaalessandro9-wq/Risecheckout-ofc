/**
 * Google Ads Conversion Events
 * Módulo: src/integrations/tracking/google-ads/events
 * 
 * @version 1.0.0 - RISE Protocol V3 - Modularizado
 * 
 * Funções para enviar conversões de compra e lead ao Google Ads.
 */

import { createLogger } from "@/lib/logger";
import {
  GoogleAdsConversionData,
  GoogleAdsResponse,
  GoogleAdsConfig,
  GoogleAdsItem,
  GoogleAdsCustomer,
} from "../types";

/**
 * Obtém o label de conversão para um evento específico
 * 
 * @param config - Configuração do Google Ads
 * @param eventType - Tipo de evento (ex: "purchase")
 * @returns Label de conversão ou undefined
 */
export function getConversionLabel(
  config: GoogleAdsConfig,
  eventType?: string
): string | undefined {
  // Se tem event_labels e o eventType é especificado
  if (eventType && config.event_labels?.length) {
    const eventLabel = config.event_labels.find(
      (el) => el.eventType === eventType && el.enabled !== false
    );
    if (eventLabel?.label) {
      return eventLabel.label;
    }
  }

  // Fallback para label global
  return config.conversion_label;
}

/**
 * Valida se a configuração do Google Ads é válida
 */
export function isValidGoogleAdsConfig(config: GoogleAdsConfig): boolean {
  const log = createLogger("GoogleAds");
  
  if (!config.conversion_id) {
    log.warn("Conversion ID não configurado");
    return false;
  }

  const hasGlobalLabel = !!config.conversion_label;
  const hasEventLabels = config.event_labels?.some((el) => el.label);

  if (!hasGlobalLabel && !hasEventLabels) {
    log.warn("Nenhum label de conversão configurado");
    return false;
  }

  return true;
}

/**
 * Interface para parâmetros de conversão Google Ads
 */
interface GoogleAdsConversionParams {
  value: number;
  currency: string;
  transaction_id?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  items?: Array<{
    id: string;
    name: string;
    category?: string;
    quantity?: number;
    price?: number;
  }>;
}

/**
 * Envia conversão para o Google Ads via gtag
 */
export async function sendGoogleAdsConversion(
  config: GoogleAdsConfig,
  conversionData: GoogleAdsConversionData
): Promise<GoogleAdsResponse> {
  const log = createLogger("GoogleAds");
  
  try {
    if (!isValidGoogleAdsConfig(config)) {
      return {
        success: false,
        message: "Configuração do Google Ads inválida",
      };
    }

    if (typeof window === "undefined" || !window.gtag) {
      log.warn("gtag não está disponível");
      return {
        success: false,
        message: "gtag não está disponível",
      };
    }

    const conversionParams: GoogleAdsConversionParams = {
      value: conversionData.conversionValue,
      currency: conversionData.currencyCode,
      transaction_id: conversionData.orderId,
    };

    if (conversionData.items?.length) {
      conversionParams.items = conversionData.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
      }));
    }

    if (conversionData.customer) {
      const customer = conversionData.customer;
      if (customer.email_hash) conversionParams.email = customer.email_hash;
      if (customer.phone_hash) conversionParams.phone_number = customer.phone_hash;
      if (customer.address) conversionParams.address = customer.address;
      if (customer.city) conversionParams.city = customer.city;
      if (customer.state) conversionParams.state = customer.state;
      if (customer.zip_code) conversionParams.postal_code = customer.zip_code;
      if (customer.country) conversionParams.country = customer.country;
    }

    window.gtag("event", "conversion", {
      send_to: `${config.conversion_id}/${conversionData.conversionLabel}`,
      ...conversionParams,
    });

    log.info("Conversão enviada com sucesso", {
      conversion_id: config.conversion_id,
      label: conversionData.conversionLabel,
      value: conversionData.conversionValue,
      event_type: conversionData.eventType,
    });

    return {
      success: true,
      message: "Conversão enviada com sucesso",
    };
  } catch (error: unknown) {
    log.error("Erro ao enviar conversão", error);
    return {
      success: false,
      message: "Erro ao enviar conversão",
      data: error,
    };
  }
}

/**
 * Rastreia uma compra/conversão de compra
 */
export async function trackPurchase(
  config: GoogleAdsConfig,
  orderId: string,
  value: number,
  items?: GoogleAdsItem[],
  customer?: GoogleAdsCustomer
): Promise<GoogleAdsResponse> {
  const label = getConversionLabel(config, "purchase");

  if (!label) {
    return {
      success: false,
      message: "Label de conversão para 'purchase' não configurado",
    };
  }

  const conversionData: GoogleAdsConversionData = {
    conversionId: config.conversion_id,
    conversionTimestamp: Math.floor(Date.now() / 1000),
    conversionValue: value,
    currencyCode: "BRL",
    conversionLabel: label,
    orderId,
    items,
    customer,
    eventType: "purchase",
  };

  return sendGoogleAdsConversion(config, conversionData);
}

/**
 * Rastreia um lead
 */
export async function trackLead(
  config: GoogleAdsConfig,
  value: number = 0,
  customer?: GoogleAdsCustomer
): Promise<GoogleAdsResponse> {
  const label = getConversionLabel(config, "lead");

  if (!label) {
    return {
      success: false,
      message: "Label de conversão para 'lead' não configurado",
    };
  }

  const conversionData: GoogleAdsConversionData = {
    conversionId: config.conversion_id,
    conversionTimestamp: Math.floor(Date.now() / 1000),
    conversionValue: value,
    currencyCode: "BRL",
    conversionLabel: label,
    customer,
    eventType: "lead",
  };

  return sendGoogleAdsConversion(config, conversionData);
}
