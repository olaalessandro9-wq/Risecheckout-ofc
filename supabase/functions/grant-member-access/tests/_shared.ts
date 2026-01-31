/**
 * Grant Member Access Tests - Shared Types and Utilities
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module grant-member-access/tests/_shared
 */

// ============================================================================
// TYPES
// ============================================================================

export interface GrantAccessRequest {
  order_id: string;
  vendor_id: string;
  product_id: string;
  customer_email: string;
  customer_name?: string | null;
}

export interface GrantAccessResponse {
  success: boolean;
  buyer_id?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

export interface MockProduct {
  id: string;
  name: string;
  members_area_enabled: boolean;
  user_id: string;
}

export interface MockUser {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  account_status: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_INTERNAL_SECRET = "test-internal-secret-12345";

export const MOCK_PRODUCT_WITH_MEMBERS: MockProduct = {
  id: "prod-with-members",
  name: "Curso Completo",
  members_area_enabled: true,
  user_id: "vendor-001"
};

export const MOCK_PRODUCT_WITHOUT_MEMBERS: MockProduct = {
  id: "prod-without-members",
  name: "E-book",
  members_area_enabled: false,
  user_id: "vendor-001"
};

export const MOCK_EXISTING_USER: MockUser = {
  id: "user-existing-123",
  email: "existing@example.com",
  name: "Existing User",
  password_hash: "hashed-password",
  account_status: "active"
};

export const MOCK_NEW_USER: MockUser = {
  id: "user-new-456",
  email: "new.user@example.com",
  name: "New User",
  password_hash: null,
  account_status: "pending_setup"
};

export const MOCK_DEFAULT_GROUP = {
  id: "group-default-001",
  product_id: "prod-with-members",
  name: "Grupo Padrão",
  is_default: true
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalizes email to lowercase and trimmed
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validates grant access request fields
 */
export function validateGrantAccessRequest(request: Partial<GrantAccessRequest>): string | null {
  if (!request.order_id) return "Missing required fields: order_id, product_id, vendor_id";
  if (!request.product_id) return "Missing required fields: order_id, product_id, vendor_id";
  if (!request.vendor_id) return "Missing required fields: order_id, product_id, vendor_id";
  return null;
}

/**
 * Simulates the grant access logic
 */
export function simulateGrantAccess(
  request: GrantAccessRequest,
  product: MockProduct | null,
  existingUser: MockUser | null
): GrantAccessResponse {
  if (!product) {
    return { success: false, error: "Produto não encontrado: Product not found" };
  }

  if (!product.members_area_enabled) {
    return { success: true, skipped: true, reason: "Produto sem área de membros" };
  }

  if (!request.customer_email) {
    return { success: false, error: "Email do cliente não disponível" };
  }

  const buyerId = existingUser?.id || MOCK_NEW_USER.id;
  return { success: true, buyer_id: buyerId };
}

/**
 * Simulates internal secret validation
 */
export function validateInternalSecret(providedSecret: string | null, expectedSecret: string): boolean {
  if (!providedSecret) return false;
  return providedSecret === expectedSecret;
}
