/**
 * Shared Types & Mock Data for reconcile-asaas Tests
 * 
 * @module reconcile-asaas/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PendingOrder {
  id: string;
  vendor_id: string;
  product_id: string;
  gateway_payment_id: string;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
}

export interface ReconcileResult {
  order_id: string;
  previous_status: string;
  new_status: string;
  action: 'updated' | 'skipped' | 'error';
  reason: string;
}

export interface AsaasCredentials {
  access_token: string;
  environment?: string;
}

export interface ReconcileSummary {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_VENDOR_ID = "vendor-uuid-12345";
export const MOCK_ORDER_ID = "order-uuid-67890";
export const MOCK_PAYMENT_ID = "pay_asaas_abcdef";

export const mockPendingOrder: PendingOrder = {
  id: MOCK_ORDER_ID,
  vendor_id: MOCK_VENDOR_ID,
  product_id: "product-uuid-111",
  gateway_payment_id: MOCK_PAYMENT_ID,
  status: "PENDING",
  customer_email: "customer@example.com",
  customer_name: "João Silva",
};

export const mockCredentials: AsaasCredentials = {
  access_token: "aak_test_12345",
  environment: "production",
};

export const mockSandboxCredentials: AsaasCredentials = {
  access_token: "aak_sandbox_67890",
  environment: "sandbox",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function mapAsaasStatusToInternal(asaasStatus: string): string {
  if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(asaasStatus)) return 'approved';
  if (['OVERDUE', 'REFUNDED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE'].includes(asaasStatus)) return 'rejected';
  return 'pending';
}

export function determineNewOrderStatus(asaasStatus: string): string {
  const internalStatus = mapAsaasStatusToInternal(asaasStatus);
  if (internalStatus === 'approved') return 'paid';
  if (internalStatus === 'rejected') {
    if (asaasStatus === 'REFUNDED') return 'refunded';
    if (asaasStatus.includes('CHARGEBACK')) return 'chargeback';
    return 'rejected';
  }
  return 'PENDING';
}

export function getAsaasBaseUrl(sandbox: boolean): string {
  return sandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
}

export function validateOrderForReconciliation(order: PendingOrder): { valid: boolean; error?: string } {
  if (!order.id) return { valid: false, error: "Missing order ID" };
  if (!order.vendor_id) return { valid: false, error: "Missing vendor ID" };
  if (!order.gateway_payment_id) return { valid: false, error: "Missing gateway payment ID" };
  return { valid: true };
}

export function calculateSummary(results: ReconcileResult[]): ReconcileSummary {
  return {
    total: results.length,
    updated: results.filter(r => r.action === 'updated').length,
    skipped: results.filter(r => r.action === 'skipped').length,
    errors: results.filter(r => r.action === 'error').length,
  };
}

export function buildIdempotentSkipResult(order: PendingOrder): ReconcileResult {
  return { order_id: order.id, previous_status: order.status, new_status: order.status, action: 'skipped', reason: 'Já possui evento purchase_approved' };
}

export function buildCredentialErrorResult(order: PendingOrder): ReconcileResult {
  return { order_id: order.id, previous_status: order.status, new_status: order.status, action: 'error', reason: 'Credenciais Asaas não encontradas no Vault' };
}

export function buildApiErrorResult(order: PendingOrder): ReconcileResult {
  return { order_id: order.id, previous_status: order.status, new_status: order.status, action: 'error', reason: 'Não foi possível consultar status no Asaas' };
}

export function buildApprovedResult(order: PendingOrder): ReconcileResult {
  return { order_id: order.id, previous_status: order.status, new_status: 'paid', action: 'updated', reason: 'Pagamento confirmado via reconciliação' };
}
