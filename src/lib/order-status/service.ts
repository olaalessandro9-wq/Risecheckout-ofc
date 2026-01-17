/**
 * Order Status Service - Centralized Status Operations
 * 
 * @module lib/order-status
 * @version RISE V3 Compliant - Solution C (9.9 score)
 * 
 * This service handles all status-related operations:
 * - Display label generation
 * - Color scheme retrieval
 * - Status normalization from gateway responses
 * - Validation
 */

import {
  type CanonicalOrderStatus,
  type StatusColorScheme,
  type StatusDisplayLabel,
  STATUS_DISPLAY_MAP,
  STATUS_COLORS,
  CANONICAL_STATUS_SET,
  isCanonicalStatus,
} from './types';

// ============================================================================
// GATEWAY STATUS MAPPING
// ============================================================================

/**
 * Maps raw gateway statuses to canonical statuses
 * 
 * This handles variations from different payment gateways:
 * - MercadoPago: approved, pending, rejected, refunded, etc.
 * - PushinPay: paid, expired, cancelled, etc.
 * - Stripe: succeeded, pending, failed, etc.
 */
const GATEWAY_STATUS_MAP: Readonly<Record<string, CanonicalOrderStatus>> = {
  // Universal
  paid: 'paid',
  pending: 'pending',
  cancelled: 'cancelled',
  refunded: 'refunded',
  chargeback: 'chargeback',
  failed: 'failed',
  
  // MercadoPago variations
  approved: 'paid',
  authorized: 'pending',
  in_process: 'pending',
  in_mediation: 'pending',
  rejected: 'failed',
  cancelled_by_user: 'cancelled',
  
  // PushinPay variations
  expired: 'cancelled',
  created: 'pending',
  
  // Stripe variations
  succeeded: 'paid',
  requires_payment_method: 'pending',
  requires_confirmation: 'pending',
  requires_action: 'pending',
  processing: 'pending',
  requires_capture: 'pending',
  canceled: 'cancelled',
  
  // Common variations
  success: 'paid',
  complete: 'paid',
  completed: 'paid',
  confirmed: 'paid',
  timeout: 'cancelled',
  expired_pix: 'cancelled',
  abandoned: 'cancelled',
  error: 'failed',
  declined: 'failed',
  dispute: 'chargeback',
  disputed: 'chargeback',
  chargedback: 'chargeback',
} as const;

// ============================================================================
// SERVICE CLASS
// ============================================================================

class OrderStatusService {
  /**
   * Get display label for a status
   * 
   * @param status - Canonical status or raw gateway status
   * @returns User-friendly label, or "Desconhecido" if not mappable
   * 
   * @example
   * getDisplayLabel('paid') // "Pago"
   * getDisplayLabel('approved') // "Pago" (via gateway mapping)
   * getDisplayLabel('xyz123') // "Desconhecido"
   */
  getDisplayLabel(status: string | null | undefined): StatusDisplayLabel | 'Desconhecido' {
    if (!status) return 'Desconhecido';
    
    const normalized = this.normalize(status);
    if (normalized) {
      return STATUS_DISPLAY_MAP[normalized];
    }
    
    // Log unknown status for monitoring
    console.warn(`[OrderStatusService] Unknown status: "${status}"`);
    return 'Desconhecido';
  }

  /**
   * Get color scheme for a status
   * 
   * @param status - Canonical status or raw gateway status
   * @returns Color scheme object, or neutral colors for unknown status
   */
  getColorScheme(status: string | null | undefined): StatusColorScheme {
    if (!status) {
      return STATUS_COLORS.cancelled; // Neutral gray for unknown
    }
    
    const normalized = this.normalize(status);
    if (normalized) {
      return STATUS_COLORS[normalized];
    }
    
    // Unknown status uses neutral colors
    return STATUS_COLORS.cancelled;
  }

  /**
   * Normalize any status string to a canonical status
   * 
   * @param status - Any status string (canonical or gateway-specific)
   * @returns Canonical status, or null if not mappable
   */
  normalize(status: string | null | undefined): CanonicalOrderStatus | null {
    if (!status) return null;
    
    const lower = status.toLowerCase().trim();
    
    // Check if already canonical
    if (CANONICAL_STATUS_SET.has(lower)) {
      return lower as CanonicalOrderStatus;
    }
    
    // Try gateway mapping
    const mapped = GATEWAY_STATUS_MAP[lower];
    if (mapped) {
      return mapped;
    }
    
    return null;
  }

  /**
   * Check if a status is considered "paid" (successful)
   */
  isPaid(status: string | null | undefined): boolean {
    return this.normalize(status) === 'paid';
  }

  /**
   * Check if a status is considered "pending"
   */
  isPending(status: string | null | undefined): boolean {
    return this.normalize(status) === 'pending';
  }

  /**
   * Check if a status is a terminal/final state
   */
  isTerminal(status: string | null | undefined): boolean {
    const normalized = this.normalize(status);
    if (!normalized) return false;
    
    return ['paid', 'cancelled', 'refunded', 'chargeback', 'failed'].includes(normalized);
  }

  /**
   * Validate that a status is canonical
   * 
   * @throws Error if status is not valid
   */
  validate(status: unknown): asserts status is CanonicalOrderStatus {
    if (!isCanonicalStatus(status)) {
      throw new Error(`Invalid canonical status: ${String(status)}`);
    }
  }

  /**
   * Get all canonical statuses (for dropdowns, filters, etc.)
   */
  getAllStatuses(): readonly CanonicalOrderStatus[] {
    return ['paid', 'pending', 'cancelled', 'refunded', 'chargeback', 'failed'];
  }

  /**
   * Get status options for select/filter components
   */
  getStatusOptions(): Array<{ value: CanonicalOrderStatus; label: string }> {
    return this.getAllStatuses().map(status => ({
      value: status,
      label: STATUS_DISPLAY_MAP[status],
    }));
  }
}

/**
 * Singleton instance of OrderStatusService
 * Use this for all status operations in the application
 */
export const orderStatusService = new OrderStatusService();
