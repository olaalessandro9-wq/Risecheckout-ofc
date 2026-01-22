/**
 * Google Ads Ecommerce Events
 * Módulo: src/integrations/tracking/google-ads/events
 * 
 * @version 1.0.0 - RISE Protocol V3 - Modularizado
 * 
 * Funções para rastrear eventos de e-commerce (pageview, add to cart, view item).
 */

import { createLogger } from "@/lib/logger";
import {
  GoogleAdsResponse,
  GoogleAdsConfig,
  GoogleAdsItem,
} from "../types";

/**
 * Rastreia uma visualização de página
 */
export async function trackPageView(
  config: GoogleAdsConfig
): Promise<GoogleAdsResponse> {
  const log = createLogger("GoogleAds");
  
  try {
    if (typeof window === "undefined" || !window.gtag) {
      return {
        success: false,
        message: "gtag não está disponível",
      };
    }

    window.gtag("event", "page_view", {
      send_to: config.conversion_id,
    });

    log.debug("PageView rastreado");

    return {
      success: true,
      message: "PageView rastreado com sucesso",
    };
  } catch (error: unknown) {
    log.error("Erro ao rastrear PageView", error);
    return {
      success: false,
      message: "Erro ao rastrear PageView",
      data: error,
    };
  }
}

/**
 * Rastreia adição ao carrinho
 */
export async function trackAddToCart(
  config: GoogleAdsConfig,
  items: GoogleAdsItem[],
  value: number
): Promise<GoogleAdsResponse> {
  const log = createLogger("GoogleAds");
  
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

    log.debug("AddToCart rastreado");

    return {
      success: true,
      message: "AddToCart rastreado com sucesso",
    };
  } catch (error: unknown) {
    log.error("Erro ao rastrear AddToCart", error);
    return {
      success: false,
      message: "Erro ao rastrear AddToCart",
      data: error,
    };
  }
}

/**
 * Rastreia visualização de produto
 */
export async function trackViewItem(
  config: GoogleAdsConfig,
  item: GoogleAdsItem
): Promise<GoogleAdsResponse> {
  const log = createLogger("GoogleAds");
  
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

    log.debug("ViewItem rastreado");

    return {
      success: true,
      message: "ViewItem rastreado com sucesso",
    };
  } catch (error: unknown) {
    log.error("Erro ao rastrear ViewItem", error);
    return {
      success: false,
      message: "Erro ao rastrear ViewItem",
      data: error,
    };
  }
}
