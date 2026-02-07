/**
 * MFA Verify Handler
 * 
 * Validates TOTP code (or backup code) during login flow.
 * Uses temporary MFA session token (5 min window).
 * On success, creates full session with httpOnly cookies.
 * 
 * Flow:
 * 1. Validate MFA session token (from login response)
 * 2. Retrieve encrypted TOTP secret from user_mfa
 * 3. Verify TOTP code or backup code
 * 4. On failure: increment attempts (max 5)
 * 5. On success: consume MFA session, create full auth session
 * 
 * @module unified-auth/handlers/mfa-verify
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse } from "../../_shared/response-helpers.ts";
import {
  resolveUserSessionContext,
  createAuthResponse,
  type AppRole,
} from "../../_shared/unified-auth-v2.ts";
import {
  decryptTotpSecret,
  verifyTotpCode,
  verifyBackupCode,
} from "../../_shared/mfa-helpers.ts";
import {
  validateMfaSession,
  incrementMfaAttempts,
  consumeMfaSession,
} from "../../_shared/mfa-session.ts";

const log = createLogger("UnifiedAuth:MFA-Verify");

interface MfaVerifyRequest {
  mfa_session_token: string;
  code: string;
  is_backup_code?: boolean;
}

export async function handleMfaVerify(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: MfaVerifyRequest = await req.json();

    if (!body.mfa_session_token || !body.code) {
      return errorResponse(
        "Token MFA e código são obrigatórios",
        corsHeaders,
        400
      );
    }

    // Validate MFA session
    const sessionValidation = await validateMfaSession(
      supabase,
      body.mfa_session_token
    );
    if (!sessionValidation.valid) {
      return errorResponse(
        sessionValidation.error || "Sessão MFA inválida",
        corsHeaders,
        401
      );
    }

    const userId = sessionValidation.userId!;

    // Get MFA record
    const { data: mfaRecord, error: mfaError } = await supabase
      .from("user_mfa")
      .select(
        "totp_secret_encrypted, totp_secret_iv, backup_codes_hash, backup_codes_used"
      )
      .eq("user_id", userId)
      .eq("is_enabled", true)
      .single();

    if (mfaError || !mfaRecord) {
      return errorResponse("MFA não configurado", corsHeaders, 400);
    }

    let verified = false;

    if (body.is_backup_code) {
      // Verify backup code
      const allHashes: string[] = mfaRecord.backup_codes_hash || [];
      const usedHashes = new Set<string>(mfaRecord.backup_codes_used || []);
      const availableHashes = allHashes.filter((h) => !usedHashes.has(h));

      const matchIndex = verifyBackupCode(body.code, availableHashes);

      if (matchIndex >= 0) {
        verified = true;

        // Mark backup code as used (store the hash itself)
        const matchedHash = availableHashes[matchIndex];
        const updatedUsed = [
          ...(mfaRecord.backup_codes_used || []),
          matchedHash,
        ];

        await supabase
          .from("user_mfa")
          .update({
            backup_codes_used: updatedUsed,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        log.info("Backup code used", {
          userId,
          remainingCodes: availableHashes.length - 1,
        });
      }
    } else {
      // Verify TOTP code
      const totpSecret = await decryptTotpSecret(
        mfaRecord.totp_secret_encrypted,
        mfaRecord.totp_secret_iv
      );

      verified = verifyTotpCode(totpSecret, body.code);
    }

    if (!verified) {
      await incrementMfaAttempts(supabase, body.mfa_session_token);
      return errorResponse("Código inválido", corsHeaders, 401);
    }

    // === SUCCESS: Create full auth session ===

    // Consume MFA session (single-use)
    await consumeMfaSession(supabase, body.mfa_session_token);

    // Update MFA last_used_at
    await supabase
      .from("user_mfa")
      .update({ last_used_at: new Date().toISOString() })
      .eq("user_id", userId);

    // Get user data for session context
    const { data: user } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", userId)
      .single();

    if (!user) {
      return errorResponse("Usuário não encontrado", corsHeaders, 500);
    }

    // Get roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roles: AppRole[] = (userRoles || []).map((r) => r.role as AppRole);
    if (!roles.includes("buyer")) roles.push("buyer");

    // RISE V3: Resolve session context (SSOT - shared with login handler)
    const context = await resolveUserSessionContext({
      supabase,
      user,
      roles,
      req,
    });

    if (!context) {
      return errorResponse("Erro ao criar sessão", corsHeaders, 500);
    }

    log.info("MFA verified, session created", { userId, activeRole: context.activeRole });

    return createAuthResponse(context.session, user, roles, corsHeaders);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("MFA verify error:", msg);
    return errorResponse("Erro ao verificar MFA", corsHeaders, 500);
  }
}
