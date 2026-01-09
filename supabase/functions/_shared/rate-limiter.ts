/**
 * Rate Limiter para Edge Functions
 * 
 * Implementa rate limiting baseado em IP usando a tabela buyer_rate_limits.
 * Inclui verificação de IP Blocklist para bloqueio persistente.
 * 
 * VULN-002: Rate limiting expandido para funções críticas
 * 
 * @version 2.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitConfig {
  /** Nome da ação (ex: 'buyer_auth_login', 'create_order') */
  action: string;
  /** Número máximo de tentativas permitidas */
  maxAttempts: number;
  /** Janela de tempo em minutos */
  windowMinutes: number;
  /** Tempo de bloqueio em minutos quando excede o limite */
  blockDurationMinutes: number;
}

export interface RateLimitResult {
  /** Se a requisição foi permitida */
  allowed: boolean;
  /** Número de tentativas restantes */
  remaining: number;
  /** Timestamp de quando o bloqueio expira (se bloqueado) */
  retryAfter?: string;
  /** Mensagem de erro (se bloqueado) */
  error?: string;
  /** Se o IP está na blocklist persistente */
  isBlocklisted?: boolean;
}

interface BlocklistCheckResult {
  blocked: boolean;
  reason: string | null;
  expires_at: string | null;
}

/**
 * Configurações pré-definidas para funções críticas
 */
export const RATE_LIMIT_CONFIGS = {
  // Login/Register - mais restritivo para prevenir brute force
  BUYER_AUTH_LOGIN: {
    action: "buyer_auth_login",
    maxAttempts: 5,
    windowMinutes: 15,
    blockDurationMinutes: 30,
  },
  BUYER_AUTH_REGISTER: {
    action: "buyer_auth_register",
    maxAttempts: 3,
    windowMinutes: 60,
    blockDurationMinutes: 60,
  },
  
  // Vault - sensível, limitar acesso
  VAULT_SAVE: {
    action: "vault_save",
    maxAttempts: 10,
    windowMinutes: 5,
    blockDurationMinutes: 15,
  },
  
  // Members area - permitir uso normal mas prevenir abuso (READ)
  MEMBERS_AREA: {
    action: "members_area",
    maxAttempts: 60,
    windowMinutes: 1,
    blockDurationMinutes: 5,
  },
  
  // Members area - escrita (mais restritivo)
  MEMBERS_AREA_WRITE: {
    action: "members_area_write",
    maxAttempts: 30,
    windowMinutes: 1,
    blockDurationMinutes: 5,
  },
  
  // Create order - moderado
  CREATE_ORDER: {
    action: "create_order",
    maxAttempts: 10,
    windowMinutes: 1,
    blockDurationMinutes: 5,
  },
  
  // Webhooks externos - mais permissivo
  WEBHOOK: {
    action: "webhook",
    maxAttempts: 100,
    windowMinutes: 1,
    blockDurationMinutes: 1,
  },
  
  // Decrypt data - sensível (dados PII)
  DECRYPT_DATA: {
    action: "decrypt_data",
    maxAttempts: 20,
    windowMinutes: 5,
    blockDurationMinutes: 15,
  },
  
  // Admin actions - muito restritivo
  ADMIN_ACTION: {
    action: "admin_action",
    maxAttempts: 30,
    windowMinutes: 5,
    blockDurationMinutes: 30,
  },
  
  // Send email - prevenir spam
  SEND_EMAIL: {
    action: "send_email",
    maxAttempts: 20,
    windowMinutes: 5,
    blockDurationMinutes: 10,
  },
  
  // Webhook test - moderado
  WEBHOOK_TEST: {
    action: "webhook_test",
    maxAttempts: 10,
    windowMinutes: 1,
    blockDurationMinutes: 5,
  },
  
  // Turnstile verify - moderado
  TURNSTILE_VERIFY: {
    action: "turnstile_verify",
    maxAttempts: 30,
    windowMinutes: 1,
    blockDurationMinutes: 5,
  },
  
  // Affiliation management
  AFFILIATION_MANAGE: {
    action: "affiliation_manage",
    maxAttempts: 20,
    windowMinutes: 5,
    blockDurationMinutes: 10,
  },
  
  // PIX creation
  CREATE_PIX: {
    action: "create_pix",
    maxAttempts: 15,
    windowMinutes: 1,
    blockDurationMinutes: 5,
  },
} as const;

