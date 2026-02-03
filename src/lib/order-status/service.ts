/**
 * Order Status Service - Centralized Status Operations
 * 
 * @module lib/order-status
 * @version 2.0.0 - RISE V3 Compliant - Zero console.log
 * 
 * PADRÃO DE MERCADO: Uma venda pendente NUNCA vira "cancelada".
 * Status expired, cancelled do gateway = 'pending' na UI.
 * Status failed, rejected, declined do gateway = 'refused' (cartão recusado).
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
  CANONICAL_STATUSES,
} from './types';
import { createLogger } from "@/lib/logger";

const log = createLogger("OrderStatusService");
// GATEWAY STATUS MAPPING
// ============================================================================

/**
 * Maps raw gateway statuses to canonical statuses
 * 
 * MODELO HOTMART/KIWIFY/CAKTO:
 * - PIX expirado/cancelado → 'pending' (vendas não "cancelam")
 * - Cartão recusado → 'refused' (status próprio)
 * - 5 status canônicos: paid, pending, refused, refunded, chargeback
 */
const GATEWAY_STATUS_MAP: Readonly<Record<string, CanonicalOrderStatus>> = {
  // ===== CANONICAL (passthrough) =====
  paid: 'paid',
  pending: 'pending',
  refunded: 'refunded',
  chargeback: 'chargeback',
  
  // ===== SUCCESS (→ paid) =====
  approved: 'paid',
  succeeded: 'paid',
  success: 'paid',
  complete: 'paid',
  completed: 'paid',
  confirmed: 'paid',
  
  // ===== PENDING (→ pending) =====
  authorized: 'pending',
  in_process: 'pending',
  in_mediation: 'pending',
  created: 'pending',
  requires_payment_method: 'pending',
  requires_confirmation: 'pending',
  requires_action: 'pending',
  processing: 'pending',
  requires_capture: 'pending',
  
  // ===== EXPIRED/CANCELLED (→ pending, padrão mercado) =====
  // Uma venda pendente NUNCA vira cancelada - fica pendente eternamente
  expired: 'pending',
  cancelled: 'pending',
  canceled: 'pending',
  cancelled_by_user: 'pending',
  timeout: 'pending',
  expired_pix: 'pending',
  abandoned: 'pending',
  
  // ===== FAILED/REJECTED (→ refused) =====
  // Cartão recusado = status próprio "refused"
  failed: 'refused',
  rejected: 'refused',
  error: 'refused',
  declined: 'refused',
  refused: 'refused',
  card_declined: 'refused',
  cc_rejected: 'refused',
  
  // ===== REFUND/CHARGEBACK =====
  dispute: 'chargeback',
  disputed: 'chargeback',
  chargedback: 'chargeback',
  charged_back: 'chargeback',
} as const;

// ============================================================================
// SERVICE CLASS
// ============================================================================

class OrderStatusService {
  /**
   * Get display label for a status
   * 
   * @param status - Canonical status or raw gateway status
   * @returns User-friendly label, or "Pendente" if not mappable (padrão mercado)
   * 
   * @example
   * getDisplayLabel('paid') // "Pago"
   * getDisplayLabel('approved') // "Pago" (via gateway mapping)
   * getDisplayLabel('expired') // "Pendente" (padrão mercado)
   */
  getDisplayLabel(status: string | null | undefined): StatusDisplayLabel {
    if (!status) return 'Pendente';
    
    const normalized = this.normalize(status);
    if (normalized) {
      return STATUS_DISPLAY_MAP[normalized];
    }
    
    // Status desconhecido = Pendente (padrão mercado: não existe "desconhecido")
    log.warn(`Unknown status: "${status}" → defaulting to "Pendente"`);
    return 'Pendente';
  }

  /**
   * Get color scheme for a status
   * 
   * @param status - Canonical status or raw gateway status
   * @returns Color scheme object, or pending colors for unknown status
   */
  getColorScheme(status: string | null | undefined): StatusColorScheme {
    if (!status) {
      return STATUS_COLORS.pending; // Padrão mercado: sem status = pendente
    }
    
    const normalized = this.normalize(status);
    if (normalized) {
      return STATUS_COLORS[normalized];
    }
    
    // Unknown status uses pending colors (padrão mercado)
    return STATUS_COLORS.pending;
  }

  /**
   * Normalize any status string to a canonical status
   * 
   * PADRÃO HOTMART/KIWIFY/CAKTO:
   * - PIX expired, cancelled → 'pending'
   * - Cartão failed, rejected, declined → 'refused'
   * - 5 status possíveis: paid, pending, refused, refunded, chargeback
   * 
   * @param status - Any status string (canonical or gateway-specific)
   * @returns Canonical status, or 'pending' if not mappable
   */
  normalize(status: string | null | undefined): CanonicalOrderStatus {
    if (!status) return 'pending';
    
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
    
    // Fallback: desconhecido = pendente (padrão mercado)
    return 'pending';
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
   * Check if a status is considered "refused" (card declined)
   */
  isRefused(status: string | null | undefined): boolean {
    return this.normalize(status) === 'refused';
  }

  /**
   * Check if a status is a terminal/final state
   * 
   * NOTA: 'pending' não é terminal - pode virar 'paid'
   */
  isTerminal(status: string | null | undefined): boolean {
    const normalized = this.normalize(status);
    // Terminal = não pode mais mudar (paid, refunded, chargeback)
    // Pending não é terminal pois pode virar paid
    return ['paid', 'refunded', 'chargeback'].includes(normalized);
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
    return CANONICAL_STATUSES;
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
