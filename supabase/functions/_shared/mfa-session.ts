/**
 * MFA Session Management
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Manages temporary tokens for the MFA verification window.
 * Tokens are short-lived (5 minutes) and single-use, with
 * built-in rate limiting (max 5 attempts per session).
 * 
 * Architecture:
 * - Token stored in `mfa_sessions` table (service_role only)
 * - Token is consumed after successful verification
 * - Attempt counter prevents brute-force attacks
 * 
 * @module _shared/mfa-session
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("MFA-Session");

// ============================================================================
// CONSTANTS
// ============================================================================

const MFA_SESSION_DURATION_MINUTES = 5;
const MFA_MAX_ATTEMPTS = 5;

// ============================================================================
// TYPES
// ============================================================================

export interface MfaSessionData {
  userId: string;
  token: string;
  expiresAt: string;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Creates a temporary MFA session token.
 * Valid for 5 minutes, max 5 verification attempts.
 */
export async function createMfaSession(
  supabase: SupabaseClient,
  userId: string
): Promise<MfaSessionData | null> {
  const token = crypto.randomUUID() + "-" + crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + MFA_SESSION_DURATION_MINUTES * 60 * 1000
  ).toISOString();

  const { error } = await supabase.from("mfa_sessions").insert({
    user_id: userId,
    token,
    expires_at: expiresAt,
    is_used: false,
    attempts: 0,
    max_attempts: MFA_MAX_ATTEMPTS,
  });

  if (error) {
    log.error("Failed to create MFA session:", error.message);
    return null;
  }

  return { userId, token, expiresAt };
}

/**
 * Validates an MFA session token.
 * Checks: exists, not used, not expired, not maxed attempts.
 */
export async function validateMfaSession(
  supabase: SupabaseClient,
  token: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("mfa_sessions")
    .select("id, user_id, expires_at, is_used, attempts, max_attempts")
    .eq("token", token)
    .single();

  if (error || !data) {
    return { valid: false, error: "Token MFA inválido" };
  }

  if (data.is_used) {
    return { valid: false, error: "Token MFA já utilizado" };
  }

  if (data.expires_at < now) {
    return { valid: false, error: "Token MFA expirado" };
  }

  if (data.attempts >= data.max_attempts) {
    return { valid: false, error: "Máximo de tentativas excedido" };
  }

  return { valid: true, userId: data.user_id };
}

/**
 * Increments the attempt counter for an MFA session.
 */
export async function incrementMfaAttempts(
  supabase: SupabaseClient,
  token: string
): Promise<void> {
  const { data } = await supabase
    .from("mfa_sessions")
    .select("attempts")
    .eq("token", token)
    .single();

  if (data) {
    await supabase
      .from("mfa_sessions")
      .update({ attempts: data.attempts + 1 })
      .eq("token", token);
  }
}

/**
 * Marks an MFA session as consumed (single-use).
 */
export async function consumeMfaSession(
  supabase: SupabaseClient,
  token: string
): Promise<void> {
  await supabase
    .from("mfa_sessions")
    .update({ is_used: true })
    .eq("token", token);
}
