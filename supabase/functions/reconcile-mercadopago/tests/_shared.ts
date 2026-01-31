/**
 * Shared Types & Mock Data for reconcile-mercadopago Tests
 * 
 * @module reconcile-mercadopago/tests/_shared
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
  technical_status?: string;
  action: 'updated' | 'skipped' | 'error';
  reason: string;
}

export interface MercadoPagoStatus {
  status: string;
  status_detail: string;
  date_approved?: string;
}

export interface ReconcileSummary {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
  model: string;
  version: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_VENDOR_ID = "vendor-uuid-12345";
export const MOCK_ORDER_ID = "order-uuid-67890";
export const MOCK_PAYMENT_ID = "12345678901";
export const FUNCTION_VERSION = "2.0.0";

export const mockPendingOrder: PendingOrder = {
  id: MOCK_ORDER_ID,
  vendor_id: MOCK_VENDOR_ID,
  product_id: "product-uuid-111",
  gateway_payment_id: MOCK_PAYMENT_ID,
  status: "PENDING",
  customer_email: "customer@example.com",
  customer_name: "Maria Santos",
};

export const mockApprovedStatus: MercadoPagoStatus = {
  status: "approved",
  status_detail: "accredited",
  date_approved: "2024-01-15T10:30:00.000-03:00",
};

export const mockRejectedStatus: MercadoPagoStatus = {
  status: "rejected",
  status_detail: "cc_rejected_insufficient_amount",
};

export const mockCancelledStatus: MercadoPagoStatus = {
  status: "cancelled",
  status_detail: "expired",
};

export const mockPendingStatus: MercadoPagoStatus = {
  status: "pending",
  status_detail: "pending_waiting_payment",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function determineOrderUpdate(mpStatus: MercadoPagoStatus, currentStatus: string): {
  newStatus: string;
  technicalStatus?: string;
  action: 'updated' | 'skipped';
  reason: string;
} {
  if (mpStatus.status === 'approved') {
    return { newStatus: 'paid', action: 'updated', reason: 'Pagamento confirmado via reconciliação' };
  }
  if (mpStatus.status === 'refunded') {
    return { newStatus: 'refunded', action: 'updated', reason: 'Status atualizado para refunded' };
  }
  if (mpStatus.status === 'charged_back') {
    return { newStatus: 'chargeback', action: 'updated', reason: 'Status atualizado para chargeback' };
  }
  if (['rejected', 'cancelled'].includes(mpStatus.status)) {
    const technicalStatus = mpStatus.status === 'rejected' ? 'gateway_error' : 'gateway_cancelled';
    return {
      newStatus: currentStatus,
      technicalStatus,
      action: 'updated',
      reason: `Technical status atualizado para ${technicalStatus} (status público mantido como ${currentStatus})`,
    };
  }
  return { newStatus: currentStatus, action: 'skipped', reason: `Status ainda pendente: ${mpStatus.status}` };
}

export function mapToTechnicalStatus(mpStatus: string): string {
  if (mpStatus === 'rejected') return 'gateway_error';
  if (mpStatus === 'cancelled') return 'gateway_cancelled';
  return mpStatus;
}

export function validateOrder(order: PendingOrder): { valid: boolean; error?: string } {
  if (!order.id) return { valid: false, error: "Missing order ID" };
  if (!order.vendor_id) return { valid: false, error: "Missing vendor ID" };
  if (!order.gateway_payment_id) return { valid: false, error: "Missing payment ID" };
  return { valid: true };
}

export function calculateSummary(results: ReconcileResult[]): ReconcileSummary {
  return {
    total: results.length,
    updated: results.filter(r => r.action === 'updated').length,
    skipped: results.filter(r => r.action === 'skipped').length,
    errors: results.filter(r => r.action === 'error').length,
    model: 'hotmart_kiwify',
    version: FUNCTION_VERSION,
  };
}

export function buildMercadoPagoApiUrl(paymentId: string): string {
  return `https://api.mercadopago.com/v1/payments/${paymentId}`;
}

export function buildApprovedEventData(mpStatus: MercadoPagoStatus): Record<string, unknown> {
  return {
    source: 'reconcile-mercadopago',
    gateway_status: mpStatus.status,
    reconciled_at: new Date().toISOString(),
    model: 'hotmart_kiwify',
    version: FUNCTION_VERSION,
  };
}

export function buildTechnicalStatusEventData(mpStatus: MercadoPagoStatus, technicalStatus: string): Record<string, unknown> {
  return {
    source: 'reconcile-mercadopago',
    gateway_status: mpStatus.status,
    technical_status: technicalStatus,
    model: 'hotmart_kiwify',
    note: 'Status mantido como pending (padrão de mercado)',
    version: FUNCTION_VERSION,
  };
}
