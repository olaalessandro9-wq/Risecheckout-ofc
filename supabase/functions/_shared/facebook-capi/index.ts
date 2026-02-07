/**
 * ============================================================================
 * Facebook CAPI Module - Barrel Export
 * ============================================================================
 * 
 * @module _shared/facebook-capi
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Re-exports all functions and types from the Facebook CAPI module.
 * Follows the same pattern as _shared/utmify/index.ts.
 * ============================================================================
 */

// Types (public API surface only — FacebookCAPIOrderData is internal to dispatcher)
export type {
  ResolvedFacebookPixel,
  FacebookCAPIUserData,
  FacebookCAPICustomData,
  FacebookCAPIPayload,
  FacebookCAPIPixelResult,
  FacebookCAPIDispatchResult,
} from "./types.ts";

// Event ID Generation
export {
  generatePurchaseEventId,
  generateGenericEventId,
} from "./event-id.ts";

// Pixel Resolution
export { resolveFacebookPixels } from "./pixel-resolver.ts";

// Main Dispatcher
export { dispatchFacebookCAPIForOrder } from "./dispatcher.ts";
