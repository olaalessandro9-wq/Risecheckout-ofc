/**
 * Lógica de Eventos do TikTok Pixel
 * Módulo: src/integrations/tracking/tiktok
 * 
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

/**
 * Valida se a configuração do TikTok Pixel é válida
 * 
 * @param config - Configuração do TikTok Pixel
 * @returns true se válida, false caso contrário
 * 
 * @example
 * if (!isValidTikTokConfig(config)) {
 *   console.error("Configuração inválida");
 * }
 */
export function isValidTikTokConfig(config: TikTokConfig): boolean {
  // Precisa ter Pixel ID
  if (!config.pixel_id) {
    console.warn("[TikTok] Pixel ID não configurado");
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
 * 
 * @example
 * const result = await sendTikTokEvent(pixelId, "Purchase", eventData);
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
      console.warn("[TikTok] ttq não está disponível");
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

    console.log(
      `[TikTok] ✅ Evento ${eventName} enviado com sucesso`,
      {
        pixel_id: pixelId,
        value: eventData.value,
        event_type: eventData.event_type,
      }
    );

    return {
      success: true,
      message: `Evento ${eventName} enviado com sucesso`,
    };
  } catch (error) {
    console.error("[TikTok] Erro ao enviar evento:", error);
    return {
      success: false,
      message: "Erro ao enviar evento",
      data: error,
    };
  }
}

/**
 * Rastreia uma compra/conversão de compra
 * 
 * @param config - Configuração do TikTok Pixel
 * @param orderId - ID do pedido
 * @param value - Valor da compra em reais
 * @param items - Items da compra
 * @param customer - Dados do cliente (opcional)
 * @returns Resposta da operação
 * 
 * @example
 * await trackPurchase(config, orderId, 41.87, items, customer);
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
 * 
 * @param config - Configuração do TikTok Pixel
 * @param item - Produto visualizado
 * @returns Resposta da operação
 * 
 * @example
 * await trackViewContent(config, product);
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
 * 
 * @param config - Configuração do TikTok Pixel
 * @param items - Items adicionados
 * @param value - Valor total em reais
 * @returns Resposta da operação
 * 
 * @example
 * await trackAddToCart(config, items, 41.87);
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
 * 
 * @param config - Configuração do TikTok Pixel
 * @returns Resposta da operação
 * 
 * @example
 * await trackPageView(config);
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
 * 
 * @param config - Configuração do TikTok Pixel
 * @param customer - Dados do cliente
 * @returns Resposta da operação
 * 
 * @example
 * await trackLead(config, customer);
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
 * 
 * @param config - Configuração do TikTok Pixel
 * @param items - Items no carrinho
 * @param value - Valor total em reais
 * @returns Resposta da operação
 * 
 * @example
 * await trackInitiateCheckout(config, items, 41.87);
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
 * 
 * @param config - Configuração do TikTok Pixel
 * @param orderId - ID do pedido
 * @param value - Valor do reembolso em reais
 * @returns Resposta da operação
 * 
 * @example
 * await trackRefund(config, orderId, 41.87);
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