/**
 * Extrai IP do request considerando proxies
 */
export function getClientIP(req: Request): string {
  // Cloudflare
  const cfIP = req.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;
  
  // X-Forwarded-For (pode ter múltiplos IPs)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  // X-Real-IP
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP;
  
  // Fallback
  return "unknown";
}

/**
 * Verifica se IP está na blocklist persistente
 */
export async function checkIPBlocklist(
  supabase: SupabaseClient,
  ipAddress: string
): Promise<BlocklistCheckResult> {
  try {
    const { data, error } = await supabase
      .rpc("is_ip_blocked", { p_ip_address: ipAddress });
    
    if (error) {
      console.error("[rate-limiter] Erro ao verificar blocklist:", error);
      // Fail open - permite se não conseguir verificar
      return { blocked: false, reason: null, expires_at: null };
    }
    
    // A função retorna um array com um resultado
    if (data && data.length > 0 && data[0].blocked) {
      return {
        blocked: true,
        reason: data[0].reason,
        expires_at: data[0].expires_at,
      };
    }
    
    return { blocked: false, reason: null, expires_at: null };
  } catch (error) {
    console.error("[rate-limiter] Erro inesperado ao verificar blocklist:", error);
    return { blocked: false, reason: null, expires_at: null };
  }
}

/**
 * Cria Response para IP bloqueado na blocklist
 */
