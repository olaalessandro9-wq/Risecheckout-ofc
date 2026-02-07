/**
 * ============================================================================
 * Facebook CAPI Event ID Generator (Deno)
 * ============================================================================
 * 
 * @module _shared/facebook-capi/event-id
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Deno-compatible version of the frontend event-id generator.
 * MUST produce the SAME IDs as src/lib/tracking/event-id.ts for
 * deterministic events (Purchase).
 * ============================================================================
 */

/**
 * Generates a deterministic event ID for Purchase events.
 * MUST match the frontend: `purchase_{orderId}`
 * 
 * @param orderId - The unique order identifier
 * @returns `purchase_{orderId}`
 */
export function generatePurchaseEventId(orderId: string): string {
  return `purchase_${orderId}`;
}

/**
 * Generates a generic event ID for non-deterministic events.
 * 
 * @param eventName - The event name
 * @returns `{eventName}_{timestamp}_{random}`
 */
export function generateGenericEventId(eventName: string): string {
  const sanitized = eventName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const random = crypto.randomUUID().substring(0, 8);
  return `${sanitized}_${Date.now()}_${random}`;
}
