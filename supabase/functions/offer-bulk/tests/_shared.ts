/**
 * Shared Test Infrastructure for offer-bulk
 * 
 * @module offer-bulk/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "offer-bulk";

export const VALID_ACTIONS = ["bulk-save"] as const;

export type ValidAction = typeof VALID_ACTIONS[number];

// ============================================================================
// TYPES
// ============================================================================

export interface OfferData {
  id?: string;
  name: string;
  price: number;
  is_default?: boolean;
  isDefault?: boolean;
  member_group_id?: string;
  memberGroupId?: string;
}

export interface BulkPayload {
  product_id?: string;
  productId?: string;
  offers?: OfferData[];
  deleted_offer_ids?: string[];
}

export interface MockProduct {
  id: string;
  user_id: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isOfferCreate(offer: OfferData): boolean {
  return !("id" in offer) || offer.id === undefined;
}

export function isOfferUpdate(offer: OfferData): boolean {
  return "id" in offer && offer.id !== undefined;
}

export function hasValidProductId(body: BulkPayload): boolean {
  return !!(body.product_id || body.productId);
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockRequest(body: BulkPayload): Request {
  const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}/bulk-save`;
  return new Request(url, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      "Authorization": "Bearer mock-token",
    }),
    body: JSON.stringify(body),
  });
}

export function createMockSupabaseClient(): Record<string, unknown> {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: {}, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ data: [{ id: "new-offer-1" }], error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: [{ id: "offer-123" }], error: null }),
      }),
      delete: () => ({
        in: () => Promise.resolve({ error: null }),
      }),
    }),
  };
}

export function createMockProducer(): { id: string; email: string } {
  return { id: "producer-123", email: "test@example.com" };
}

export function createMockProduct(ownerId = "producer-123"): MockProduct {
  return { id: "product-123", user_id: ownerId };
}
