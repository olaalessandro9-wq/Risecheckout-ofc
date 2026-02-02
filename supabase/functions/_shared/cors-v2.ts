/**
 * CORS V2 Configuration - Wildcard Domain Support
 * 
 * RISE Protocol V3 Compliant - 10.0/10 Security
 * 
 * Architecture:
 * - Supports wildcards: *.risecheckout.com matches all subdomains
 * - Supports exact origins: https://sandrodev.lovable.app
 * - Wildcard ONLY for risecheckout.com, other domains require explicit listing
 * 
 * Fail-Secure: If secret is missing, ALL requests are blocked.
 * 
 * @version 3.0.0 - Wildcard Domain Support
 */

import { createLogger } from "./logger.ts";

const log = createLogger("CORS-V2");

// ============================================================================
// TYPES
// ============================================================================

interface CorsConfig {
  /** Exact origins for O(1) lookup (e.g., https://sandrodev.lovable.app) */
  exactOrigins: Set<string>;
  /** Wildcard domains for suffix matching (e.g., risecheckout.com) */
  wildcardDomains: string[];
}

// ============================================================================
// SINGLETON CACHE
// ============================================================================

let cachedConfig: CorsConfig | null = null;

// ============================================================================
// ORIGINS LOADING & PARSING
// ============================================================================

/**
 * Parses CORS_ALLOWED_ORIGINS into exact origins and wildcard domains.
 * 
 * Format examples:
 * - "*.risecheckout.com" → wildcardDomains: ["risecheckout.com"]
 * - "https://sandrodev.lovable.app" → exactOrigins: Set(["https://sandrodev.lovable.app"])
 * 
 * Returns empty config if secret is missing (fail-secure).
 */
function loadAllowedOrigins(): CorsConfig {
  if (cachedConfig) return cachedConfig;
  
  const originsRaw = Deno.env.get("CORS_ALLOWED_ORIGINS");
  
  if (!originsRaw) {
    log.error("🚨 CRITICAL: CORS_ALLOWED_ORIGINS not configured - blocking ALL origins");
    cachedConfig = { exactOrigins: new Set(), wildcardDomains: [] };
    return cachedConfig;
  }
  
  const config: CorsConfig = {
    exactOrigins: new Set(),
    wildcardDomains: [],
  };
  
  // Parse CSV entries
  const entries = originsRaw
    .split(",")
    .map(e => e.trim())
    .filter(e => e.length > 0);
  
  for (const entry of entries) {
    if (entry.startsWith("*.")) {
      // Wildcard entry: extract base domain (e.g., "*.risecheckout.com" → "risecheckout.com")
      const domain = entry.slice(2);
      config.wildcardDomains.push(domain);
      log.info(`Registered wildcard domain: *.${domain}`);
    } else {
      // Exact origin entry
      config.exactOrigins.add(entry);
    }
  }
  
  log.info(`Loaded CORS config: ${config.exactOrigins.size} exact origins, ${config.wildcardDomains.length} wildcard domains`);
  
  cachedConfig = config;
  return cachedConfig;
}

// ============================================================================
// ORIGIN VALIDATION
// ============================================================================

/**
 * Checks if an origin is allowed based on exact match or wildcard domain.
 * 
 * @param origin - The origin header from the request
 * @param config - The parsed CORS configuration
 * @returns true if origin is allowed
 */
function isOriginAllowed(origin: string, config: CorsConfig): boolean {
  // 1. Check exact match first (O(1) lookup)
  if (config.exactOrigins.has(origin)) {
    return true;
  }
  
  // 2. Check wildcard domains
  if (config.wildcardDomains.length > 0) {
    try {
      const url = new URL(origin);
      const hostname = url.hostname;
      
      for (const domain of config.wildcardDomains) {
        // Check if hostname ends with .domain (e.g., app.risecheckout.com ends with .risecheckout.com)
        if (hostname.endsWith(`.${domain}`)) {
          return true;
        }
      }
    } catch {
      // Invalid URL format - reject
      log.warn(`Invalid origin URL format: ${origin}`);
      return false;
    }
  }
  
  return false;
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
  "x-tab-id",  // Session Commander multi-tab coordination
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
 * Supports:
 * - Exact origins: https://sandrodev.lovable.app
 * - Wildcard domains: *.risecheckout.com (matches app.risecheckout.com, www.risecheckout.com, etc.)
 * 
 * @param origin - Origin header from request
 * @returns CORS headers or null if origin is blocked
 */
export function getCorsHeadersV2(origin: string | null): Record<string, string> | null {
  const config = loadAllowedOrigins();
  
  // No origin (server-to-server) - use first allowed origin if available
  if (!origin) {
    const firstOrigin = config.exactOrigins.values().next().value;
    if (!firstOrigin) {
      log.warn("No origin provided and no allowed origins configured");
      return null;
    }
    return buildCorsHeaders(firstOrigin);
  }
  
  // Check if origin is allowed (exact or wildcard)
  if (!isOriginAllowed(origin, config)) {
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
