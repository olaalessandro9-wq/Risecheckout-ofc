/**
 * Frontend URL Builder
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Mirrors backend `supabase/functions/_shared/site-urls.ts` pattern.
 * Single Source of Truth for all URL construction in the frontend.
 * 
 * Architecture:
 * - Uses VITE_SITE_BASE_DOMAIN env var in production
 * - Falls back to window.location.origin in development
 * - Context-based subdomain mapping (members, checkout, dashboard)
 * 
 * Usage:
 * ```typescript
 * import { buildUrl, getBaseUrl } from "@/lib/urls";
 * 
 * // Build full URL with path
 * buildUrl('/pay/produto-x', 'checkout')
 * // → "https://pay.risecheckout.com/pay/produto-x"
 * 
 * // Get base URL for context
 * getBaseUrl('members')
 * // → "https://aluno.risecheckout.com"
 * ```
 * 
 * @module lib/urls
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * URL context determining subdomain prefix.
 * Must match backend `site-urls.ts` exactly.
 */
export type UrlContext = 'default' | 'members' | 'checkout' | 'dashboard';

// ============================================================================
// SUBDOMAIN MAPPING (Single Source of Truth)
// ============================================================================

/**
 * Maps URL contexts to subdomain prefixes.
 * Keep in sync with backend `_shared/site-urls.ts`.
 */
const SUBDOMAIN_MAP: Record<UrlContext, string> = {
  default: '',           // risecheckout.com
  members: 'aluno.',     // aluno.risecheckout.com
  checkout: 'pay.',      // pay.risecheckout.com
  dashboard: 'app.',     // app.risecheckout.com
};

// ============================================================================
// BASE DOMAIN
// ============================================================================

/**
 * Production fallback domain.
 * Used when no env var is configured.
 */
const FALLBACK_DOMAIN = 'risecheckout.com';

/**
 * Gets the base domain from environment or window.
 * 
 * Priority:
 * 1. VITE_SITE_BASE_DOMAIN env var (production)
 * 2. window.location.host (development)
 * 3. Fallback: risecheckout.com
 */
function getBaseDomain(): string {
  // In production, prefer env var
  const envDomain = import.meta.env.VITE_SITE_BASE_DOMAIN;
  if (envDomain) {
    // Clean up: remove protocol and trailing slash
    return envDomain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
  }
  
  // In development, use current origin's host
  if (import.meta.env.DEV) {
    return window.location.host;
  }
  
  // Final fallback for SSR or missing config
  return FALLBACK_DOMAIN;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Builds a full URL for the given path and context.
 * 
 * @param path - URL path (e.g., "/pay/produto-x", "/afiliar/123")
 * @param context - Subdomain context (default, members, checkout, dashboard)
 * @returns Full URL with correct subdomain
 * 
 * @example
 * ```typescript
 * // Checkout subdomain
 * buildUrl('/pay/produto-x', 'checkout')
 * // → "https://pay.risecheckout.com/pay/produto-x"
 * 
 * // Default domain (no subdomain)
 * buildUrl('/afiliar/123', 'default')
 * // → "https://risecheckout.com/afiliar/123"
 * 
 * // Members area
 * buildUrl('/minha-conta', 'members')
 * // → "https://aluno.risecheckout.com/minha-conta"
 * 
 * // Development mode (always uses localhost)
 * buildUrl('/pay/x', 'checkout') // in dev
 * // → "http://localhost:5173/pay/x"
 * ```
 */
export function buildUrl(path: string, context: UrlContext = 'default'): string {
  const baseDomain = getBaseDomain();
  const subdomain = SUBDOMAIN_MAP[context] || '';
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // In development, don't add subdomain (single localhost)
  if (import.meta.env.DEV) {
    return `${window.location.origin}${cleanPath}`;
  }
  
  // Production: build full URL with subdomain
  return `https://${subdomain}${baseDomain}${cleanPath}`;
}

/**
 * Gets the base URL for a context (without path).
 * 
 * Useful when you need just the origin for configuration.
 * 
 * @param context - Subdomain context
 * @returns Base URL for the context
 * 
 * @example
 * ```typescript
 * getBaseUrl('checkout')
 * // → "https://pay.risecheckout.com"
 * 
 * getBaseUrl('members')
 * // → "https://aluno.risecheckout.com"
 * 
 * getBaseUrl() // or 'default'
 * // → "https://risecheckout.com"
 * ```
 */
export function getBaseUrl(context: UrlContext = 'default'): string {
  const baseDomain = getBaseDomain();
  const subdomain = SUBDOMAIN_MAP[context] || '';
  
  // In development, use current origin
  if (import.meta.env.DEV) {
    return window.location.origin;
  }
  
  return `https://${subdomain}${baseDomain}`;
}

/**
 * Transforms a URL to always use the production domain.
 * 
 * Replaces any origin with the production domain.
 * Useful for displaying links that users will copy.
 * 
 * @param originalUrl - URL with any origin (e.g., localhost URL)
 * @param context - Target subdomain context
 * @returns URL with production domain
 * 
 * @example
 * ```typescript
 * toProductionUrl('http://localhost:5173/pay/xyz', 'checkout')
 * // → "https://pay.risecheckout.com/pay/xyz"
 * 
 * toProductionUrl('https://preview.lovable.app/afiliar/123', 'default')
 * // → "https://risecheckout.com/afiliar/123"
 * ```
 */
export function toProductionUrl(originalUrl: string, context: UrlContext = 'default'): string {
  // Extract path from original URL
  const pathMatch = originalUrl.replace(/^https?:\/\/[^/]+/, '');
  return buildUrl(pathMatch, context);
}
