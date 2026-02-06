/**
 * Supabase Client Factory - Multi-Secret Key Architecture
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Centralizes ALL Supabase client creation with domain-based secret isolation.
 * Each domain maps to a separate secret key for blast-radius containment:
 * 
 * - webhooks: Inbound/outbound payment callbacks
 * - payments: Order creation, gateway integrations
 * - admin:    Security, encryption, GDPR, vault
 * - general:  Auth, CRUD, UI features (auto-injected by Supabase)
 * 
 * If a domain-specific key is not configured, falls back to 'general'
 * (SUPABASE_SERVICE_ROLE_KEY) for zero-downtime migration.
 * 
 * Usage:
 * ```typescript
 * import { getSupabaseClient } from "../_shared/supabase-client.ts";
 * 
 * const supabase = getSupabaseClient('payments');
 * const { data } = await supabase.from('orders').select();
 * ```
 * 
 * @module _shared/supabase-client
 * @version 2.0.0
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("SupabaseClient");

// Re-export for consumers that need the type
export type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Functional domains for secret key isolation.
 * Each domain maps to a separate Supabase secret key.
 */
export type SecretDomain = "webhooks" | "payments" | "admin" | "general";

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
// DOMAIN → ENV VAR MAPPING (SSOT)
// ============================================================================

/**
 * Single Source of Truth: maps each domain to its environment variable name.
 * 
 * To add a new domain:
 * 1. Add entry here
 * 2. Create the secret key in Supabase Dashboard
 * 3. Set the env var in Edge Functions secrets
 * 
 * To rotate a key:
 * 1. Create new key in Dashboard
 * 2. Update the env var value
 * 3. Revoke old key
 */
const DOMAIN_KEY_MAP: Record<SecretDomain, string> = {
  webhooks: "SUPABASE_SECRET_WEBHOOKS",
  payments: "SUPABASE_SECRET_PAYMENTS",
  admin: "SUPABASE_SECRET_ADMIN",
  general: "SUPABASE_SERVICE_ROLE_KEY",
};

// ============================================================================
// PER-DOMAIN CLIENT CACHE
// ============================================================================

const domainClients: Partial<Record<SecretDomain, SupabaseClient>> = {};

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

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
 * Gets a secret key for a specific domain, with fallback to general.
 * @returns The secret key value, or null if neither domain nor general key exists
 */
function getSecretKeyForDomain(domain: SecretDomain): string | null {
  const envVar = DOMAIN_KEY_MAP[domain];
  const key = Deno.env.get(envVar);

  if (key) return key;

  // Fallback to general key during migration
  if (domain !== "general") {
    log.warn(
      `Secret for domain '${domain}' (${envVar}) not found, falling back to general`
    );
    return Deno.env.get(DOMAIN_KEY_MAP.general) ?? null;
  }

  return null;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Gets or creates a Supabase client for the specified domain (cached).
 * 
 * Each domain uses a separate secret key for blast-radius isolation.
 * If the domain-specific key is not configured, falls back to the
 * general key (SUPABASE_SERVICE_ROLE_KEY) automatically.
 * 
 * @param domain - The functional domain ('webhooks' | 'payments' | 'admin' | 'general')
 * @throws SupabaseConfigError if SUPABASE_URL is missing or no key is available
 * @returns Cached Supabase client for the domain
 * 
 * @example
 * ```typescript
 * // In a webhook handler:
 * const supabase = getSupabaseClient('webhooks');
 * 
 * // In a payment handler:
 * const supabase = getSupabaseClient('payments');
 * 
 * // In an admin handler:
 * const supabase = getSupabaseClient('admin');
 * 
 * // Default (general) - backward compatible:
 * const supabase = getSupabaseClient();
 * ```
 */
export function getSupabaseClient(domain: SecretDomain = "general"): SupabaseClient {
  if (domainClients[domain]) return domainClients[domain]!;

  const url = getSupabaseUrl();
  const key = getSecretKeyForDomain(domain);

  if (!key) {
    throw new SupabaseConfigError(
      `No secret key available for domain '${domain}' (${DOMAIN_KEY_MAP[domain]}) and no fallback key found`
    );
  }

  // If we fell back to general, cache under 'general' to avoid duplicates
  const actualDomain =
    domain !== "general" && !Deno.env.get(DOMAIN_KEY_MAP[domain])
      ? "general"
      : domain;

  if (actualDomain !== domain && domainClients["general"]) {
    // Reuse existing general client
    domainClients[domain] = domainClients["general"];
    return domainClients[domain]!;
  }

  const client = createClient(url, key);
  domainClients[actualDomain] = client;

  if (actualDomain !== domain) {
    // Also cache under the requested domain for future lookups
    domainClients[domain] = client;
  }

  log.debug(`Supabase client initialized for domain: ${domain}${actualDomain !== domain ? " (fallback to general)" : ""}`);
  return client;
}

/**
 * Creates a fresh (non-cached) Supabase client for a domain.
 * 
 * Use when you need isolation:
 * - Unit testing
 * - Background jobs with separate contexts
 * - Transactions requiring fresh connections
 * 
 * @param domain - The functional domain
 * @throws SupabaseConfigError if configuration is missing
 * @returns New Supabase client instance
 */
export function createFreshSupabaseClient(domain: SecretDomain = "general"): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getSecretKeyForDomain(domain);

  if (!key) {
    throw new SupabaseConfigError(
      `No secret key available for domain '${domain}'`
    );
  }

  log.debug(`Creating fresh Supabase client for domain: ${domain}`);
  return createClient(url, key);
}

/**
 * Validates that Supabase configuration exists for all domains.
 * 
 * Use for early validation or diagnostics.
 * 
 * @returns Object with validation results per domain
 */
export function validateSupabaseConfig(): {
  valid: boolean;
  missing: string[];
  domains: Record<SecretDomain, { configured: boolean; envVar: string }>;
} {
  const missing: string[] = [];
  const domains = {} as Record<SecretDomain, { configured: boolean; envVar: string }>;

  if (!Deno.env.get("SUPABASE_URL")) {
    missing.push("SUPABASE_URL");
  }

  for (const [domain, envVar] of Object.entries(DOMAIN_KEY_MAP)) {
    const configured = !!Deno.env.get(envVar);
    domains[domain as SecretDomain] = { configured, envVar };
    if (!configured) {
      missing.push(envVar);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    domains,
  };
}

// ============================================================================
// INTERNAL (FOR TESTING)
// ============================================================================

/**
 * Resets all cached clients.
 * @internal Only for testing purposes
 */
export function _resetClientCache(): void {
  for (const key of Object.keys(domainClients)) {
    delete domainClients[key as SecretDomain];
  }
}
