/**
 * Types para o sistema de Biblioteca de Pixels
 */

export type PixelPlatform = 'facebook' | 'tiktok' | 'google_ads' | 'kwai';

export interface VendorPixel {
  id: string;
  vendor_id: string;
  platform: PixelPlatform;
  name: string;
  pixel_id: string;
  access_token?: string | null;
  conversion_label?: string | null;
  domain?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Campo computado para contagem de produtos vinculados
  linked_products_count?: number;
}

export interface ProductPixel {
  id: string;
  product_id: string;
  pixel_id: string;
  fire_on_initiate_checkout: boolean;
  fire_on_purchase: boolean;
  fire_on_pix: boolean;
  fire_on_card: boolean;
  fire_on_boleto: boolean;
  custom_value_percent: number;
  created_at: string;
  // Join com vendor_pixels
  vendor_pixel?: VendorPixel;
}

export interface PixelFormData {
  platform: PixelPlatform;
  name: string;
  pixel_id: string;
  access_token?: string;
  conversion_label?: string;
  domain?: string;
  is_active: boolean;
}

export interface ProductPixelLinkData {
  pixel_id: string;
  fire_on_initiate_checkout: boolean;
  fire_on_purchase: boolean;
  fire_on_pix: boolean;
  fire_on_card: boolean;
  fire_on_boleto: boolean;
  custom_value_percent: number;
}

export const PLATFORM_INFO: Record<PixelPlatform, { 
  label: string; 
  color: string; 
  description: string;
  requiresAccessToken: boolean;
  requiresConversionLabel: boolean;
  requiresDomain: boolean;
}> = {
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
