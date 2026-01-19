/**
 * Lógica de Disparo de Eventos do Facebook Pixel
 * Módulo: src/integrations/tracking/facebook
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 * Este arquivo contém funções para disparar eventos do Facebook Pixel
 * e helpers específicos para o checkout do RiseCheckout.
 */

import { FacebookEventParams } from "./types";
import type { TrackableProduct, TrackableBump } from "@/types/tracking.types";
import { createLogger } from "@/lib/logger";

const log = createLogger("Facebook");

/**
 * Verifica se o objeto fbq está disponível no window
 * Necessário para evitar erros em SSR ou quando o script não foi carregado
 * 
 * @returns true se fbq está disponível, false caso contrário
 */
const ensureFbq = (): boolean => {
  // Verificar se estamos no navegador (não SSR)
  if (typeof window === "undefined") {
    log.warn("SSR detectado, fbq não disponível");
    return false;
  }

  // Verificar se fbq foi inicializado
  if (!window.fbq) {
    log.warn("fbq não inicializado. Verifique se o Pixel foi carregado.");
    return false;
  }

  return true;
};

/**
 * Dispara um evento padrão do Facebook Pixel
 * 
 * @param eventName - Nome do evento (ex: 'ViewContent', 'Purchase')
 * @param params - Parâmetros do evento
 * 
 * @example
 * trackEvent('ViewContent', {
 *   content_name: 'Produto X',
 *   content_ids: ['123'],
 *   value: 99.90,
 *   currency: 'BRL'
 * });
 */
export const trackEvent = (eventName: string, params?: FacebookEventParams): void => {
  if (!ensureFbq()) return;

  try {
    log.info(`Disparando evento: ${eventName}`, params);
    window.fbq!("track", eventName, params);
  } catch (error: unknown) {
    log.error(`Erro ao disparar evento ${eventName}`, error);
  }
};

/**
 * Dispara um evento customizado do Facebook Pixel
 * 
 * @param eventName - Nome do evento customizado
 * @param params - Parâmetros do evento
 * 
 * @example
 * trackCustomEvent('BumpAdded', {
 *   bump_id: '456',
 *   bump_name: 'Pack Exclusivo'
 * });
 */
export const trackCustomEvent = (eventName: string, params?: FacebookEventParams): void => {
  if (!ensureFbq()) return;

  try {
    log.info(`Disparando evento customizado: ${eventName}`, params);
    window.fbq!("trackCustom", eventName, params);
  } catch (error: unknown) {
    log.error(`Erro ao disparar evento customizado ${eventName}`, error);
  }
};

/**
 * Dispara evento ViewContent
 * Quando um usuário visualiza um produto
 * 
 * @param product - Objeto do produto com id, name, price
 */
export const trackViewContent = (product: TrackableProduct): void => {
  if (!product) {
    log.warn("Produto inválido para trackViewContent");
    return;
  }

  trackEvent("ViewContent", {
    content_name: product.name || "Produto Desconhecido",
    content_ids: [product.id],
    content_type: "product",
    value: Number(product.price) || 0,
    currency: "BRL",
  });
};

/**
 * Dispara evento InitiateCheckout
 * Quando um usuário inicia o processo de checkout
 * 
 * @param product - Objeto do produto principal
 * @param totalValue - Valor total do pedido (incluindo bumps)
 * @param itemsCount - Quantidade total de itens (produto + bumps)
 */
export const trackInitiateCheckout = (
  product: TrackableProduct,
  totalValue: number,
  itemsCount: number
): void => {
  if (!product) {
    log.warn("Produto inválido para trackInitiateCheckout");
    return;
  }

  trackEvent("InitiateCheckout", {
    content_name: product.name || "Produto Desconhecido",
    content_ids: [product.id],
    value: totalValue,
    currency: "BRL",
    num_items: itemsCount,
  });
};

/**
 * Dispara evento Purchase
 * Quando um pagamento é confirmado
 * 
 * @param orderId - ID único do pedido
 * @param valueInCents - Valor em centavos (ex: 4187 para R$ 41,87)
 * @param product - Objeto do produto principal
 * @param additionalParams - Parâmetros adicionais (opcional)
 */
export const trackPurchase = (
  orderId: string,
  valueInCents: number,
  product: TrackableProduct,
  additionalParams?: FacebookEventParams
): void => {
  if (!orderId || !product) {
    log.warn("Dados inválidos para trackPurchase");
    return;
  }

  // Converter centavos para reais
  const valueInReals = valueInCents / 100;

  trackEvent("Purchase", {
    content_name: product.name || "Produto Desconhecido",
    content_ids: [product.id],
    value: valueInReals,
    currency: "BRL",
    transaction_id: orderId,
    ...additionalParams,
  });
};

/**
 * Dispara evento AddToCart
 * Quando um bump é adicionado ao carrinho
 * 
 * @param bump - Objeto do bump/produto adicional
 * @param cartValue - Valor total do carrinho após adicionar
 */
export const trackAddToCart = (bump: TrackableBump, cartValue: number): void => {
  if (!bump) {
    log.warn("Bump inválido para trackAddToCart");
    return;
  }

  trackEvent("AddToCart", {
    content_name: bump.name || "Produto Adicional",
    content_ids: [bump.id],
    value: cartValue,
    currency: "BRL",
  });
};

/**
 * Dispara evento CompleteRegistration
 * Quando o formulário de checkout é preenchido
 * 
 * @param email - Email do cliente
 * @param phone - Telefone do cliente (opcional)
 */
export const trackCompleteRegistration = (email: string, phone?: string): void => {
  if (!email) {
    log.warn("Email inválido para trackCompleteRegistration");
    return;
  }

  trackEvent("CompleteRegistration", {
    content_name: "Checkout Form",
    ...(phone && { phone }),
  });
};

/**
 * Dispara evento PageView
 * Quando a página de checkout é carregada
 */
export const trackPageView = (): void => {
  trackEvent("PageView");
};

/**
 * Dispara evento Lead
 * Quando um lead é capturado (ex: email capturado)
 * 
 * @param email - Email do lead
 * @param source - Fonte do lead (opcional)
 */
export const trackLead = (email: string, source?: string): void => {
  if (!email) {
    log.warn("Email inválido para trackLead");
    return;
  }

  trackEvent("Lead", {
    content_name: "Lead Capturado",
    ...(source && { source }),
  });
};
