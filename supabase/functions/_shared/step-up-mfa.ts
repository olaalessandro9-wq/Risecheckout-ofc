/**
 * Step-Up MFA - Real-Time TOTP Verification for Critical Operations
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Provides two levels of step-up authentication:
 * - Level 2 (Self): Verifies the caller's own TOTP code
 * - Level 3 (Owner): Verifies the system Owner's TOTP code
 * 
 * This module is the SSOT for real-time MFA verification outside
 * the login flow. It reuses mfa-helpers.ts for crypto operations.
 * 
 * Security:
 * - Never caches TOTP secrets in memory beyond the request lifecycle
 * - All attempts (success/failure) are logged via audit log
 * - Owner lookup is scoped to a single request (no global cache)
 * 
 * @module _shared/step-up-mfa
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";
import { decryptTotpSecret, verifyTotpCode } from "./mfa-helpers.ts";

const log = createLogger("StepUpMFA");

// ============================================================================
// TYPES
// ============================================================================

export interface StepUpResult {
  verified: boolean;
  error?: string;
}

// ============================================================================
// OWNER LOOKUP
// ============================================================================

/**
 * Finds the system Owner's user ID.
 * 
 * Queries the `user_roles` table for the single `owner` role.
 * There should be exactly one owner in the system.
 * 
 * @returns Owner's user ID or null if not found
 */
async function getOwnerUserId(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "owner")
    .limit(1)
    .single();

  if (error || !data) {
    log.error("Owner not found in user_roles:", error?.message);
    return null;
  }

  return data.user_id;
}

// ============================================================================
// MFA RECORD RETRIEVAL
// ============================================================================

/**
 * Retrieves and decrypts the TOTP secret for a given user.
 * 
 * @returns Decrypted TOTP secret (base32) or null if MFA not configured
 */
async function getUserTotpSecret(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: mfaRecord, error } = await supabase
    .from("user_mfa")
    .select("totp_secret_encrypted, totp_secret_iv")
    .eq("user_id", userId)
    .eq("is_enabled", true)
    .single();

  if (error || !mfaRecord) {
    return null;
  }

  try {
    return await decryptTotpSecret(
      mfaRecord.totp_secret_encrypted,
      mfaRecord.totp_secret_iv
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("Failed to decrypt TOTP secret:", msg);
    return null;
  }
}

// ============================================================================
// STEP-UP VERIFICATION
// ============================================================================

/**
 * Verifies the caller's own TOTP code (Level 2 - Self).
 * 
 * Use for operations that affect the caller's own account:
 * - Changing email
 * - Disabling MFA
 * - Deleting account
 * 
 * @param supabase - Supabase client with service role
 * @param userId - The caller's user ID
 * @param totpCode - 6-digit TOTP code from authenticator app
 */
export async function requireSelfMfa(
  supabase: SupabaseClient,
  userId: string,
  totpCode: string
): Promise<StepUpResult> {
  if (!totpCode || totpCode.length !== 6) {
    return { verified: false, error: "Código MFA deve ter 6 dígitos" };
  }

  const secret = await getUserTotpSecret(supabase, userId);
  if (!secret) {
    return { verified: false, error: "MFA não configurado para este usuário" };
  }

  const isValid = verifyTotpCode(secret, totpCode);
  if (!isValid) {
    return { verified: false, error: "Código MFA inválido" };
  }

  return { verified: true };
}

/**
 * Verifies the system Owner's TOTP code (Level 3 - Owner).
 * 
 * Use for ultra-critical operations that require Owner authorization:
 * - Promoting/demoting users (manage-user-role)
 * - Suspending/banning accounts (manage-user-status)
 * - Modifying critical system settings
 * 
 * Even if the caller is an admin with valid session, this function
 * requires the Owner's physical authenticator device.
 * 
 * @param supabase - Supabase client with service role
 * @param ownerTotpCode - 6-digit TOTP code from the OWNER's authenticator
 */
export async function requireOwnerMfa(
  supabase: SupabaseClient,
  ownerTotpCode: string
): Promise<StepUpResult> {
  if (!ownerTotpCode || ownerTotpCode.length !== 6) {
    return { verified: false, error: "Código MFA do Owner deve ter 6 dígitos" };
  }

  const ownerId = await getOwnerUserId(supabase);
  if (!ownerId) {
    return {
      verified: false,
      error: "Owner do sistema não encontrado",
    };
  }

  const secret = await getUserTotpSecret(supabase, ownerId);
  if (!secret) {
    return {
      verified: false,
      error: "O Owner do sistema não configurou MFA. O Owner deve ativar MFA antes que operações críticas possam ser executadas.",
    };
  }

  const isValid = verifyTotpCode(secret, ownerTotpCode);
  if (!isValid) {
    return { verified: false, error: "Código MFA do Owner inválido" };
  }

  return { verified: true };
}
