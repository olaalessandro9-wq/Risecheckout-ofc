/**
 * Lógica de Eventos do Google Ads
 * Módulo: src/integrations/tracking/google-ads
 * 
 * Este arquivo contém funções para enviar eventos e conversões ao Google Ads.
 */

import {
  GoogleAdsConversionData,
  GoogleAdsResponse,
  GoogleAdsConfig,
  GoogleAdsItem,
  GoogleAdsCustomer,
} from "./types";

/**
 * Obtém o label de conversão para um evento específico
 * 
 * @param config - Configuração do Google Ads
 * @param eventType - Tipo de evento (ex: "purchase")
 * @returns Label de conversão ou undefined
 * 
 * @example
 * const label = getConversionLabel(config, "purchase");
 * // Retorna: "Kj2nCNOytGMQ_4..."
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
 * 
 * @param config - Configuração do Google Ads
 * @returns true se válida, false caso contrário
 * 
 * @example
 * if (!isValidGoogleAdsConfig(config)) {
 *   console.error("Configuração inválida");
 * }
 */
export function isValidGoogleAdsConfig(config: GoogleAdsConfig): boolean {
  // Precisa ter Conversion ID
  if (!config.conversion_id) {
    console.warn("[Google Ads] Conversion ID não configurado");
    return false;
  }

  // Precisa ter pelo menos um label (global ou por evento)
  const hasGlobalLabel = !!config.conversion_label;
  const hasEventLabels = config.event_labels?.some((el) => el.label);

  if (!hasGlobalLabel && !hasEventLabels) {
    console.warn("[Google Ads] Nenhum label de conversão configurado");
    return false;
  }

  return true;
}

/**
 * Envia conversão para o Google Ads via gtag
 * 
 * @param config - Configuração do Google Ads
 * @param conversionData - Dados da conversão
 * @returns Resposta da operação
 * 
 * @example
 * const result = await sendGoogleAdsConversion(config, conversionData);
 */
export async function sendGoogleAdsConversion(
  config: GoogleAdsConfig,
  conversionData: GoogleAdsConversionData
): Promise<GoogleAdsResponse> {
  try {
    // Validação
    if (!isValidGoogleAdsConfig(config)) {
      return {
        success: false,
        message: "Configuração do Google Ads inválida",
      };
    }

    // Verificar se gtag está disponível
    if (typeof window === "undefined" || !window.gtag) {
      console.warn("[Google Ads] gtag não está disponível");
      return {
        success: false,
        message: "gtag não está disponível",
      };
    }

    // Interface para parâmetros de conversão Google Ads
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

    // Preparar dados para gtag
    const conversionParams: GoogleAdsConversionParams = {
      value: conversionData.conversionValue,
      currency: conversionData.currencyCode,
      transaction_id: conversionData.orderId,
    };

    // Adicionar items se disponível
    if (conversionData.items?.length) {
      conversionParams.items = conversionData.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
      }));
    }

    // Adicionar dados do cliente se disponível (para remarketing)
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

    // Enviar conversão via gtag
    window.gtag("event", "conversion", {
      send_to: `${config.conversion_id}/${conversionData.conversionLabel}`,
      ...conversionParams,
    });

    console.log(
      `[Google Ads] ✅ Conversão enviada com sucesso`,
      {
        conversion_id: config.conversion_id,
        label: conversionData.conversionLabel,
        value: conversionData.conversionValue,
        event_type: conversionData.eventType,
      }
    );

    return {
      success: true,
      message: "Conversão enviada com sucesso",
    };
  } catch (error) {
    console.error("[Google Ads] Erro ao enviar conversão:", error);
    return {
      success: false,
      message: "Erro ao enviar conversão",
      data: error,
    };
  }
}

/**
 * Rastreia uma compra/conversão de compra
 * 
 * @param config - Configuração do Google Ads
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
 * 
 * @param config - Configuração do Google Ads
 * @param value - Valor estimado do lead em reais
 * @param customer - Dados do cliente (opcional)
 * @returns Resposta da operação
 * 
 * @example
 * await trackLead(config, 0, customer);
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

/**
 * Rastreia uma visualização de página
 * 
 * @param config - Configuração do Google Ads
 * @returns Resposta da operação
 * 
 * @example
 * await trackPageView(config);
 */
export async function trackPageView(
  config: GoogleAdsConfig
): Promise<GoogleAdsResponse> {
  try {
    if (typeof window === "undefined" || !window.gtag) {
      return {
        success: false,
        message: "gtag não está disponível",
      };
    }

    // PageView é rastreado automaticamente pelo gtag
    // Mas podemos enviar um evento customizado se necessário
    window.gtag("event", "page_view", {
      send_to: config.conversion_id,
    });

    console.log("[Google Ads] ✅ PageView rastreado");

    return {
      success: true,
      message: "PageView rastreado com sucesso",
    };
  } catch (error) {
    console.error("[Google Ads] Erro ao rastrear PageView:", error);
    return {
      success: false,
      message: "Erro ao rastrear PageView",
      data: error,
    };
  }
}

/**
 * Rastreia adição ao carrinho
 * 
 * @param config - Configuração do Google Ads
 * @param items - Items adicionados
 * @param value - Valor total em reais
 * @returns Resposta da operação
 * 
 * @example
 * await trackAddToCart(config, items, 41.87);
 */
export async function trackAddToCart(
  config: GoogleAdsConfig,
  items: GoogleAdsItem[],
  value: number
): Promise<GoogleAdsResponse> {
  try {
    if (typeof window === "undefined" || !window.gtag) {
      return {
        success: false,
        message: "gtag não está disponível",
      };
    }

    window.gtag("event", "add_to_cart", {
      send_to: config.conversion_id,
      value,
      currency: "BRL",
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    console.log("[Google Ads] ✅ AddToCart rastreado");

    return {
      success: true,
      message: "AddToCart rastreado com sucesso",
    };
  } catch (error) {
    console.error("[Google Ads] Erro ao rastrear AddToCart:", error);
    return {
      success: false,
      message: "Erro ao rastrear AddToCart",
      data: error,
    };
  }
}

/**
 * Rastreia visualização de produto
 * 
 * @param config - Configuração do Google Ads
 * @param item - Produto visualizado
 * @returns Resposta da operação
 * 
 * @example
 * await trackViewItem(config, product);
 */
export async function trackViewItem(
  config: GoogleAdsConfig,
  item: GoogleAdsItem
): Promise<GoogleAdsResponse> {
  try {
    if (typeof window === "undefined" || !window.gtag) {
      return {
        success: false,
        message: "gtag não está disponível",
      };
    }

    window.gtag("event", "view_item", {
      send_to: config.conversion_id,
      items: [
        {
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
        },
      ],
    });

    console.log("[Google Ads] ✅ ViewItem rastreado");

    return {
      success: true,
      message: "ViewItem rastreado com sucesso",
    };
  } catch (error) {
    console.error("[Google Ads] Erro ao rastrear ViewItem:", error);
    return {
      success: false,
      message: "Erro ao rastrear ViewItem",
      data: error,
    };
  }
}
