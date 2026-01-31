/**
 * Shared Types & Mock Data for students-access Tests
 * 
 * @module students-access/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AccessRequest {
  action: "grant-access" | "revoke-access";
  buyer_id: string;
  product_id: string;
  order_id?: string;
}

export interface AccessResponse {
  success?: boolean;
  error?: string;
}

export interface ProductRecord {
  id: string;
  user_id: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_PRODUCER_ID = "producer-uuid-123";
export const MOCK_BUYER_ID = "buyer-uuid-456";
export const MOCK_PRODUCT_ID = "product-uuid-789";
export const MOCK_ORDER_ID = "order-uuid-abc";

export const MOCK_PRODUCT: ProductRecord = {
  id: MOCK_PRODUCT_ID,
  user_id: MOCK_PRODUCER_ID,
};

export const MOCK_USER: UserRecord = {
  id: MOCK_BUYER_ID,
  email: "buyer@example.com",
  name: "Test Buyer",
};

export const MOCK_GRANT_REQUEST: AccessRequest = {
  action: "grant-access",
  buyer_id: MOCK_BUYER_ID,
  product_id: MOCK_PRODUCT_ID,
  order_id: MOCK_ORDER_ID,
};

export const MOCK_REVOKE_REQUEST: AccessRequest = {
  action: "revoke-access",
  buyer_id: MOCK_BUYER_ID,
  product_id: MOCK_PRODUCT_ID,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function validateAccessRequest(request: AccessRequest): string | null {
  if (!["grant-access", "revoke-access"].includes(request.action)) {
    return "Invalid action";
  }
  if (!request.buyer_id) {
    return "buyer_id and product_id required";
  }
  if (!request.product_id) {
    return "buyer_id and product_id required";
  }
  return null;
}

export function verifyProductOwnership(
  product: ProductRecord | null,
  producerId: string
): boolean {
  if (!product) return false;
  return product.user_id === producerId;
}

export function buildAccessRecord(
  buyerId: string,
  productId: string,
  orderId?: string
): Record<string, unknown> {
  return {
    buyer_id: buyerId,
    product_id: productId,
    order_id: orderId || null,
    is_active: true,
    access_type: "invite",
    granted_at: new Date().toISOString(),
  };
}
