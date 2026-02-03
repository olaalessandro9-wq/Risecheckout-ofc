/**
 * Checkout Pixel Types
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * SSOT (Single Source of Truth) for pixel types used across the application.
 * This file centralizes the CheckoutPixel interface to avoid circular dependencies
 * and ensure type consistency throughout the codebase.
 * 
 * @module types/checkout-pixels
 */

import type { PixelPlatform } from "@/modules/pixels";

/**
 * Pixel data as received from the BFF (resolve-and-load action)
 * or from standalone pixel queries.
 * 
 * This interface represents a fully resolved pixel with its
 * configuration and firing rules for the checkout context.
 */
export interface CheckoutPixel {
  /** Unique identifier for the pixel */
  id: string;
  
  /** Platform type (facebook, tiktok, google_ads, kwai) */
  platform: PixelPlatform;
  
  /** The actual pixel ID from the platform (e.g., Facebook Pixel ID) */
  pixel_id: string;
  
  /** Access token for server-side API calls (optional) */
  access_token?: string | null;
  
  /** Conversion label (required for Google Ads) */
  conversion_label?: string | null;
  
  /** Domain for CAPI (Conversions API) - Facebook specific */
  domain?: string | null;
  
  /** Whether the pixel is currently active */
  is_active: boolean;
  
  // === Firing Rules ===
  
  /** Fire on InitiateCheckout event */
  fire_on_initiate_checkout: boolean;
  
  /** Fire on Purchase/CompletePayment event */
  fire_on_purchase: boolean;
  
  /** Fire when PIX payment method is selected/used */
  fire_on_pix: boolean;
  
  /** Fire when Credit Card payment method is selected/used */
  fire_on_card: boolean;
  
  /** Fire when Boleto payment method is selected/used */
  fire_on_boleto: boolean;
  
  /** Custom value percentage for tracking (100 = full value) */
  custom_value_percent: number;
}
