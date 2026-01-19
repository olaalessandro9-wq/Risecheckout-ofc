/**
 * Lógica de Eventos do TikTok Pixel
 * Módulo: src/integrations/tracking/tiktok
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 * Este arquivo contém funções para enviar eventos ao TikTok Pixel.
 * TikTok usa a biblioteca ttq (em vez de fbq do Facebook).
 */

import {
  TikTokConversionData,
  TikTokResponse,
  TikTokConfig,
  TikTokItem,
  TikTokCustomer,
} from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("TikTok");

/**
 * Valida se a configuração do TikTok Pixel é válida
 * 
 * @param config - Configuração do TikTok Pixel
 * @returns true se válida, false caso contrário
 */
export function isValidTikTokConfig(config: TikTokConfig): boolean {
  // Precisa ter Pixel ID
  if (!config.pixel_id) {
    log.warn("Pixel ID não configurado");
    return false;
  }

  return true;
}

/**
 * Envia evento para o TikTok Pixel via ttq
 * 
 * @param pixelId - ID do Pixel do TikTok
 * @param eventName - Nome do evento (ex: "Purchase", "ViewContent")
 * @param eventData - Dados do evento
 * @returns Resposta da operação
 */
export async function sendTikTokEvent(
  pixelId: string,
  eventName: string,
  eventData: Partial<TikTokConversionData>
): Promise<TikTokResponse> {
  try {
    // Validação
    if (!pixelId) {
      return {
        success: false,
        message: "Pixel ID não fornecido",
      };
    }

    // Verificar se ttq está disponível
    if (typeof window === "undefined" || !window.ttq) {
      log.warn("ttq não está disponível");
      return {
        success: false,
        message: "ttq não está disponível",
      };
    }

    // Preparar dados para ttq
    const eventParams: Record<string, unknown> = {
      event_id: eventData.event_id || `${Date.now()}_${Math.random()}`,
      timestamp: eventData.timestamp || Date.now(),
      value: eventData.value,
      currency: eventData.currency || "BRL",
    };

    // Adicionar dados do cliente se disponível
    if (eventData.customer) {
      const customer = eventData.customer;
      if (customer.email) eventParams.email = customer.email;
      if (customer.phone) eventParams.phone_number = customer.phone;
      if (customer.name) eventParams.user_name = customer.name;
    }

    // Adicionar items se disponível
    if (eventData.items?.length) {
      eventParams.contents = eventData.items.map((item) => ({
        content_id: item.id,
        content_name: item.name,
        content_category: item.category,
        quantity: item.quantity,
        price: item.price,
      }));
    }

    // Enviar evento via ttq
    window.ttq.track(eventName, eventParams);

    log.info(`Evento ${eventName} enviado com sucesso`, {
      pixel_id: pixelId,
      value: eventData.value,
      event_type: eventData.event_type,
    });

    return {
      success: true,
      message: `Evento ${eventName} enviado com sucesso`,
    };
  } catch (error: unknown) {
    log.error("Erro ao enviar evento", error);
    return {
      success: false,
      message: "Erro ao enviar evento",
      data: error,
    };
  }
}

/**
 * Rastreia uma compra/conversão de compra
 */
export async function trackPurchase(
  config: TikTokConfig,
  orderId: string,
  value: number,
  items?: TikTokItem[],
  customer?: TikTokCustomer
): Promise<TikTokResponse> {
  const conversionData: TikTokConversionData = {
    event_id: `purchase_${orderId}`,
    timestamp: Date.now(),
    value,
    currency: "BRL",
    order_id: orderId,
    items,
    customer,
    event_type: "Purchase",
  };

  return sendTikTokEvent(config.pixel_id, "Purchase", conversionData);
}

/**
 * Rastreia uma visualização de conteúdo/produto
 */
export async function trackViewContent(
  config: TikTokConfig,
  item: TikTokItem
): Promise<TikTokResponse> {
  const conversionData: TikTokConversionData = {
    event_id: `view_${item.id}`,
    timestamp: Date.now(),
    value: item.price,
    currency: "BRL",
    items: [item],
    event_type: "ViewContent",
  };

  return sendTikTokEvent(config.pixel_id, "ViewContent", conversionData);
}

/**
 * Rastreia adição ao carrinho
 */
export async function trackAddToCart(
  config: TikTokConfig,
  items: TikTokItem[],
  value: number
): Promise<TikTokResponse> {
  const conversionData: TikTokConversionData = {
    event_id: `add_to_cart_${Date.now()}`,
    timestamp: Date.now(),
    value,
    currency: "BRL",
    items,
    event_type: "AddToCart",
  };

  return sendTikTokEvent(config.pixel_id, "AddToCart", conversionData);
}

/**
 * Rastreia visualização de página
 */
export async function trackPageView(
  config: TikTokConfig
): Promise<TikTokResponse> {
  const conversionData: TikTokConversionData = {
    event_id: `pageview_${Date.now()}`,
    timestamp: Date.now(),
    value: 0,
    currency: "BRL",
    event_type: "PageView",
  };

  return sendTikTokEvent(config.pixel_id, "PageView", conversionData);
}

/**
 * Rastreia um lead
 */
export async function trackLead(
  config: TikTokConfig,
  customer?: TikTokCustomer
): Promise<TikTokResponse> {
  const conversionData: TikTokConversionData = {
    event_id: `lead_${Date.now()}`,
    timestamp: Date.now(),
    value: 0,
    currency: "BRL",
    customer,
    event_type: "Contact",
  };

  return sendTikTokEvent(config.pixel_id, "Contact", conversionData);
}

/**
 * Rastreia um checkout iniciado
 */
export async function trackInitiateCheckout(
  config: TikTokConfig,
  items: TikTokItem[],
  value: number
): Promise<TikTokResponse> {
  const conversionData: TikTokConversionData = {
    event_id: `checkout_${Date.now()}`,
    timestamp: Date.now(),
    value,
    currency: "BRL",
    items,
    event_type: "InitiateCheckout",
  };

  return sendTikTokEvent(config.pixel_id, "InitiateCheckout", conversionData);
}

/**
 * Rastreia um reembolso
 */
export async function trackRefund(
  config: TikTokConfig,
  orderId: string,
  value: number
): Promise<TikTokResponse> {
  const conversionData: TikTokConversionData = {
    event_id: `refund_${orderId}`,
    timestamp: Date.now(),
    value,
    currency: "BRL",
    order_id: orderId,
    event_type: "Refund",
  };

  return sendTikTokEvent(config.pixel_id, "Refund", conversionData);
}
