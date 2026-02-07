/**
 * MFA Setup Handler
 * 
 * Generates TOTP secret and otpauth URI for QR code scanning.
 * Requires authenticated admin/owner session.
 * 
 * Flow:
 * 1. Validate authenticated session (admin/owner only)
 * 2. Generate random TOTP secret
 * 3. Encrypt secret with AES-256-GCM
 * 4. Store encrypted secret in user_mfa table
 * 5. Return otpauth URI for QR code generation
 * 
 * @module unified-auth/handlers/mfa-setup
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse, jsonResponse } from "../../_shared/response-helpers.ts";
import { requireAuthenticatedUser } from "../../_shared/unified-auth-v2.ts";
import {
  generateTotpSecret,
  generateOtpAuthUri,
  encryptTotpSecret,
} from "../../_shared/mfa-helpers.ts";

const log = createLogger("UnifiedAuth:MFA-Setup");

const MFA_ELIGIBLE_ROLES = ["admin", "owner"];

export async function handleMfaSetup(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser(supabase, req);

    // Verify role eligibility
    const hasEligibleRole = user.roles.some((r) =>
      MFA_ELIGIBLE_ROLES.includes(r)
    );
    if (!hasEligibleRole) {
      return errorResponse(
        "MFA disponível apenas para admin e owner",
        corsHeaders,
        403
      );
    }

    // Check if MFA is already enabled
    const { data: existingMfa } = await supabase
      .from("user_mfa")
      .select("id, is_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMfa?.is_enabled) {
      return errorResponse(
        "MFA já está ativado. Desative antes de configurar novamente.",
        corsHeaders,
        409
      );
    }

    // Generate new TOTP secret
    const secretBase32 = generateTotpSecret();
    const otpauthUri = generateOtpAuthUri(secretBase32, user.email);

    // Encrypt and store (not yet enabled - requires verification)
    const { encrypted, iv } = await encryptTotpSecret(secretBase32);

    if (existingMfa) {
      // Update existing record (re-setup scenario)
      const { error: updateError } = await supabase
        .from("user_mfa")
        .update({
          totp_secret_encrypted: encrypted,
          totp_secret_iv: iv,
          is_enabled: false,
          verified_at: null,
          backup_codes_hash: [],
          backup_codes_used: [],
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        log.error("Failed to update MFA record:", updateError.message);
        return errorResponse("Erro ao configurar MFA", corsHeaders, 500);
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from("user_mfa")
        .insert({
          user_id: user.id,
          totp_secret_encrypted: encrypted,
          totp_secret_iv: iv,
          is_enabled: false,
        });

      if (insertError) {
        log.error("Failed to create MFA record:", insertError.message);
        return errorResponse("Erro ao configurar MFA", corsHeaders, 500);
      }
    }

    log.info("MFA setup initiated", { userId: user.id });

    return jsonResponse(
      {
        success: true,
        otpauthUri,
      },
      corsHeaders
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg === "Usuário não autenticado") {
      return errorResponse(msg, corsHeaders, 401);
    }

    log.error("MFA setup error:", msg);
    return errorResponse("Erro ao configurar MFA", corsHeaders, 500);
  }
}
