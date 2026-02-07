/**
 * ============================================================================
 * Facebook CAPI Types - Unified Type Definitions
 * ============================================================================
 * 
 * @module _shared/facebook-capi/types
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Centralizes ALL interfaces and types for Facebook CAPI integration.
 * Follows the same pattern as _shared/utmify/types.ts.
 * ============================================================================
 */

// ============================================================================
// PIXEL CONFIGURATION
// ============================================================================

/**
 * A resolved Facebook pixel with its access token and event config.
 * Result of pixel-resolver querying vendor_pixels + product_pixels.
 */
export interface ResolvedFacebookPixel {
  /** vendor_pixels.id (UUID) */
  vendorPixelId: string;
  /** The actual Facebook pixel ID (e.g., "123456789") */
  pixelId: string;
  /** Facebook access token for CAPI (stored in vendor_pixels.access_token) */
  accessToken: string;
  /** Optional domain for advanced matching */
  domain?: string | null;
  /** Custom value percentage override (from product_pixels) */
  customValuePercent?: number | null;
}

// ============================================================================
// CAPI EVENT DATA
// ============================================================================

/**
 * User data for Facebook CAPI (hashed server-side)
 */
export interface FacebookCAPIUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  externalId?: string | null;
}

/**
 * Custom data for Facebook CAPI events
 */
export interface FacebookCAPICustomData {
  currency?: string;
  value?: number;
  contentIds?: string[];
  contentType?: string;
  contentName?: string;
  orderId?: string;
  numItems?: number;
}

/**
 * Complete payload sent to facebook-conversion-api edge function
 */
export interface FacebookCAPIPayload {
  pixelId: string;
  accessToken: string;
  eventName: string;
  eventId: string;
  eventData: FacebookCAPICustomData;
  userData: FacebookCAPIUserData;
  eventSourceUrl?: string;
}

// ============================================================================
// DISPATCH TYPES
// ============================================================================

/**
 * Result of dispatching CAPI events for a single pixel
 */
export interface FacebookCAPIPixelResult {
  pixelId: string;
  success: boolean;
  error?: string;
  persistedToQueue?: boolean;
}

/**
 * Aggregated result of dispatching CAPI events for all pixels of an order
 */
export interface FacebookCAPIDispatchResult {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  totalPixels: number;
  successCount: number;
  failedCount: number;
  pixelResults: FacebookCAPIPixelResult[];
}

// ============================================================================
// INTERNAL TYPES (not re-exported via barrel)
// ============================================================================

/**
 * Order data fetched for CAPI dispatch.
 * Used internally by dispatcher.ts — not part of the public API surface.
 */
export interface FacebookCAPIOrderData {
  orderId: string;
  vendorId: string;
  productId: string;
  productName: string | null;
  amountCents: number;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  paymentMethod: string;
}
