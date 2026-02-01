/**
 * Shared Test Infrastructure for gdpr-forget
 * 
 * @module gdpr-forget/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "gdpr-forget";

// ============================================================================
// DATA CATEGORIES
// ============================================================================

export const DATA_TO_DELETE = [
  "profile",
  "sessions",
  "preferences",
  "security_logs",
] as const;

export type DataCategory = typeof DATA_TO_DELETE[number];

export function isDataCategory(category: string): category is DataCategory {
  return (DATA_TO_DELETE as readonly string[]).includes(category);
}

// ============================================================================
// PRESERVED DATA
// ============================================================================

export const PRESERVED_DATA = [
  "transactions",
  "invoices",
  "tax_records",
] as const;

export type PreservedCategory = typeof PRESERVED_DATA[number];

// ============================================================================
// GDPR RULES
// ============================================================================

export interface GdprRules {
  selfDeletionAllowed: boolean;
  requiresConfirmation: boolean;
  anonymizationSupported: boolean;
  preserveTransactions: boolean;
  blocksActiveOrders: boolean;
  sendsConfirmation: boolean;
}

export const GDPR_RULES: GdprRules = {
  selfDeletionAllowed: true,
  requiresConfirmation: true,
  anonymizationSupported: true,
  preserveTransactions: true,
  blocksActiveOrders: true,
  sendsConfirmation: true,
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function canDelete(hasActiveOrders: boolean): boolean {
  return !hasActiveOrders;
}
