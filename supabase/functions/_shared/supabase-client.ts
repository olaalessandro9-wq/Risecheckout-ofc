/**
 * Supabase Client Factory
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Centralizes Supabase client creation with:
 * - Environment validation
 * - Consistent error handling
 * - Logging integration
 * - Singleton pattern with optional fresh instances
 * 
 * Usage:
 * ```typescript
 * import { getSupabaseClient } from "../_shared/supabase-client.ts";
 * 
 * const supabase = getSupabaseClient();
 * const { data } = await supabase.from('users').select();
 * ```
 * 
 * @module _shared/supabase-client
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("SupabaseClient");

// ============================================================================
// TYPES
// ============================================================================

/**
 * Error thrown when Supabase configuration is missing
 */
export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

// ============================================================================
// CLIENT SINGLETON
// ============================================================================

let cachedClient: SupabaseClient | null = null;

/**
 * Gets the Supabase URL from environment.
 * @throws SupabaseConfigError if not configured
 */
function getSupabaseUrl(): string {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) {
    throw new SupabaseConfigError("SUPABASE_URL not configured");
  }
  return url;
}

/**
 * Gets the Supabase Service Role Key from environment.
 * @throws SupabaseConfigError if not configured
 */
function getServiceRoleKey(): string {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) {
    throw new SupabaseConfigError("SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  return key;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Gets or creates the Supabase service role client (singleton).
 * 
 * Uses a cached instance for performance. For isolated contexts (testing),
 * use `createSupabaseClient()` instead.
 * 
 * @throws SupabaseConfigError if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing
 * @returns Supabase client with service role permissions
 * 
 * @example
 * ```typescript
 * import { getSupabaseClient } from "../_shared/supabase-client.ts";
 * 
 * const supabase = getSupabaseClient();
 * const { data, error } = await supabase.from('orders').select('*');
 * ```
 */
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = getSupabaseUrl();
  const key = getServiceRoleKey();

  cachedClient = createClient(url, key);
  log.debug("Supabase client initialized (cached)");
  
  return cachedClient;
}

/**
 * Creates a fresh Supabase client (non-cached).
 * 
 * Use when you need isolation:
 * - Unit testing
 * - Background jobs with separate contexts
 * - Transactions requiring fresh connections
 * 
 * @throws SupabaseConfigError if configuration is missing
 * @returns New Supabase client instance
 * 
 * @example
 * ```typescript
 * // In tests or isolated contexts
 * const supabase = createSupabaseClient();
 * ```
 */
export function createSupabaseClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  
  log.debug("Creating fresh Supabase client");
  return createClient(url, key);
}

/**
 * Validates that Supabase configuration exists.
 * 
 * Use for early validation before starting expensive operations.
 * 
 * @returns Object with validation result and missing secrets
 * 
 * @example
 * ```typescript
 * const validation = validateSupabaseConfig();
 * if (!validation.valid) {
 *   log.error("Missing config:", validation.missing);
 *   return errorResponse("Database not configured");
 * }
 * ```
 */
export function validateSupabaseConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!Deno.env.get("SUPABASE_URL")) {
    missing.push("SUPABASE_URL");
  }
  if (!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

// ============================================================================
// INTERNAL (FOR TESTING)
// ============================================================================

/**
 * Resets the cached client.
 * 
 * @internal Only for testing purposes
 */
export function _resetClientCache(): void {
  cachedClient = null;
}
