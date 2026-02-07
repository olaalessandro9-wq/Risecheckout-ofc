/**
 * MFA Disable Guard (Defense-in-Depth)
 * 
 * Blocks ALL MFA disable attempts for admin/owner roles.
 * MFA is mandatory and cannot be deactivated.
 * 
 * The frontend does NOT expose any UI to call this endpoint.
 * This handler exists solely as a backend security guard against
 * direct API calls attempting to bypass frontend restrictions.
 * 
 * @module unified-auth/handlers/mfa-disable
 * @version 2.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse, jsonResponse } from "../../_shared/response-helpers.ts";
import {
  requireAuthenticatedUser,
  verifyPassword,
} from "../../_shared/unified-auth-v2.ts";
import {
  decryptTotpSecret,
  verifyTotpCode,
} from "../../_shared/mfa-helpers.ts";

const log = createLogger("UnifiedAuth:MFA-Disable");

interface MfaDisableRequest {
  password: string;
  code: string;
}

export async function handleMfaDisable(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser(supabase, req);
    
    // RISE V3: Block MFA disable for admin/owner (mandatory enforcement)
    const isMfaEnforcedRole = user.activeRole === "admin" || user.activeRole === "owner";
    if (isMfaEnforcedRole) {
      log.warn("Admin/Owner attempted to disable mandatory MFA", { userId: user.id, role: user.activeRole });
      return errorResponse(
        "MFA é obrigatório para administradores e não pode ser desativado",
        corsHeaders,
        403
      );
    }
    
    const body: MfaDisableRequest = await req.json();

    if (!body.password || !body.code) {
      return errorResponse(
        "Senha e código TOTP são obrigatórios",
        corsHeaders,
        400
      );
    }

    // Verify password
    const { data: userData } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", user.id)
      .single();

    if (!userData?.password_hash) {
      return errorResponse(
        "Conta sem senha configurada",
        corsHeaders,
        403
      );
    }

    if (!verifyPassword(body.password, userData.password_hash)) {
      return errorResponse("Senha incorreta", corsHeaders, 401);
    }

    // Get MFA record
    const { data: mfaRecord } = await supabase
      .from("user_mfa")
      .select("totp_secret_encrypted, totp_secret_iv, is_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!mfaRecord?.is_enabled) {
      return errorResponse("MFA não está ativado", corsHeaders, 400);
    }

    // Verify TOTP code
    const totpSecret = await decryptTotpSecret(
      mfaRecord.totp_secret_encrypted,
      mfaRecord.totp_secret_iv
    );

    if (!verifyTotpCode(totpSecret, body.code)) {
      return errorResponse("Código TOTP inválido", corsHeaders, 401);
    }

    // Disable MFA and clear backup codes
    const { error: updateError } = await supabase
      .from("user_mfa")
      .update({
        is_enabled: false,
        backup_codes_hash: [],
        backup_codes_used: [],
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      log.error("Failed to disable MFA:", updateError.message);
      return errorResponse("Erro ao desativar MFA", corsHeaders, 500);
    }

    log.info("MFA disabled", { userId: user.id });

    return jsonResponse(
      {
        success: true,
        message: "MFA desativado com sucesso",
      },
      corsHeaders
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg === "Usuário não autenticado") {
      return errorResponse(msg, corsHeaders, 401);
    }

    log.error("MFA disable error:", msg);
    return errorResponse("Erro ao desativar MFA", corsHeaders, 500);
  }
}
