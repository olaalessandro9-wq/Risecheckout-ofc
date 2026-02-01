/**
 * Test-Deploy Edge Function - Shared Test Utilities
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * @module test-deploy/tests/_shared
 */

// ============================================================================
// TYPES
// ============================================================================

export interface EnvironmentInfo {
  deno_version: string;
  typescript_version: string;
}

export interface DeployResponse {
  status: "ok" | "error";
  message: string;
  created_at: string;
  test_id: string;
  environment: EnvironmentInfo;
}

export interface DeployErrorResponse {
  status: "error";
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALID_STATUSES = ["ok", "error"] as const;

export const REQUIRED_FIELDS = [
  "status",
  "message",
  "created_at",
  "test_id",
  "environment",
] as const;

export const REQUIRED_ENVIRONMENT_FIELDS = [
  "deno_version",
  "typescript_version",
] as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validates UUID v4 format
 */
export function isValidUUID(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(value);
}

/**
 * Validates ISO 8601 timestamp format
 */
export function isValidTimestamp(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validates version string format (e.g., "1.40.0")
 */
export function isValidVersionString(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^\d+\.\d+(\.\d+)?$/.test(value);
}

/**
 * Checks if status indicates success
 */
export function isSuccessStatus(status: unknown): boolean {
  return status === "ok";
}

/**
 * Validates DeployResponse structure
 */
export function isValidDeployResponse(response: unknown): response is DeployResponse {
  if (typeof response !== "object" || response === null) return false;
  
  const r = response as Record<string, unknown>;
  
  return (
    VALID_STATUSES.includes(r.status as typeof VALID_STATUSES[number]) &&
    typeof r.message === "string" &&
    isValidTimestamp(r.created_at) &&
    isValidUUID(r.test_id) &&
    typeof r.environment === "object" && r.environment !== null
  );
}

/**
 * Validates EnvironmentInfo structure
 */
export function isValidEnvironmentInfo(env: unknown): env is EnvironmentInfo {
  if (typeof env !== "object" || env === null) return false;
  
  const e = env as Record<string, unknown>;
  
  return (
    typeof e.deno_version === "string" &&
    typeof e.typescript_version === "string"
  );
}
