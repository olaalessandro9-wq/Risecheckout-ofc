/**
 * Site URL Builder - Wildcard Subdomain Support
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Architecture (follows cors-v2.ts pattern):
 * - Single secret: SITE_BASE_DOMAIN (e.g., "risecheckout.com")
 * - Context determines subdomain prefix
 * - Zero config for new subdomains (just add to SUBDOMAIN_MAP)
 * 
 * Usage:
 * - buildSiteUrl('/path', 'members') → https://aluno.risecheckout.com/path
 * - buildSiteUrl('/path', 'checkout') → https://pay.risecheckout.com/path
 * - buildSiteUrl('/path') → https://risecheckout.com/path
 * 
 * @version 1.0.0
 */

import { createLogger } from "./logger.ts";

const log = createLogger("SiteUrls");

// ============================================================================
// TYPES
// ============================================================================

export type UrlContext = 'default' | 'members' | 'checkout' | 'dashboard';

// ============================================================================
// SUBDOMAIN MAPPING (Single Source of Truth)
// ============================================================================

/**
 * Maps URL contexts to subdomain prefixes.
 * To add a new subdomain: add entry here, deploy. Done.
 * Zero configuration of secrets required.
 */
const SUBDOMAIN_MAP: Record<UrlContext, string> = {
  default: '',           // risecheckout.com
  members: 'aluno.',     // aluno.risecheckout.com
  checkout: 'pay.',      // pay.risecheckout.com
  dashboard: 'app.',     // app.risecheckout.com
};

// ============================================================================
// URL BUILDING
// ============================================================================

let cachedBaseDomain: string | null = null;

/**
 * Loads the base domain from environment.
 * 
 * RISE V3: SITE_BASE_DOMAIN is now REQUIRED.
 * No legacy fallbacks - ensures explicit configuration.
 * 
 * @throws Error if SITE_BASE_DOMAIN is not configured
 */
function getBaseDomain(): string {
  if (cachedBaseDomain) return cachedBaseDomain;
  
  const domain = Deno.env.get("SITE_BASE_DOMAIN");
  
  if (!domain) {
    log.error("SITE_BASE_DOMAIN not configured - this is required");
    throw new Error("SITE_BASE_DOMAIN environment variable is required");
  }
  
  // Clean up: remove protocol and trailing slash if accidentally included
  cachedBaseDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  
  log.info(`Site base domain resolved: ${cachedBaseDomain}`);
  return cachedBaseDomain;
}

/**
 * Builds a full URL for the given path and context.
 * 
 * @param path - The URL path (e.g., "/minha-conta/setup-acesso?token=xyz")
 * @param context - The subdomain context (members, checkout, dashboard, or default)
 * @returns Full URL with correct subdomain
 * 
 * @example
 * buildSiteUrl('/minha-conta', 'members') 
 * // → "https://aluno.risecheckout.com/minha-conta"
 * 
 * buildSiteUrl('/redefinir-senha?token=abc')
 * // → "https://risecheckout.com/redefinir-senha?token=abc"
 * 
 * buildSiteUrl('/pay/produto-x', 'checkout')
 * // → "https://pay.risecheckout.com/pay/produto-x"
 */
export function buildSiteUrl(path: string, context: UrlContext = 'default'): string {
  const baseDomain = getBaseDomain();
  const subdomain = SUBDOMAIN_MAP[context] || '';
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Build full URL
  const fullUrl = `https://${subdomain}${baseDomain}${cleanPath}`;
  
  return fullUrl;
}

/**
 * Gets the base URL for a context (without path).
 * Useful when you need just the origin.
 * 
 * @example
 * getSiteBaseUrl('members') // → "https://aluno.risecheckout.com"
 * getSiteBaseUrl()          // → "https://risecheckout.com"
 */
export function getSiteBaseUrl(context: UrlContext = 'default'): string {
  const baseDomain = getBaseDomain();
  const subdomain = SUBDOMAIN_MAP[context] || '';
  return `https://${subdomain}${baseDomain}`;
}

// ============================================================================
// RESET CACHE (for testing)
// ============================================================================

/**
 * Resets the cached domain (useful for testing).
 * @internal
 */
export function _resetCache(): void {
  cachedBaseDomain = null;
}
