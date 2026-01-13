/**
 * Pixel Rate Limiting
 * 
 * Rate limiting específico para operações de pixel
 * Extraído de pixel-handlers.ts para manter < 300 linhas
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Types
// ============================================================================

interface RateLimitRecord {
  id: string;
  identifier: string;
  action: string;
  attempts: number;
  first_attempt_at: string;
  last_attempt_at: string;
  blocked_until: string | null;
}

interface SessionRecord {
  user_id: string;
  expires_at: string;
  is_valid: boolean;
}

// ============================================================================
// Rate Limiting
// ============================================================================

const MAX_ATTEMPTS = 30;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutos

export async function checkRateLimit(
  supabase: SupabaseClient,
  producerId: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const key = `pixel_${action}_${producerId}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  const { data: existing } = await supabase
    .from("buyer_rate_limits")
    .select("*")
    .eq("identifier", key)
    .eq("action", "pixel_management")
    .single();

  const record = existing as RateLimitRecord | null;

  if (record) {
    if (record.blocked_until && new Date(record.blocked_until) > now) {
      const retryAfter = Math.ceil(
        (new Date(record.blocked_until).getTime() - now.getTime()) / 1000
      );
      return { allowed: false, retryAfter };
    }

    if (new Date(record.first_attempt_at) < windowStart) {
      await supabase
        .from("buyer_rate_limits")
        .update({
          attempts: 1,
          first_attempt_at: now.toISOString(),
          last_attempt_at: now.toISOString(),
          blocked_until: null,
        })
        .eq("id", record.id);
      return { allowed: true };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      const blockedUntil = new Date(now.getTime() + WINDOW_MS);
      await supabase
        .from("buyer_rate_limits")
        .update({
          blocked_until: blockedUntil.toISOString(),
          last_attempt_at: now.toISOString(),
        })
        .eq("id", record.id);
      return { allowed: false, retryAfter: Math.ceil(WINDOW_MS / 1000) };
    }

    await supabase
      .from("buyer_rate_limits")
      .update({
        attempts: record.attempts + 1,
        last_attempt_at: now.toISOString(),
      })
      .eq("id", record.id);
    return { allowed: true };
  }

  await supabase.from("buyer_rate_limits").insert({
    identifier: key,
    action: "pixel_management",
    attempts: 1,
    first_attempt_at: now.toISOString(),
    last_attempt_at: now.toISOString(),
  });

  return { allowed: true };
}

// ============================================================================
// Session Validation
// ============================================================================

export async function validateProducerSession(
  supabase: SupabaseClient,
  sessionToken: string
): Promise<{ valid: boolean; producerId?: string; error?: string }> {
  if (!sessionToken) {
    return { valid: false, error: "Token de sessão não fornecido" };
  }

  const { data: session, error } = await supabase
    .from("producer_sessions")
    .select("user_id, expires_at, is_valid")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) {
    console.error("[pixel-management] Session not found:", error?.message);
    return { valid: false, error: "Sessão inválida" };
  }

  const sessionRecord = session as SessionRecord;

  if (!sessionRecord.is_valid) {
    return { valid: false, error: "Sessão foi invalidada" };
  }

  if (new Date(sessionRecord.expires_at) < new Date()) {
    return { valid: false, error: "Sessão expirada" };
  }

  return { valid: true, producerId: sessionRecord.user_id };
}
