/**
 * Shared Test Infrastructure for gdpr-request
 * 
 * @module gdpr-request/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "gdpr-request";

export interface TestConfig {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
}

export function getTestConfig(): TestConfig {
  return {
    supabaseUrl: Deno.env.get("VITE_SUPABASE_URL"),
    supabaseAnonKey: Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY"),
  };
}

export function getFunctionUrl(): string {
  const config = getTestConfig();
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
    : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
}

// ============================================================================
// INTEGRATION TEST HELPERS
// ============================================================================

export function skipIntegration(): boolean {
  const config = getTestConfig();
  return !config.supabaseUrl || !config.supabaseAnonKey;
}

export const integrationTestOptions = {
  sanitizeOps: false,
  sanitizeResources: false,
};

// ============================================================================
// DATA CATEGORIES
// ============================================================================

export const DATA_CATEGORIES = [
  "profile",
  "orders",
  "payments",
  "sessions",
  "security_logs",
  "preferences",
] as const;

export type DataCategory = typeof DATA_CATEGORIES[number];

export function isDataCategory(category: string): category is DataCategory {
  return (DATA_CATEGORIES as readonly string[]).includes(category);
}

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export const SUPPORTED_FORMATS = ["json", "csv"] as const;

export type ExportFormat = typeof SUPPORTED_FORMATS[number];

export function isSupportedFormat(format: string): format is ExportFormat {
  return (SUPPORTED_FORMATS as readonly string[]).includes(format);
}

// ============================================================================
// GDPR RULES
// ============================================================================

export interface GdprRequestRules {
  selfRequestAllowed: boolean;
  supportsFormats: readonly ExportFormat[];
  hasDownloadLink: boolean;
  sendsEmailNotification: boolean;
  downloadLinkExpirationDays: number;
}

export const GDPR_REQUEST_RULES: GdprRequestRules = {
  selfRequestAllowed: true,
  supportsFormats: SUPPORTED_FORMATS,
  hasDownloadLink: true,
  sendsEmailNotification: true,
  downloadLinkExpirationDays: 7,
};

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export interface RequestPayload {
  email?: string;
  format?: ExportFormat;
}

export function createPayload(overrides: Partial<RequestPayload> = {}): RequestPayload {
  return {
    email: "test@example.com",
    format: "json",
    ...overrides,
  };
}

export function createMockRequest(payload: RequestPayload = {}): Request {
  return new Request(getFunctionUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
