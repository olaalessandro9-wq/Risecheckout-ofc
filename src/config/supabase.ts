/**
 * Supabase Configuration
 * 
 * RISE Protocol V3 - Zero Secrets in Frontend (10.0/10)
 * 
 * ARCHITECTURE:
 * - O frontend NÃO possui acesso a nenhuma chave de API
 * - O Cloudflare Worker (api.risecheckout.com) injeta o apikey automaticamente
 * - Cookies httpOnly (__Secure-rise_access, __Secure-rise_refresh) com Domain=.risecheckout.com
 * - Todas as chamadas passam pelo API Gateway que centraliza segurança
 * 
 * @see docs/API_GATEWAY_ARCHITECTURE.md
 */

/**
 * API Gateway URL - The SINGLE entry point for all backend calls
 * 
 * This is a Cloudflare Worker that:
 * 1. Validates Origin (allowlist)
 * 2. Injects apikey header (from Worker Secret)
 * 3. Forwards cookies (credentials)
 * 4. Proxies to Supabase Edge Functions
 */
export const API_GATEWAY_URL = "https://api.risecheckout.com";

/**
 * @deprecated Use API_GATEWAY_URL instead
 * Mantido para compatibilidade durante migração
 */
export const SUPABASE_URL = API_GATEWAY_URL;
