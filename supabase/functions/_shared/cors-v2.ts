/**
 * CORS V2 Configuration - Environment-Based Separation
 * 
 * RISE Protocol V3 Compliant - 10.0/10 Security
 * 
 * Architecture:
 * - PRODUCTION: Uses CORS_ALLOWED_ORIGINS secret (no localhost)
 * - DEVELOPMENT: Uses CORS_ALLOWED_ORIGINS_DEV secret (includes localhost)
 * 
 * Fail-Secure: If secret is missing, ALL requests are blocked.
 * 
 * @version 2.0.0 - Environment separation
 */

import { createLogger } from "./logger.ts";

const log = createLogger("CORS-V2");

// ============================================================================
// SINGLETON CACHE
// ============================================================================

let cachedOrigins: Set<string> | null = null;
let cachedEnvironment: "production" | "development" | null = null;

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Detects the current environment from the ENVIRONMENT secret.
 * Defaults to 'production' if not set (fail-secure).
 */
function getEnvironment(): "production" | "development" {
  if (cachedEnvironment) return cachedEnvironment;
  
  const env = Deno.env.get("ENVIRONMENT")?.toLowerCase();
  cachedEnvironment = env === "development" ? "development" : "production";
  
  log.info(`Environment detected: ${cachedEnvironment}`);
  return cachedEnvironment;
}

// ============================================================================
// ORIGINS LOADING
// ============================================================================

/**
 * Loads allowed origins from the appropriate secret based on environment.
 * Returns an empty Set if secret is missing (fail-secure).
 */
function loadAllowedOrigins(): Set<string> {
  if (cachedOrigins) return cachedOrigins;
  
  const env = getEnvironment();
  const secretName = env === "development" 
    ? "CORS_ALLOWED_ORIGINS_DEV" 
    : "CORS_ALLOWED_ORIGINS";
  
  const originsRaw = Deno.env.get(secretName);
  
  if (!originsRaw) {
    log.error(`🚨 CRITICAL: Secret ${secretName} not configured - blocking ALL origins`);
    cachedOrigins = new Set();
    return cachedOrigins;
  }
  
  // Parse CSV into Set for O(1) lookup
  const origins = originsRaw
    .split(",")
    .map(o => o.trim())
    .filter(o => o.length > 0);
  
  cachedOrigins = new Set(origins);
  log.info(`Loaded ${cachedOrigins.size} allowed origins from ${secretName}`);
  
  return cachedOrigins;
}

// ============================================================================
// CORS HEADERS
// ============================================================================

const CORS_ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-correlation-id",
].join(", ");

const CORS_ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS";
const CORS_MAX_AGE = "86400";

/**
 * Builds CORS headers for a valid origin.
 */
function buildCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": CORS_ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": CORS_ALLOWED_METHODS,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": CORS_MAX_AGE,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Returns CORS headers if origin is valid, null otherwise.
 * 
 * @param origin - Origin header from request
 * @returns CORS headers or null if origin is blocked
 */
export function getCorsHeadersV2(origin: string | null): Record<string, string> | null {
  const allowedOrigins = loadAllowedOrigins();
  
  // No origin (server-to-server) - use first allowed origin if available
  if (!origin) {
    const firstOrigin = allowedOrigins.values().next().value;
    if (!firstOrigin) {
      log.warn("No origin provided and no allowed origins configured");
      return null;
    }
    return buildCorsHeaders(firstOrigin);
  }
  
  // Check if origin is in allowed set (O(1) lookup)
  if (!allowedOrigins.has(origin)) {
    log.warn(`Origin blocked: ${origin}`);
    return null;
  }
  
  return buildCorsHeaders(origin);
}

/**
 * Creates a 403 Forbidden response for unauthorized origins.
 */
export function createCorsErrorResponseV2(): Response {
  return new Response(
    JSON.stringify({ 
      error: "Forbidden", 
      message: "Origin not allowed" 
    }),
    { 
      status: 403, 
      headers: { "Content-Type": "application/json" } 
    }
  );
}

/**
 * Main CORS handler for Edge Functions.
 * 
 * Returns:
 * - Response: for preflight or blocked origins (caller should return this)
 * - { headers }: for valid origins (caller should use these headers)
 */
export function handleCorsV2(req: Request): { headers: Record<string, string> } | Response {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeadersV2(origin);

  // Invalid origin - return 403
  if (!corsHeaders) {
    return createCorsErrorResponseV2();
  }

  // Preflight request - return OK with CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Valid origin - return headers for use
  return { headers: corsHeaders };
}

/**
 * CORS headers for public webhooks (payment gateways, etc.)
 * 
 * WARNING: Use with caution - allows any origin
 */
export const PUBLIC_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": CORS_ALLOWED_HEADERS,
  "Access-Control-Allow-Methods": CORS_ALLOWED_METHODS,
  "Access-Control-Max-Age": CORS_MAX_AGE,
};
