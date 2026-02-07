/**
 * Facebook Tracking Event ID Generator
 * 
 * Generates deterministic event IDs for Facebook Pixel + CAPI deduplication.
 * The SAME event_id must be generated independently by frontend (Pixel) and
 * backend (CAPI) so Facebook can deduplicate them.
 * 
 * Rules:
 * - Purchase: `purchase_{orderId}` (deterministic — same on frontend & backend)
 * - ViewContent: `view_{productId}_{sessionTimestamp}`
 * - InitiateCheckout: `checkout_{productId}_{sessionTimestamp}`
 * - AddToCart: `cart_{itemId}_{timestamp}`
 * - Generic: `{eventName}_{timestamp}_{random}`
 * 
 * @module src/lib/tracking/event-id
 * @version 1.0.0 - RISE Protocol V3
 */

/**
 * Generates a deterministic event ID for Purchase events.
 * Both frontend and backend generate the SAME ID for the same orderId,
 * enabling Facebook's built-in deduplication.
 * 
 * @param orderId - The unique order identifier
 * @returns Deterministic event ID: `purchase_{orderId}`
 */
export function generatePurchaseEventId(orderId: string): string {
  return `purchase_${orderId}`;
}

/**
 * Generates an event ID for ViewContent events.
 * Semi-deterministic: unique per product per page load.
 * 
 * @param productId - The product identifier
 * @returns Event ID: `view_{productId}_{timestamp}`
 */
export function generateViewContentEventId(productId: string): string {
  return `view_${productId}_${Date.now()}`;
}

/**
 * Generates an event ID for InitiateCheckout events.
 * Semi-deterministic: unique per product per action.
 * 
 * @param productId - The product identifier
 * @returns Event ID: `checkout_{productId}_{timestamp}`
 */
export function generateInitiateCheckoutEventId(productId: string): string {
  return `checkout_${productId}_${Date.now()}`;
}

/**
 * Generates an event ID for AddToCart events.
 * 
 * @param itemId - The bump/item identifier
 * @returns Event ID: `cart_{itemId}_{timestamp}`
 */
export function generateAddToCartEventId(itemId: string): string {
  return `cart_${itemId}_${Date.now()}`;
}

/**
 * Generates a generic event ID for any other event.
 * 
 * @param eventName - The event name
 * @returns Event ID: `{eventName}_{timestamp}_{random}`
 */
export function generateGenericEventId(eventName: string): string {
  const sanitized = eventName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const random = Math.random().toString(36).substring(2, 8);
  return `${sanitized}_${Date.now()}_${random}`;
}
