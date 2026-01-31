/**
 * Shared Types & Mock Data for integration-management Tests
 * 
 * @module integration-management/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export type IntegrationAction = 
  | "save-credentials" | "disconnect" | "init-oauth" | "status" 
  | "save-profile-wallet" | "clear-profile-wallet" | "update-profile";

export type IntegrationType = "MERCADOPAGO" | "STRIPE" | "ASAAS" | "PUSHINPAY";

export interface IntegrationRequest {
  action?: IntegrationAction;
  integrationType?: IntegrationType;
  integrationId?: string;
  config?: Record<string, unknown>;
  walletId?: string;
  name?: string;
  cpf_cnpj?: string;
  phone?: string;
}

export interface IntegrationResponse {
  success?: boolean;
  error?: string;
  data?: unknown;
  oauth_url?: string;
  credentials?: {
    mercadopago: { configured: boolean };
    pushinpay: { configured: boolean };
    stripe: { configured: boolean };
    asaas: { configured: boolean };
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_PRODUCER = { id: "producer-001", email: "producer@example.com" };

export const MOCK_MP_CONFIG = { public_key: "TEST-public-key-123", access_token: "TEST-access-token-456", sandbox_mode: true };
export const MOCK_STRIPE_CONFIG = { publishable_key: "pk_test_123", secret_key: "sk_test_456" };
export const MOCK_ASAAS_CONFIG = { api_key: "$aact_test_123", sandbox_mode: true, environment: "sandbox" };
export const MOCK_PUSHINPAY_CONFIG = { pushinpay_token: "token-123", pushinpay_account_id: "account-456" };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function extractAction(urlPath: string, bodyAction: string | null): string | null {
  if (bodyAction) return bodyAction;
  const parts = urlPath.split("/");
  const last = parts.pop();
  if (last && last !== "integration-management") return last;
  return null;
}

export function isValidAction(action: string): boolean {
  const validActions = ["save-credentials", "disconnect", "init-oauth", "status", "save-profile-wallet", "clear-profile-wallet", "update-profile"];
  return validActions.includes(action);
}

export function isValidIntegrationType(type: unknown): type is IntegrationType {
  const validTypes = ["MERCADOPAGO", "STRIPE", "ASAAS", "PUSHINPAY"];
  return typeof type === "string" && validTypes.includes(type);
}

export function validateConfig(type: IntegrationType, config: Record<string, unknown>): string | null {
  switch (type) {
    case "MERCADOPAGO": if (!config.public_key) return "public_key required"; if (!config.access_token) return "access_token required"; break;
    case "STRIPE": if (!config.publishable_key) return "publishable_key required"; break;
    case "ASAAS": if (!config.api_key) return "api_key required"; break;
    case "PUSHINPAY": if (!config.pushinpay_token) return "pushinpay_token required"; break;
  }
  return null;
}

export function checkCredentialsConfigured(): IntegrationResponse["credentials"] {
  return { mercadopago: { configured: true }, pushinpay: { configured: false }, stripe: { configured: true }, asaas: { configured: false } };
}
