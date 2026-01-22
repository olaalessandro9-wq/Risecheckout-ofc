/**
 * Barrel Export - Google Ads Events
 * Módulo: src/integrations/tracking/google-ads/events
 * 
 * @version 1.0.0 - RISE Protocol V3 - Modularizado
 * 
 * Re-exporta todas as funções de eventos para manter compatibilidade.
 */

// Conversions (purchase, lead)
export {
  getConversionLabel,
  isValidGoogleAdsConfig,
  sendGoogleAdsConversion,
  trackPurchase,
  trackLead,
} from "./conversion";

// Ecommerce (pageview, add to cart, view item)
export {
  trackPageView,
  trackAddToCart,
  trackViewItem,
} from "./ecommerce";
