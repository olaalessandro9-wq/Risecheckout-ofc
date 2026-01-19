/**
 * Rate Limiting Middleware
 * 
 * Middleware unificado para Edge Functions.
 * 
 * @version 2.0.0 - Centralized Logger
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { RateLimitConfig } from "./types.ts";
import { checkIPBlocklist, createBlocklistResponse } from "./blocklist.ts";
import {
  checkRateLimit,
  createRateLimitResponse,
  getClientIP,
  getIdentifier,
} from "./service.ts";
import { createLogger } from "../logger.ts";

const log = createLogger("RateLimitMiddleware");

// ============================================================================
// Full Middleware (Blocklist + Rate Limit)
// ============================================================================

/**
 * Middleware completo: verifica blocklist E rate limit
 * 
 * @param supabase - Cliente Supabase
 * @param req - Request HTTP
 * @param config - Configuração de rate limit
 * @param corsHeaders - Headers CORS
 * @param userId - ID do usuário (opcional, para rate limit por usuário)
 * @returns Response se bloqueado, null se permitido
 */
export async function rateLimitMiddleware(
  supabase: SupabaseClient,
  req: Request,
  config: RateLimitConfig,
  corsHeaders: Record<string, string>,
  userId?: string
): Promise<Response | null> {
  // 1. Verificar blocklist
  const ip = getClientIP(req);
  const blocklistResult = await checkIPBlocklist(supabase, ip);

  if (blocklistResult.blocked) {
    log.warn(`IP blocked: ${ip}`);
    return createBlocklistResponse(blocklistResult, corsHeaders);
  }

  // 2. Verificar rate limit
  const identifier = getIdentifier(req, userId);
  const rateLimitResult = await checkRateLimit(supabase, identifier, config);

  if (!rateLimitResult.allowed) {
    log.warn(`Rate limited: ${identifier}`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  // Permitido
  return null;
}

// ============================================================================
// Blocklist-Only Middleware
// ============================================================================

/**
 * Middleware apenas de blocklist (para funções que já têm rate limit próprio)
 * 
 * @param supabase - Cliente Supabase
 * @param req - Request HTTP
 * @param corsHeaders - Headers CORS
 * @returns Response se bloqueado, null se permitido
 */
export async function blocklistMiddleware(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  const ip = getClientIP(req);
  const result = await checkIPBlocklist(supabase, ip);

  if (result.blocked) {
    log.warn(`IP blocked: ${ip}`);
    return createBlocklistResponse(result, corsHeaders);
  }

  return null;
}

// ============================================================================
// Rate-Limit-Only Middleware
// ============================================================================

/**
 * Middleware apenas de rate limit (para funções que já verificam blocklist)
 * 
 * @param supabase - Cliente Supabase
 * @param req - Request HTTP
 * @param config - Configuração de rate limit
 * @param corsHeaders - Headers CORS
 * @param userId - ID do usuário (opcional)
 * @returns Response se limitado, null se permitido
 */
export async function rateLimitOnlyMiddleware(
  supabase: SupabaseClient,
  req: Request,
  config: RateLimitConfig,
  corsHeaders: Record<string, string>,
  userId?: string
): Promise<Response | null> {
  const identifier = getIdentifier(req, userId);
  const result = await checkRateLimit(supabase, identifier, config);

  if (!result.allowed) {
    log.warn(`Rate limited: ${identifier}`);
    return createRateLimitResponse(result, corsHeaders);
  }

  return null;
}
