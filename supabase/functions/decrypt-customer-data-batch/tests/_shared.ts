/**
 * Shared Types & Helpers for decrypt-customer-data-batch Tests
 * 
 * @module decrypt-customer-data-batch/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const MAX_ORDER_IDS = 20;

// ============================================================================
// TYPES
// ============================================================================

export interface BatchRequest {
  order_ids?: string[];
  fields?: string[];
}

export interface Producer {
  id: string;
  role: string;
}

export interface OrderWithProduct {
  id: string;
  customer_phone: string | null;
  customer_document: string | null;
  product: { id: string; user_id: string } | { id: string; user_id: string }[] | null;
}

export interface Order {
  id: string;
  productOwnerId: string;
}

export interface BatchResult {
  result: Record<string, { phone?: string }>;
  denied: string[];
}

export interface DecryptedData {
  customer_phone?: string | null;
  customer_document?: string | null;
  customer_email?: string | null;
}

export interface BatchResponse {
  success: boolean;
  data: Record<string, { customer_phone?: string | null; customer_document?: string | null }>;
  denied: string[];
}

export interface AuditEntry {
  user_id: string;
  action: string;
  resource: string;
  resource_id: string;
  success: boolean;
  ip_address: string | null;
  metadata: {
    fields: string[];
    order_count: number;
    order_ids: string[];
    access_type: "vendor";
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates batch request has order_ids array
 */
export function validateRequest(req: BatchRequest): { valid: boolean; error?: string } {
  if (!req.order_ids || !Array.isArray(req.order_ids) || req.order_ids.length === 0) {
    return { valid: false, error: "order_ids array required" };
  }
  return { valid: true };
}

/**
 * Validates order_ids count is within limit
 */
export function validateLimit(orderIds: string[]): { valid: boolean; error?: string } {
  if (orderIds.length > MAX_ORDER_IDS) {
    return { valid: false, error: `Maximum ${MAX_ORDER_IDS} order_ids allowed` };
  }
  return { valid: true };
}

/**
 * Validates order_ids type
 */
export function validateOrderIds(orderIds: unknown): { valid: boolean; error?: string } {
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return { valid: false, error: "order_ids array required" };
  }
  return { valid: true };
}

/**
 * Gets fields with default
 */
export function getFields(requestFields?: string[]): string[] {
  return requestFields || ["customer_phone"];
}

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

/**
 * Checks if producer has batch access (vendor only)
 */
export function hasAccess(producer: Producer, productOwnerId: string): boolean {
  return producer.id === productOwnerId;
}

// ============================================================================
// EXTRACTION HELPERS
// ============================================================================

/**
 * Gets product owner ID from order
 */
export function getProductOwnerId(order: OrderWithProduct): string | null {
  const product = Array.isArray(order.product) ? order.product[0] : order.product;
  return product?.user_id || null;
}

// ============================================================================
// BATCH PROCESSING HELPERS
// ============================================================================

/**
 * Processes batch of orders separating allowed and denied
 */
export function processBatch(orders: Order[], producerId: string): BatchResult {
  const result: Record<string, { phone?: string }> = {};
  const denied: string[] = [];

  for (const order of orders) {
    if (order.productOwnerId === producerId) {
      result[order.id] = { phone: "decrypted" };
    } else {
      denied.push(order.id);
    }
  }

  return { result, denied };
}

/**
 * Decrypts requested fields only
 */
export function decryptFields(
  order: { customer_phone: string | null; customer_document: string | null },
  fields: string[]
): DecryptedData {
  const result: DecryptedData = {};
  
  if (fields.includes("customer_phone") && order.customer_phone) {
    result.customer_phone = "decrypted_phone";
  }
  
  if (fields.includes("customer_document") && order.customer_document) {
    result.customer_document = "decrypted_doc";
  }

  return result;
}

/**
 * Determines if audit log should be written
 */
export function shouldLog(decryptedIds: string[]): boolean {
  return decryptedIds.length > 0;
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
 * Handles fetch error
 */
export function handleFetchError(_error: Error): { success: boolean; error: string } {
  return {
    success: false,
    error: "Failed to fetch orders"
  };
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Formats request log message
 */
export function formatRequestLog(producerId: string, orderCount: number): string {
  return `Producer ${producerId} requesting ${orderCount} orders`;
}

/**
 * Formats result log message
 */
export function formatResultLog(decryptedCount: number, deniedCount: number): string {
  return `Decrypted ${decryptedCount} orders, denied ${deniedCount}`;
}
