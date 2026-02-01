/**
 * Health Edge Function - Shared Test Utilities
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * @module health/tests/_shared
 */

// ============================================================================
// TYPES
// ============================================================================

export interface HealthResponse {
  status: "OK" | "ERROR";
  timestamp: string;
  services: {
    database: "healthy" | "unhealthy";
    edgeFunction: "healthy" | "unhealthy";
  };
  responseTime: string;
}

export interface HealthErrorResponse {
  status: "ERROR";
  timestamp: string;
  error: string;
  responseTime: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALID_STATUSES = ["OK", "ERROR"] as const;
export const VALID_SERVICE_STATUSES = ["healthy", "unhealthy"] as const;
export const SERVICE_NAMES = ["database", "edgeFunction"] as const;

export const REQUIRED_FIELDS = ["status", "timestamp", "responseTime"] as const;
export const REQUIRED_OK_FIELDS = ["status", "timestamp", "services", "responseTime"] as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validates ISO 8601 timestamp format
 */
export function isValidTimestamp(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validates response time format (e.g., "123ms")
 */
export function isValidResponseTime(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^\d+ms$/.test(value);
}

/**
 * Checks if status indicates healthy state
 */
export function isHealthyStatus(status: unknown): boolean {
  return status === "OK";
}

/**
 * Extracts milliseconds from responseTime string
 */
export function parseResponseTimeMs(responseTime: string): number {
  const match = responseTime.match(/^(\d+)ms$/);
  return match ? parseInt(match[1], 10) : -1;
}

/**
 * Validates complete HealthResponse structure
 */
export function isValidHealthResponse(response: unknown): response is HealthResponse {
  if (typeof response !== "object" || response === null) return false;
  
  const r = response as Record<string, unknown>;
  
  return (
    VALID_STATUSES.includes(r.status as typeof VALID_STATUSES[number]) &&
    isValidTimestamp(r.timestamp) &&
    isValidResponseTime(r.responseTime) &&
    typeof r.services === "object" &&
    r.services !== null
  );
}
