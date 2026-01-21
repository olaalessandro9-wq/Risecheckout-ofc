/**
 * Types para o módulo de Pixels
 * 
 * @module modules/pixels
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// PLATFORM TYPES
// ============================================================================

export type PixelPlatform = 'facebook' | 'tiktok' | 'google_ads' | 'kwai';

// ============================================================================
// VENDOR PIXEL (Biblioteca do vendedor)
// ============================================================================

export interface VendorPixel {
  readonly id: string;
  readonly vendor_id: string;
  readonly platform: PixelPlatform;
  readonly name: string;
  readonly pixel_id: string;
  readonly access_token?: string | null;
  readonly conversion_label?: string | null;
  readonly domain?: string | null;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
  /** Campo computado para contagem de produtos vinculados */
  readonly linked_products_count?: number;
}

// ============================================================================
// PRODUCT PIXEL (Vinculação pixel ↔ produto)
// ============================================================================

export interface ProductPixelLink {
  readonly id: string;
  readonly product_id: string;
  readonly pixel_id: string;
  readonly fire_on_initiate_checkout: boolean;
  readonly fire_on_purchase: boolean;
  readonly fire_on_pix: boolean;
  readonly fire_on_card: boolean;
  readonly fire_on_boleto: boolean;
  readonly custom_value_percent: number;
  readonly created_at: string;
}

export interface LinkedPixel extends VendorPixel {
  readonly link: ProductPixelLink;
}

// ============================================================================
// FORM DATA
// ============================================================================

export interface PixelFormData {
  readonly platform: PixelPlatform;
  readonly name: string;
  readonly pixel_id: string;
  readonly access_token?: string;
  readonly conversion_label?: string;
  readonly domain?: string;
  readonly is_active: boolean;
}

export interface ProductPixelLinkData {
  readonly pixel_id: string;
  readonly fire_on_initiate_checkout: boolean;
  readonly fire_on_purchase: boolean;
  readonly fire_on_pix: boolean;
  readonly fire_on_card: boolean;
  readonly fire_on_boleto: boolean;
  readonly custom_value_percent: number;
}

// ============================================================================
// PLATFORM INFO (Metadados estáticos)
// ============================================================================

export interface PlatformInfo {
  readonly label: string;
  readonly color: string;
  readonly description: string;
  readonly requiresAccessToken: boolean;
  readonly requiresConversionLabel: boolean;
  readonly requiresDomain: boolean;
}

export const PLATFORM_INFO: Record<PixelPlatform, PlatformInfo> = {
  facebook: {
    label: 'Facebook Pixel',
    color: '#1877f2',
    description: 'Rastreamento de eventos e conversões do Facebook/Meta',
    requiresAccessToken: true,
    requiresConversionLabel: false,
    requiresDomain: true,
  },
  tiktok: {
    label: 'TikTok Pixel',
    color: '#000000',
    description: 'Rastreamento de eventos e conversões do TikTok',
    requiresAccessToken: true,
    requiresConversionLabel: false,
    requiresDomain: false,
  },
  google_ads: {
    label: 'Google Ads',
    color: '#4285F4',
    description: 'Rastreamento de conversões do Google Ads',
    requiresAccessToken: false,
    requiresConversionLabel: true,
    requiresDomain: false,
  },
  kwai: {
    label: 'Kwai Pixel',
    color: '#FF6B00',
    description: 'Rastreamento de eventos e conversões do Kwai',
    requiresAccessToken: false,
    requiresConversionLabel: false,
    requiresDomain: false,
  },
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const PIXEL_PLATFORMS: readonly PixelPlatform[] = ['facebook', 'tiktok', 'google_ads', 'kwai'] as const;
