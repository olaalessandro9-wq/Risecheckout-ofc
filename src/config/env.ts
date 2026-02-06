/**
 * Environment Flags Helper
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Centralizes all environment detection and configuration flags.
 * Eliminates scattered `import.meta.env.DEV` checks across codebase.
 * 
 * Usage:
 * ```typescript
 * import { isDev, isProd, isPreview } from "@/config/env";
 * 
 * if (isDev) {
 *   console.log("Debug mode enabled");
 * }
 * ```
 * 
 * @module config/env
 * @version 1.0.0
 */

// ============================================================================
// ENVIRONMENT FLAGS
// ============================================================================

/**
 * True when running in development mode (npm run dev).
 * Use for debug logging, mock data, etc.
 */
export const isDev: boolean = import.meta.env.DEV;

/**
 * True when running in production mode (npm run build).
 * Use for production-only features like analytics, error reporting.
 */
export const isProd: boolean = import.meta.env.PROD;

/**
 * True when running in Lovable preview (lovable.app domain).
 * Use for preview-specific behavior.
 */
export const isPreview: boolean = 
  typeof window !== 'undefined' && 
  window.location.hostname.includes('lovable.app');

/**
 * True when running on the production domain.
 * Uses VITE_SITE_BASE_DOMAIN if configured, fallback to risecheckout.com check.
 */
export const isProductionDomain: boolean =
  typeof window !== 'undefined' &&
  (import.meta.env.VITE_SITE_BASE_DOMAIN
    ? window.location.hostname.includes(import.meta.env.VITE_SITE_BASE_DOMAIN)
    : window.location.hostname.includes('risecheckout.com'));

// ============================================================================
// MODE HELPERS
// ============================================================================

/**
 * Current mode string for logging/debugging.
 */
export const mode: string = import.meta.env.MODE;

/**
 * Base URL from environment (if configured).
 */
export const siteBaseDomain: string | undefined = 
  import.meta.env.VITE_SITE_BASE_DOMAIN;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Whether to enable verbose logging.
 * Enabled in dev mode or when explicitly set.
 */
export const verboseLogging: boolean = 
  isDev || import.meta.env.VITE_VERBOSE_LOGGING === 'true';

/**
 * Whether to enable Sentry error reporting.
 * Only in production and when DSN is configured.
 */
export const sentryEnabled: boolean =
  isProd && !!import.meta.env.VITE_SENTRY_DSN;

// ============================================================================
// NOTE: Supabase configuration is in src/config/supabase.ts (API Gateway)
// The frontend does NOT use any Supabase keys directly.
// All requests are proxied through the Cloudflare Worker (api.risecheckout.com)
// which injects the publishable key automatically.
// ============================================================================
