/**
 * Shared utilities for manage-affiliation tests
 * @module manage-affiliation/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig } from "../../_shared/testing/mod.ts";

// ============================================
// CONFIGURATION (Centralized via getTestConfig)
// ============================================

const config = getTestConfig();

export const FUNCTION_NAME = "manage-affiliation";
export const FUNCTION_URL = config.supabaseUrl
  ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
  : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

// ============================================
// CONSTANTS
// ============================================

export const VALID_ACTIONS = ["approve", "reject", "block", "unblock", "update_commission"];
export const VALID_STATUSES = ["pending", "active", "rejected", "blocked"];
export const MAX_COMMISSION_RATE = 90;
export const MIN_COMMISSION_RATE = 1;

export const ACTION_MESSAGES: Record<string, string> = {
  approve: "Afiliado aprovado com sucesso!",
  reject: "Afiliado recusado.",
  block: "Afiliado bloqueado.",
  unblock: "Afiliado desbloqueado e ativado.",
  update_commission: "Taxa de comissão atualizada",
};

// ============================================
// TYPES
// ============================================

export interface AffiliationPayload {
  affiliation_id?: string;
  action?: string;
  commission_rate?: number;
}

export interface Affiliation {
  id: string;
  user_id: string;
  product_id: string;
  affiliate_code: string | null;
  status: string;
  commission_rate: number;
  total_sales_count?: number;
  total_sales_amount?: number;
}

export interface AuditEntry {
  affiliate_id: string;
  action: string;
  performed_by: string;
  previous_status?: string;
  new_status?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
}

// ============================================
// HELPERS
// ============================================

export function isValidAction(action: string): boolean {
  return VALID_ACTIONS.includes(action);
}

export function isValidCommissionRate(rate: number): boolean {
  return typeof rate === "number" && rate >= MIN_COMMISSION_RATE && rate <= MAX_COMMISSION_RATE;
}

export function getStatusForAction(action: string, currentStatus?: string): string | null {
  switch (action) {
    case "approve": return "active";
    case "reject": return "rejected";
    case "block": return "blocked";
    case "unblock": return "active";
    case "update_commission": return currentStatus ?? "active";
    default: return null;
  }
}

export function needsAffiliateCode(action: string, currentCode: string | null): boolean {
  return (action === "approve" || action === "unblock") && !currentCode;
}

export function isProductOwner(product: { user_id: string }, producerId: string): boolean {
  return product.user_id === producerId;
}
