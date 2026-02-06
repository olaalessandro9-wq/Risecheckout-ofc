/**
 * Check-Secrets Edge Function - Shared Test Utilities
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * @module check-secrets/tests/_shared
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SecretStatus {
  configured: boolean;
  category: string;
}

export interface CategorySummary {
  configured: number;
  total: number;
}

export interface SecretsReport {
  timestamp: string;
  summary: {
    total: number;
    configured: number;
    missing: number;
    percentage: string;
  };
  secrets: Record<string, SecretStatus>;
  categories: Record<string, CategorySummary>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const EXPECTED_CATEGORIES = [
  "supabase",
  "mercadopago",
  "stripe",
  "pushinpay",
  "asaas",
  "platform",
] as const;

export const EXPECTED_SECRETS: Record<string, string> = {
  // Supabase Core (4) - env var names kept by Supabase, values are new-format keys
  'SUPABASE_URL': 'supabase',
  'SUPABASE_ANON_KEY': 'supabase', // Contains publishable key (sb_publishable_...)
  'SUPABASE_SERVICE_ROLE_KEY': 'supabase', // Contains secret key (sb_secret_...)
  'SUPABASE_DB_URL': 'supabase',
  
  // Mercado Pago (5)
  'MERCADOPAGO_ACCESS_TOKEN': 'mercadopago',
  'MERCADOPAGO_CLIENT_SECRET': 'mercadopago',
  'MERCADOPAGO_REDIRECT_URI': 'mercadopago',
  'MERCADOPAGO_WEBHOOK_SECRET': 'mercadopago',
  'MERCADOPAGO_COLLECTOR_ID': 'mercadopago',
  
  // Stripe (3)
  'STRIPE_SECRET_KEY': 'stripe',
  'STRIPE_WEBHOOK_SECRET': 'stripe',
  'STRIPE_CLIENT_ID': 'stripe',
  
  // PushinPay (5)
  'PUSHINPAY_API_TOKEN': 'pushinpay',
  'PUSHINPAY_WEBHOOK_TOKEN': 'pushinpay',
  'PUSHINPAY_PLATFORM_ACCOUNT_ID': 'pushinpay',
  'PUSHINPAY_BASE_URL_PROD': 'pushinpay',
  'PUSHINPAY_BASE_URL_SANDBOX': 'pushinpay',
  
  // Asaas (3)
  'ASAAS_API_KEY': 'asaas',
  'ASAAS_PLATFORM_WALLET_ID': 'asaas',
  'ASAAS_WEBHOOK_TOKEN': 'asaas',
  
  // Platform (2)
  'PLATFORM_FEE_PERCENT': 'platform',
  'INTERNAL_WEBHOOK_SECRET': 'platform',
};

export const TOTAL_EXPECTED_SECRETS = Object.keys(EXPECTED_SECRETS).length;

export const SECRETS_BY_CATEGORY: Record<string, string[]> = {
  supabase: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_DB_URL'],
  mercadopago: ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_CLIENT_SECRET', 'MERCADOPAGO_REDIRECT_URI', 'MERCADOPAGO_WEBHOOK_SECRET', 'MERCADOPAGO_COLLECTOR_ID'],
  stripe: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_CLIENT_ID'],
  pushinpay: ['PUSHINPAY_API_TOKEN', 'PUSHINPAY_WEBHOOK_TOKEN', 'PUSHINPAY_PLATFORM_ACCOUNT_ID', 'PUSHINPAY_BASE_URL_PROD', 'PUSHINPAY_BASE_URL_SANDBOX'],
  asaas: ['ASAAS_API_KEY', 'ASAAS_PLATFORM_WALLET_ID', 'ASAAS_WEBHOOK_TOKEN'],
  platform: ['PLATFORM_FEE_PERCENT', 'INTERNAL_WEBHOOK_SECRET'],
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validates percentage format (e.g., "85.5%")
 */
export function isValidPercentage(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^\d+(\.\d+)?%$/.test(value);
}

/**
 * Calculates missing count from total and configured
 */
export function calculateMissing(total: number, configured: number): number {
  return total - configured;
}

/**
 * Gets secrets for a specific category
 */
export function getCategorySecrets(category: string): string[] {
  return SECRETS_BY_CATEGORY[category] || [];
}

/**
 * Calculates percentage of configured secrets
 */
export function calculatePercentage(configured: number, total: number): string {
  if (total === 0) return "0.0%";
  return `${((configured / total) * 100).toFixed(1)}%`;
}

/**
 * Validates SecretsReport structure
 */
export function isValidSecretsReport(report: unknown): report is SecretsReport {
  if (typeof report !== "object" || report === null) return false;
  
  const r = report as Record<string, unknown>;
  
  return (
    typeof r.timestamp === "string" &&
    typeof r.summary === "object" && r.summary !== null &&
    typeof r.secrets === "object" && r.secrets !== null &&
    typeof r.categories === "object" && r.categories !== null
  );
}
