/**
 * Shared Test Infrastructure for gdpr-forget
 * 
 * @module gdpr-forget/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig, skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "gdpr-forget";

const config = getTestConfig();

export function getFunctionUrl(): string {
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
    : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
}

// ============================================================================
// RE-EXPORT CENTRALIZED TEST HELPERS
// ============================================================================

export { skipIntegration, integrationTestOptions };

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

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export interface ForgetPayload {
  email?: string;
  confirmation_token?: string;
}

export function createPayload(overrides: Partial<ForgetPayload> = {}): ForgetPayload {
  return {
    email: "test@example.com",
    ...overrides,
  };
}

export function createMockRequest(payload: ForgetPayload = {}): Request {
  return new Request(getFunctionUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
