/**
 * Shared Types & Helpers for decrypt-customer-data Tests
 * 
 * @module decrypt-customer-data/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RequestBody {
  order_id: string;
}

export interface ProductRecord {
  id: string;
  user_id: string;
}

export interface OrderRecord {
  id: string;
  vendor_id: string;
  customer_phone: string | null;
  customer_document: string | null;
  product: ProductRecord | ProductRecord[] | null;
}

export interface Producer {
  id: string;
  role: string;
}

export interface SecurityAuditEntry {
  user_id: string;
  action: string;
  resource: string;
  resource_id: string;
  success: boolean;
  ip_address: string | null;
  metadata: Record<string, unknown>;
}

export interface DecryptResponse {
  success: boolean;
  data: {
    customer_phone: string | null;
    customer_document: string | null;
  };
  access_type: "vendor" | "admin";
}

export interface ErrorResponse {
  error: string;
}

export interface OrderResult {
  data: OrderRecord | null;
  error: Error | null;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates request body has order_id
 */
export function validateBody(body: Partial<RequestBody>): { valid: boolean; error?: string } {
  if (!body.order_id) {
    return { valid: false, error: "order_id required" };
  }
  return { valid: true };
}

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

/**
 * Checks if producer has access to product
 */
export function hasAccess(producer: Producer, productOwnerId: string): boolean {
  const isProductOwner = producer.id === productOwnerId;
  const isOwner = producer.role === "owner";
  return isProductOwner || isOwner;
}

/**
 * Determines access type
 */
export function getAccessType(isProductOwner: boolean, isOwner: boolean): "vendor" | "admin" | null {
  if (!isProductOwner && !isOwner) return null;
  return isProductOwner ? "vendor" : "admin";
}

// ============================================================================
// PRODUCT EXTRACTION HELPERS
// ============================================================================

/**
 * Extracts product owner from order
 */
export function extractProductOwner(product: ProductRecord | ProductRecord[] | null): string | null {
  if (!product) return null;
  const p = Array.isArray(product) ? product[0] : product;
  return p?.user_id || null;
}

// ============================================================================
// DECRYPTION HELPERS
// ============================================================================

/**
 * Decrypts value (simplified for testing)
 */
export async function decryptValue(encrypted: string): Promise<string | null> {
  if (!encrypted || encrypted.trim() === "") return null;
  return encrypted;
}

/**
 * Derives key hash for consistency check
 */
export async function deriveKeyHash(keyMaterial: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// IP EXTRACTION HELPERS
// ============================================================================

/**
 * Gets IP from headers
 */
export function getIP(headers: Headers): string | null {
  return headers.get("x-forwarded-for") || headers.get("cf-connecting-ip");
}

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

/**
 * Checks encryption key configuration
 */
export function checkEncryptionKey(key: string | undefined): { ok: boolean; error?: string } {
  if (!key) {
    return { ok: false, error: "BUYER_ENCRYPTION_KEY not configured" };
  }
  return { ok: true };
}

/**
 * Handles order result
 */
export function handleOrderResult(result: OrderResult): { status: number; body: Record<string, unknown> } {
  if (result.error || !result.data) {
    return { status: 404, body: { error: "Order not found" } };
  }
  return { status: 200, body: { order: result.data } };
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Formats log message for request
 */
export function formatLogMessage(producerId: string, orderId: string): string {
  return `Producer ${producerId} requesting order ${orderId}`;
}

/**
 * Formats access log
 */
export function formatAccessLog(producerId: string, orderId: string, accessType: string): string {
  return `Producer ${producerId} (${accessType}) accessed order ${orderId}`;
}
