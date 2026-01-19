/**
 * Lógica de Eventos do Kwai Pixel
 * Módulo: src/integrations/tracking/kwai
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 */

import {
  KwaiConversionData,
  KwaiResponse,
  KwaiConfig,
  KwaiItem,
  KwaiCustomer,
} from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("Kwai");

export function isValidKwaiConfig(config: KwaiConfig): boolean {
  if (!config.pixel_id) {
    log.warn("Pixel ID não configurado");
    return false;
  }
  return true;
}

export async function sendKwaiEvent(
  pixelId: string,
  eventName: string,
  eventData: Partial<KwaiConversionData>
): Promise<KwaiResponse> {
  try {
    if (!pixelId) {
      return { success: false, message: "Pixel ID não fornecido" };
    }

    if (typeof window === "undefined" || !window.kwaiq) {
      log.warn("kwaiq não está disponível");
      return { success: false, message: "kwaiq não está disponível" };
    }

    const eventParams: Record<string, unknown> = {
      event_id: eventData.event_id || `${Date.now()}_${Math.random()}`,
      timestamp: eventData.timestamp || Date.now(),
      value: eventData.value,
      currency: eventData.currency || "BRL",
    };

    if (eventData.customer) {
      const customer = eventData.customer;
      if (customer.email) eventParams.email = customer.email;
      if (customer.phone) eventParams.phone_number = customer.phone;
      if (customer.name) eventParams.user_name = customer.name;
    }

    if (eventData.items?.length) {
      eventParams.contents = eventData.items.map((item) => ({
        content_id: item.id,
        content_name: item.name,
        content_category: item.category,
        quantity: item.quantity,
        price: item.price,
      }));
    }

    if (typeof window.kwaiq === "function") {
      window.kwaiq(eventName, eventParams);
    } else if (window.kwaiq && typeof (window.kwaiq as { track?: (name: string, params: Record<string, unknown>) => void }).track === "function") {
      (window.kwaiq as { track: (name: string, params: Record<string, unknown>) => void }).track(eventName, eventParams);
    } else {
      log.warn("Método de rastreamento não encontrado");
      return { success: false, message: "Método de rastreamento não encontrado" };
    }

    log.info(`Evento ${eventName} enviado com sucesso`, {
      pixel_id: pixelId,
      value: eventData.value,
      event_type: eventData.event_type,
    });

    return { success: true, message: `Evento ${eventName} enviado com sucesso` };
  } catch (error: unknown) {
    log.error("Erro ao enviar evento", error);
    return { success: false, message: "Erro ao enviar evento", data: error };
  }
}

export async function trackPurchase(config: KwaiConfig, orderId: string, value: number, items?: KwaiItem[], customer?: KwaiCustomer): Promise<KwaiResponse> {
  const conversionData: KwaiConversionData = { event_id: `purchase_${orderId}`, timestamp: Date.now(), value, currency: "BRL", order_id: orderId, items, customer, event_type: "PlaceOrder" };
  return sendKwaiEvent(config.pixel_id, "PlaceOrder", conversionData);
}

export async function trackViewContent(config: KwaiConfig, item: KwaiItem): Promise<KwaiResponse> {
  const conversionData: KwaiConversionData = { event_id: `view_${item.id}`, timestamp: Date.now(), value: item.price, currency: "BRL", items: [item], event_type: "ViewContent" };
  return sendKwaiEvent(config.pixel_id, "ViewContent", conversionData);
}

export async function trackAddToCart(config: KwaiConfig, items: KwaiItem[], value: number): Promise<KwaiResponse> {
  const conversionData: KwaiConversionData = { event_id: `add_to_cart_${Date.now()}`, timestamp: Date.now(), value, currency: "BRL", items, event_type: "AddToCart" };
  return sendKwaiEvent(config.pixel_id, "AddToCart", conversionData);
}

export async function trackPageView(config: KwaiConfig): Promise<KwaiResponse> {
  const conversionData: KwaiConversionData = { event_id: `pageview_${Date.now()}`, timestamp: Date.now(), value: 0, currency: "BRL", event_type: "PageView" };
  return sendKwaiEvent(config.pixel_id, "PageView", conversionData);
}

export async function trackLead(config: KwaiConfig, customer?: KwaiCustomer): Promise<KwaiResponse> {
  const conversionData: KwaiConversionData = { event_id: `lead_${Date.now()}`, timestamp: Date.now(), value: 0, currency: "BRL", customer, event_type: "Contact" };
  return sendKwaiEvent(config.pixel_id, "Contact", conversionData);
}

export async function trackInitiateCheckout(config: KwaiConfig, items: KwaiItem[], value: number): Promise<KwaiResponse> {
  const conversionData: KwaiConversionData = { event_id: `checkout_${Date.now()}`, timestamp: Date.now(), value, currency: "BRL", items, event_type: "InitiateCheckout" };
  return sendKwaiEvent(config.pixel_id, "InitiateCheckout", conversionData);
}

export async function trackRefund(config: KwaiConfig, orderId: string, value: number): Promise<KwaiResponse> {
  const conversionData: KwaiConversionData = { event_id: `refund_${orderId}`, timestamp: Date.now(), value, currency: "BRL", order_id: orderId, event_type: "Refund" };
  return sendKwaiEvent(config.pixel_id, "Refund", conversionData);
}
