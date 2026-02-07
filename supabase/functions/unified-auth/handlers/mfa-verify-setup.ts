/**
 * MFA Verify Setup Handler
 * 
 * Confirms MFA setup by verifying the first TOTP code.
 * Generates and returns one-time backup codes on success.
 * 
 * Flow:
 * 1. Validate authenticated session
 * 2. Get pending MFA setup from user_mfa table
 * 3. Decrypt TOTP secret
 * 4. Verify submitted TOTP code
 * 5. Generate 8 backup codes (shown only once)
 * 6. Store bcrypt hashes of backup codes
 * 7. Activate MFA (is_enabled = true)
 * 
 * @module unified-auth/handlers/mfa-verify-setup
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse, jsonResponse } from "../../_shared/response-helpers.ts";
import { requireAuthenticatedUser } from "../../_shared/unified-auth-v2.ts";
import {
  decryptTotpSecret,
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCode,
} from "../../_shared/mfa-helpers.ts";

const log = createLogger("UnifiedAuth:MFA-VerifySetup");

interface MfaVerifySetupRequest {
  code: string;
}

export async function handleMfaVerifySetup(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser(supabase, req);
    const body: MfaVerifySetupRequest = await req.json();

    if (!body.code || body.code.length !== 6) {
      return errorResponse(
        "Código de 6 dígitos obrigatório",
        corsHeaders,
        400
      );
    }

    // Get pending MFA setup
    const { data: mfaRecord, error: mfaError } = await supabase
      .from("user_mfa")
      .select("id, totp_secret_encrypted, totp_secret_iv, is_enabled")
      .eq("user_id", user.id)
      .single();

    if (mfaError || !mfaRecord) {
      return errorResponse(
        "Nenhum setup MFA pendente encontrado",
        corsHeaders,
        404
      );
    }

    if (mfaRecord.is_enabled) {
      return errorResponse("MFA já está ativado", corsHeaders, 409);
    }

    // Decrypt TOTP secret
    const totpSecret = await decryptTotpSecret(
      mfaRecord.totp_secret_encrypted,
      mfaRecord.totp_secret_iv
    );

    // Verify the code
    if (!verifyTotpCode(totpSecret, body.code)) {
      return errorResponse("Código TOTP inválido", corsHeaders, 400);
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const backupCodesHash = backupCodes.map((code) => hashBackupCode(code));

    // Activate MFA
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("user_mfa")
      .update({
        is_enabled: true,
        verified_at: now,
        backup_codes_hash: backupCodesHash,
        backup_codes_used: [],
        updated_at: now,
      })
      .eq("user_id", user.id);

    if (updateError) {
      log.error("Failed to activate MFA:", updateError.message);
      return errorResponse("Erro ao ativar MFA", corsHeaders, 500);
    }

    log.info("MFA activated successfully", { userId: user.id });

    // Return backup codes (shown only once - user must save them)
    return jsonResponse(
      {
        success: true,
        message: "MFA ativado com sucesso",
        backupCodes,
      },
      corsHeaders
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg === "Usuário não autenticado") {
      return errorResponse(msg, corsHeaders, 401);
    }

    log.error("MFA verify setup error:", msg);
    return errorResponse("Erro ao verificar setup MFA", corsHeaders, 500);
  }
}
