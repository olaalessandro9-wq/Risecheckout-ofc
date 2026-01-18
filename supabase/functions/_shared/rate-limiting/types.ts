/**
 * Rate Limiting Types
 * 
 * Interfaces compartilhadas para o sistema de rate limiting.
 * 
 * @version 1.0.0 - RISE V3 Compliant
 * @see docs/EDGE_FUNCTIONS_REGISTRY.md
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuração de rate limiting para uma ação específica
 */
export interface RateLimitConfig {
  /** Identificador da ação (ex: "buyer_auth_login") */
  action: string;
  /** Número máximo de tentativas permitidas na janela */
  maxAttempts: number;
  /** Duração da janela em minutos */
  windowMinutes: number;
  /** Duração do bloqueio em minutos quando limite é excedido */
  blockDurationMinutes: number;
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Resultado da verificação de rate limiting
 */
export interface RateLimitResult {
  /** Se a requisição é permitida */
  allowed: boolean;
  /** Tentativas restantes na janela */
  remaining: number;
  /** Timestamp ISO de quando o bloqueio expira (se bloqueado) */
  retryAfter?: string;
  /** Mensagem de erro (se bloqueado) */
  error?: string;
  /** Se o IP está na blocklist permanente */
  isBlocklisted?: boolean;
}

/**
 * Resultado da verificação de blocklist
 */
export interface BlocklistResult {
  /** Se o IP está bloqueado */
  blocked: boolean;
  /** Razão do bloqueio (se bloqueado) */
  reason: string | null;
  /** Data de expiração do bloqueio (se temporário) */
  expiresAt: string | null;
}

// ============================================================================
// Database Record Types
// ============================================================================

/**
 * Registro na tabela buyer_rate_limits
 */
export interface RateLimitRecord {
  id: string;
  identifier: string;
  action: string;
  attempts: number;
  first_attempt_at: string;
  last_attempt_at: string;
  blocked_until: string | null;
  created_at: string;
}

// ============================================================================
// Function Signatures
// ============================================================================

/**
 * Tipo da função checkRateLimit
 */
export type CheckRateLimitFn = (
  supabase: SupabaseClient,
  identifier: string,
  config: RateLimitConfig
) => Promise<RateLimitResult>;

/**
 * Tipo da função checkIPBlocklist
 */
export type CheckIPBlocklistFn = (
  supabase: SupabaseClient,
  ipAddress: string
) => Promise<BlocklistResult>;
