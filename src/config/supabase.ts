/**
 * Supabase Configuration
 * 
 * RISE Protocol V3 - Zero Secrets in Frontend (10.0/10)
 * 
 * ARCHITECTURE:
 * - The frontend has ZERO API keys in the bundle
 * - The Cloudflare Worker (api.risecheckout.com) injects the publishable key
 *   automatically via Worker Secret
 * - Authentication uses httpOnly cookies:
 *   __Secure-rise_access + __Secure-rise_refresh (Domain=.risecheckout.com)
 * - All calls are proxied through the API Gateway
 * 
 * API KEY MIGRATION (2026):
 * - Legacy JWT-based anon/service_role keys are deprecated
 * - New publishable key (sb_publishable_...) replaces anon key
 * - New secret key (sb_secret_...) replaces service_role key
 * - The Cloudflare Worker secret must contain the new publishable key
 * 
 * @see docs/API_GATEWAY_ARCHITECTURE.md
 */

/**
 * API Gateway URL - The SINGLE entry point for all backend calls
 * 
 * This is a Cloudflare Worker that:
 * 1. Validates Origin (allowlist)
 * 2. Injects apikey header (publishable key from Worker Secret)
 * 3. Forwards cookies (credentials)
 * 4. Applies Security Headers
 */
export const API_GATEWAY_URL = "https://api.risecheckout.com";

/**
 * SUPABASE_URL - Alias for API_GATEWAY_URL
 * 
 * All requests are routed through the API Gateway.
 * This alias exists because many modules reference SUPABASE_URL
 * for Edge Function calls - these are proxied through the gateway.
 */
export const SUPABASE_URL = API_GATEWAY_URL;
