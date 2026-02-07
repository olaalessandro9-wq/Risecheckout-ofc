/**
 * Lógica de Disparo de Eventos do Facebook Pixel
 * Módulo: src/integrations/tracking/facebook
 * 
 * @version 3.0.0 - RISE Protocol V3 - Event ID Deduplication
 * 
 * All tracking functions now generate and pass an eventID to fbq()
 * for Pixel+CAPI deduplication. The same event_id is generated
 * deterministically on the backend for Purchase events.
 */

import { FacebookEventParams } from "./types";
import type { TrackableProduct, TrackableBump } from "@/types/tracking.types";
import { createLogger } from "@/lib/logger";
import {
  generatePurchaseEventId,
  generateViewContentEventId,
  generateInitiateCheckoutEventId,
  generateAddToCartEventId,
  generateGenericEventId,
} from "@/lib/tracking/event-id";

const log = createLogger("Facebook");

/**
 * Verifica se o objeto fbq está disponível no window
 */
const ensureFbq = (): boolean => {
  if (typeof window === "undefined") {
    log.warn("SSR detectado, fbq não disponível");
    return false;
  }

  if (!window.fbq) {
    log.warn("fbq não inicializado. Verifique se o Pixel foi carregado.");
    return false;
  }

  return true;
};

/**
 * Dispara um evento padrão do Facebook Pixel com eventID para deduplicação.
 * 
 * @param eventName - Nome do evento (ex: 'ViewContent', 'Purchase')
 * @param params - Parâmetros do evento
 * @param eventId - Event ID para deduplicação Pixel+CAPI (opcional)
 */
export const trackEvent = (
  eventName: string,
  params?: FacebookEventParams,
  eventId?: string
): void => {
  if (!ensureFbq()) return;

  try {
    const options = eventId ? { eventID: eventId } : undefined;
    log.info(`Disparando evento: ${eventName}`, { ...params, eventId });
    window.fbq!("track", eventName, params, options);
  } catch (error: unknown) {
    log.error(`Erro ao disparar evento ${eventName}`, error);
  }
};

/**
 * Dispara um evento customizado do Facebook Pixel com eventID.
 * 
 * @param eventName - Nome do evento customizado
 * @param params - Parâmetros do evento
 * @param eventId - Event ID para deduplicação (opcional)
 */
export const trackCustomEvent = (
  eventName: string,
  params?: FacebookEventParams,
  eventId?: string
): void => {
  if (!ensureFbq()) return;

  try {
    const options = eventId ? { eventID: eventId } : undefined;
    log.info(`Disparando evento customizado: ${eventName}`, { ...params, eventId });
    window.fbq!("trackCustom", eventName, params, options);
  } catch (error: unknown) {
    log.error(`Erro ao disparar evento customizado ${eventName}`, error);
  }
};

/**
 * Dispara evento ViewContent com eventID.
 * 
 * @param product - Objeto do produto com id, name, price
 * @returns Event ID gerado (para uso em CAPI se necessário)
 */
export const trackViewContent = (product: TrackableProduct): string | null => {
  if (!product) {
    log.warn("Produto inválido para trackViewContent");
    return null;
  }

  const eventId = generateViewContentEventId(product.id);

  trackEvent("ViewContent", {
    content_name: product.name || "Produto Desconhecido",
    content_ids: [product.id],
    content_type: "product",
    value: Number(product.price) || 0,
    currency: "BRL",
  }, eventId);

  return eventId;
};

/**
 * Dispara evento InitiateCheckout com eventID.
 * 
 * @param product - Objeto do produto principal
 * @param totalValue - Valor total do pedido
 * @param itemsCount - Quantidade total de itens
 * @returns Event ID gerado
 */
export const trackInitiateCheckout = (
  product: TrackableProduct,
  totalValue: number,
  itemsCount: number
): string | null => {
  if (!product) {
    log.warn("Produto inválido para trackInitiateCheckout");
    return null;
  }

  const eventId = generateInitiateCheckoutEventId(product.id);

  trackEvent("InitiateCheckout", {
    content_name: product.name || "Produto Desconhecido",
    content_ids: [product.id],
    value: totalValue,
    currency: "BRL",
    num_items: itemsCount,
  }, eventId);

  return eventId;
};

/**
 * Dispara evento Purchase com eventID DETERMINÍSTICO.
 * O event_id `purchase_{orderId}` é o MESMO gerado pelo backend,
 * permitindo deduplicação automática pelo Facebook.
 * 
 * @param orderId - ID único do pedido
 * @param valueInCents - Valor em centavos
 * @param product - Objeto do produto principal
 * @param additionalParams - Parâmetros adicionais (opcional)
 * @returns Event ID determinístico (purchase_{orderId})
 */
export const trackPurchase = (
  orderId: string,
  valueInCents: number,
  product: TrackableProduct,
  additionalParams?: FacebookEventParams
): string | null => {
  if (!orderId || !product) {
    log.warn("Dados inválidos para trackPurchase");
    return null;
  }

  const eventId = generatePurchaseEventId(orderId);
  const valueInReals = valueInCents / 100;

  trackEvent("Purchase", {
    content_name: product.name || "Produto Desconhecido",
    content_ids: [product.id],
    value: valueInReals,
    currency: "BRL",
    transaction_id: orderId,
    ...additionalParams,
  }, eventId);

  return eventId;
};

/**
 * Dispara evento AddToCart com eventID.
 * 
 * @param bump - Objeto do bump/produto adicional
 * @param cartValue - Valor total do carrinho
 * @returns Event ID gerado
 */
export const trackAddToCart = (bump: TrackableBump, cartValue: number): string | null => {
  if (!bump) {
    log.warn("Bump inválido para trackAddToCart");
    return null;
  }

  const eventId = generateAddToCartEventId(bump.id);

  trackEvent("AddToCart", {
    content_name: bump.name || "Produto Adicional",
    content_ids: [bump.id],
    value: cartValue,
    currency: "BRL",
  }, eventId);

  return eventId;
};

/**
 * Dispara evento CompleteRegistration com eventID.
 * 
 * @param email - Email do cliente
 * @param phone - Telefone do cliente (opcional)
 * @returns Event ID gerado
 */
export const trackCompleteRegistration = (email: string, phone?: string): string | null => {
  if (!email) {
    log.warn("Email inválido para trackCompleteRegistration");
    return null;
  }

  const eventId = generateGenericEventId("CompleteRegistration");

  trackEvent("CompleteRegistration", {
    content_name: "Checkout Form",
    ...(phone && { phone }),
  }, eventId);

  return eventId;
};

/**
 * Dispara evento PageView com eventID.
 */
export const trackPageView = (): void => {
  trackEvent("PageView");
};

/**
 * Dispara evento Lead com eventID.
 * 
 * @param email - Email do lead
 * @param source - Fonte do lead (opcional)
 * @returns Event ID gerado
 */
export const trackLead = (email: string, source?: string): string | null => {
  if (!email) {
    log.warn("Email inválido para trackLead");
    return null;
  }

  const eventId = generateGenericEventId("Lead");

  trackEvent("Lead", {
    content_name: "Lead Capturado",
    ...(source && { source }),
  }, eventId);

  return eventId;
};
