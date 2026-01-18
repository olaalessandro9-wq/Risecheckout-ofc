/**
 * Rate Limiting Service
 * 
 * Lógica principal de rate limiting usando buyer_rate_limits.
 * 
 * @version 1.0.0 - RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { RateLimitConfig, RateLimitResult, RateLimitRecord } from "./types.ts";

// ============================================================================
// IP Extraction
// ============================================================================

/**
 * Extrai o IP do cliente da requisição
 * 
 * @param req - Request HTTP
 * @returns Endereço IP ou "unknown"
 */
export function getClientIP(req: Request): string {
  // Ordem de prioridade para headers de IP
  const headers = [
    "cf-connecting-ip",     // Cloudflare
    "x-real-ip",            // Nginx
    "x-forwarded-for",      // Proxies
    "x-client-ip",          // Outros
  ];

  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      // x-forwarded-for pode ter múltiplos IPs, pegar o primeiro
      const ip = value.split(",")[0].trim();
      if (ip && ip !== "unknown") {
        return ip;
      }
    }
  }

  return "unknown";
}

/**
 * Gera um identificador para rate limiting
 * 
 * @param req - Request HTTP
 * @param userId - ID do usuário (opcional)
 * @param preferUserId - Se deve preferir userId sobre IP
 * @returns Identificador único
 */
export function getIdentifier(
  req: Request,
  userId?: string,
  preferUserId: boolean = false
): string {
  if (preferUserId && userId) {
    return `user:${userId}`;
  }

  const ip = getClientIP(req);
  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${ip}`;
}

// ============================================================================
// Core Rate Limiting
// ============================================================================

/**
 * Verifica se uma requisição deve ser limitada
 * 
 * @param supabase - Cliente Supabase
 * @param identifier - Identificador (IP ou userId)
 * @param config - Configuração de rate limit
 * @returns Resultado da verificação
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowMs = config.windowMinutes * 60 * 1000;
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    // Buscar registro existente
    const { data: existing, error: fetchError } = await supabase
      .from("buyer_rate_limits")
      .select("*")
      .eq("identifier", identifier)
      .eq("action", config.action)
      .maybeSingle();

    if (fetchError) {
      console.error("[rate-limit] Fetch error:", fetchError.message);
      // Em caso de erro, permitir a requisição (fail-open)
      return { allowed: true, remaining: config.maxAttempts };
    }

    const record = existing as RateLimitRecord | null;

    // Se não há registro, criar um novo
    if (!record) {
      await supabase.from("buyer_rate_limits").insert({
        identifier,
        action: config.action,
        attempts: 1,
        first_attempt_at: now.toISOString(),
        last_attempt_at: now.toISOString(),
      });

      return { allowed: true, remaining: config.maxAttempts - 1 };
    }

    // Verificar se está bloqueado
    if (record.blocked_until) {
      const blockedUntil = new Date(record.blocked_until);
      if (blockedUntil > now) {
        return {
          allowed: false,
          remaining: 0,
          retryAfter: record.blocked_until,
          error: `Rate limit excedido. Tente novamente após ${blockedUntil.toISOString()}`,
        };
      }
      // Bloqueio expirou, resetar
      await resetRecord(supabase, record.id, now);
      return { allowed: true, remaining: config.maxAttempts - 1 };
    }

    // Verificar se a janela expirou
    const firstAttempt = new Date(record.first_attempt_at);
    if (firstAttempt < windowStart) {
      // Janela expirou, resetar
      await resetRecord(supabase, record.id, now);
      return { allowed: true, remaining: config.maxAttempts - 1 };
    }

    // Verificar se excedeu o limite
    if (record.attempts >= config.maxAttempts) {
      // Bloquear por blockDurationMinutes
      const blockedUntil = new Date(
        now.getTime() + config.blockDurationMinutes * 60 * 1000
      );

      await supabase
        .from("buyer_rate_limits")
        .update({
          blocked_until: blockedUntil.toISOString(),
          last_attempt_at: now.toISOString(),
        })
        .eq("id", record.id);

      return {
        allowed: false,
        remaining: 0,
        retryAfter: blockedUntil.toISOString(),
        error: `Rate limit excedido. Tente novamente após ${blockedUntil.toISOString()}`,
      };
    }

    // Incrementar contador
    await supabase
      .from("buyer_rate_limits")
      .update({
        attempts: record.attempts + 1,
        last_attempt_at: now.toISOString(),
      })
      .eq("id", record.id);

    return {
      allowed: true,
      remaining: config.maxAttempts - record.attempts - 1,
    };
  } catch (err) {
    console.error("[rate-limit] Unexpected error:", err);
    // Em caso de erro, permitir a requisição (fail-open)
    return { allowed: true, remaining: config.maxAttempts };
  }
}

/**
 * Reseta um registro de rate limit
 */
async function resetRecord(
  supabase: SupabaseClient,
  recordId: string,
  now: Date
): Promise<void> {
  await supabase
    .from("buyer_rate_limits")
    .update({
      attempts: 1,
      first_attempt_at: now.toISOString(),
      last_attempt_at: now.toISOString(),
      blocked_until: null,
    })
    .eq("id", recordId);
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Cria response 429 para rate limit excedido
 * 
 * @param result - Resultado da verificação
 * @param corsHeaders - Headers CORS
 * @returns Response 429
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: result.error || "Muitas requisições. Tente novamente mais tarde.",
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": result.retryAfter || "60",
      },
    }
  );
}