export function createBlocklistResponse(result: BlocklistCheckResult): Response {
  const expiresMsg = result.expires_at 
    ? ` até ${new Date(result.expires_at).toLocaleString()}`
    : " permanentemente";
  
  return new Response(
    JSON.stringify({
      error: "Forbidden",
      message: `Acesso bloqueado${expiresMsg}. Motivo: ${result.reason || "Violações de segurança"}`,
      blocked_until: result.expires_at,
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Verifica e atualiza rate limit para uma ação
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);
  
  try {
    // 1. Buscar registro existente
    const { data: existing, error: fetchError } = await supabase
      .from("buyer_rate_limits")
      .select("*")
      .eq("identifier", identifier)
      .eq("action", config.action)
      .single();
    
    // 2. Se não existe, criar novo registro
    if (fetchError?.code === "PGRST116" || !existing) {
      const { error: insertError } = await supabase
        .from("buyer_rate_limits")
        .insert({
          identifier,
          action: config.action,
          attempts: 1,
          first_attempt_at: now.toISOString(),
          last_attempt_at: now.toISOString(),
        });
      
      if (insertError) {
        console.error("[rate-limiter] Erro ao inserir:", insertError);
        // Em caso de erro, permite a requisição (fail open para não bloquear)
        return { allowed: true, remaining: config.maxAttempts - 1 };
      }
      
      return { allowed: true, remaining: config.maxAttempts - 1 };
    }
    
    // 3. Se está bloqueado, verificar se o bloqueio expirou
    if (existing.blocked_until) {
      const blockedUntil = new Date(existing.blocked_until);
      if (blockedUntil > now) {
        return {
          allowed: false,
          remaining: 0,
          retryAfter: existing.blocked_until,
          error: `Muitas tentativas. Tente novamente após ${blockedUntil.toLocaleTimeString()}`,
        };
      }
      
      // Bloqueio expirou - resetar contadores
      const { error: resetError } = await supabase
        .from("buyer_rate_limits")
        .update({
          attempts: 1,
          first_attempt_at: now.toISOString(),
          last_attempt_at: now.toISOString(),
          blocked_until: null,
        })
        .eq("id", existing.id);
      
      if (resetError) {
        console.error("[rate-limiter] Erro ao resetar:", resetError);
      }
      
      return { allowed: true, remaining: config.maxAttempts - 1 };
    }
    
    // 4. Verificar se a janela expirou
    const firstAttempt = new Date(existing.first_attempt_at);
    if (firstAttempt < windowStart) {
      // Janela expirou - resetar contadores
      const { error: resetError } = await supabase
        .from("buyer_rate_limits")
        .update({
          attempts: 1,
          first_attempt_at: now.toISOString(),
          last_attempt_at: now.toISOString(),
        })
        .eq("id", existing.id);
      
      if (resetError) {
        console.error("[rate-limiter] Erro ao resetar janela:", resetError);
      }
      
      return { allowed: true, remaining: config.maxAttempts - 1 };
    }
    
    // 5. Verificar se excedeu o limite
    const newAttempts = existing.attempts + 1;
    
    if (newAttempts > config.maxAttempts) {
      // Excedeu - bloquear
      const blockedUntil = new Date(now.getTime() + config.blockDurationMinutes * 60 * 1000);
      
      const { error: blockError } = await supabase
        .from("buyer_rate_limits")
        .update({
          attempts: newAttempts,
          last_attempt_at: now.toISOString(),
          blocked_until: blockedUntil.toISOString(),
        })
        .eq("id", existing.id);
      
      if (blockError) {
        console.error("[rate-limiter] Erro ao bloquear:", blockError);
      }
      
      console.warn(`[rate-limiter] IP ${identifier} bloqueado para ${config.action} até ${blockedUntil.toISOString()}`);
      
      return {
        allowed: false,
        remaining: 0,
        retryAfter: blockedUntil.toISOString(),
        error: `Muitas tentativas. Tente novamente após ${blockedUntil.toLocaleTimeString()}`,
      };
    }
    
    // 6. Incrementar contador
    const { error: updateError } = await supabase
      .from("buyer_rate_limits")
      .update({
        attempts: newAttempts,
        last_attempt_at: now.toISOString(),
      })
      .eq("id", existing.id);
    
    if (updateError) {
      console.error("[rate-limiter] Erro ao incrementar:", updateError);
    }
    
    return { allowed: true, remaining: config.maxAttempts - newAttempts };
    
  } catch (error) {
    console.error("[rate-limiter] Erro inesperado:", error);
    // Fail open - permite a requisição em caso de erro
    return { allowed: true, remaining: config.maxAttempts };
  }
}

/**
 * Cria Response de erro para rate limit excedido
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too Many Requests",
      message: result.error || "Rate limit exceeded",
      retry_after: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": result.retryAfter || "60",
      },
    }
  );
}

/**
 * Middleware de rate limiting para Edge Functions
 * Agora inclui verificação de IP Blocklist ANTES do rate limit.
 * 
 * @example
 * const rateLimitResult = await rateLimitMiddleware(supabase, req, RATE_LIMIT_CONFIGS.BUYER_AUTH_LOGIN);
 * if (rateLimitResult) return rateLimitResult; // Retorna 403 ou 429 se bloqueado
 */
export async function rateLimitMiddleware(
  supabase: SupabaseClient,
  req: Request,
  config: RateLimitConfig
): Promise<Response | null> {
  const clientIP = getClientIP(req);
  
  // 1. PRIMEIRO: Verificar IP Blocklist (bloqueio persistente)
  const blocklistResult = await checkIPBlocklist(supabase, clientIP);
  if (blocklistResult.blocked) {
    console.warn(`[rate-limiter] IP ${clientIP} bloqueado na blocklist: ${blocklistResult.reason}`);
    return createBlocklistResponse(blocklistResult);
  }
  
  // 2. DEPOIS: Verificar Rate Limit (bloqueio temporário)
  const result = await checkRateLimit(supabase, clientIP, config);
  
  if (!result.allowed) {
    return createRateLimitResponse(result);
  }
  
  return null; // Permitido - continue processando
}

/**
 * Middleware simplificado que APENAS verifica blocklist (sem rate limit)
 * Útil para endpoints que já têm outro tipo de rate limiting
 */
export async function blocklistMiddleware(
  supabase: SupabaseClient,
  req: Request
): Promise<Response | null> {
  const clientIP = getClientIP(req);
  
  const blocklistResult = await checkIPBlocklist(supabase, clientIP);
  if (blocklistResult.blocked) {
    console.warn(`[blocklist] IP ${clientIP} bloqueado: ${blocklistResult.reason}`);
    return createBlocklistResponse(blocklistResult);
  }
  
  return null;
}
