/**
 * Tipos para Tracking e Analytics
 * Módulo: src/types/tracking.types.ts
 * 
 * Tipos para eventos de tracking (Facebook, TikTok, Google Ads, Kwai).
 * RISE ARCHITECT PROTOCOL V2 - Zero Technical Debt
 */

// ============================================================================
// TRACKABLE ENTITIES
// ============================================================================

/**
 * Produto rastreável para eventos de tracking
 */
export interface TrackableProduct {
  id: string;
  name: string;
  price?: number;
  description?: string;
  category?: string;
  image_url?: string;
}

/**
 * Order bump rastreável
 */
export interface TrackableBump {
  id: string;
  name: string;
  price?: number;
  product_id?: string;
}

/**
 * Dados de compra para tracking
 */
export interface TrackablePurchase {
  orderId: string;
  value: number;
  currency: string;
  product: TrackableProduct;
  bumps?: TrackableBump[];
  paymentMethod?: string;
}

// ============================================================================
// EVENT PARAMETERS
// ============================================================================

/**
 * Parâmetros base para eventos de tracking
 */
export interface BaseTrackingParams {
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}

/**
 * Parâmetros para ViewContent
 */
export interface ViewContentParams extends BaseTrackingParams {
  content_category?: string;
}

/**
 * Parâmetros para InitiateCheckout
 */
export interface InitiateCheckoutParams extends BaseTrackingParams {
  num_items?: number;
}

/**
 * Parâmetros para Purchase
 */
export interface PurchaseParams extends BaseTrackingParams {
  transaction_id?: string;
  num_items?: number;
}

/**
 * Parâmetros para AddToCart
 */
export interface AddToCartParams extends BaseTrackingParams {
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
}

// ============================================================================
// PIXEL CONFIGURATION
// ============================================================================

/**
 * Configuração base de pixel
 */
export interface BasePixelConfig {
  pixel_id: string;
  enabled: boolean;
  selected_products?: string[];
}

/**
 * Configuração de pixel do checkout
 */
export interface CheckoutPixelConfig extends BasePixelConfig {
  platform: 'facebook' | 'tiktok' | 'google_ads' | 'kwai';
  fire_on_pix?: boolean;
  fire_on_card?: boolean;
  fire_on_boleto?: boolean;
  custom_value_pix?: number;
  custom_value_card?: number;
  custom_value_boleto?: number;
  domain?: string;
}

// ============================================================================
// INTEGRATION STATUS
// ============================================================================

/**
 * Status de integração de tracking
 */
export interface TrackingIntegrationStatus {
  platform: string;
  isActive: boolean;
  pixelId?: string;
  lastChecked?: string;
  error?: string;
}

// ============================================================================
// TRACKING CONTEXT
// ============================================================================

/**
 * Contexto de tracking para o checkout
 */
export interface TrackingContext {
  productId: string;
  checkoutId?: string;
  affiliateCode?: string;
  utmParams?: Record<string, string>;
  referrer?: string;
}

// ============================================================================
// CONVERSION DATA
// ============================================================================

/**
 * Dados de conversão para APIs de servidor
 */
export interface ConversionData {
  event_name: string;
  event_time: number;
  event_source_url?: string;
  user_data?: {
    email?: string;
    phone?: string;
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_ids?: string[];
    content_type?: string;
    content_name?: string;
    order_id?: string;
  };
}
