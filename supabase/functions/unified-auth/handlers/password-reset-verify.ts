/**
 * Password Reset Verify Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Verifies if a reset token is valid and not expired.
 * Uses users table as SSOT.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { jsonResponse } from "../../_shared/response-helpers.ts";

const log = createLogger("UnifiedAuth:PasswordResetVerify");

interface VerifyRequestBody {
  token: string;
}

interface UserWithToken {
  id: string;
  email: string;
  name: string | null;
  reset_token_expires_at: string | null;
}

export async function handlePasswordResetVerify(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: VerifyRequestBody = await req.json();
    const { token } = body;

    if (!token) {
      return jsonResponse({ 
        valid: false, 
        error: "Token não fornecido" 
      }, corsHeaders, 400);
    }

    // Find user by reset token in unified users table (SSOT)
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, email, name, reset_token_expires_at")
      .eq("reset_token", token)
      .single() as { data: UserWithToken | null; error: unknown };

    if (findError || !user) {
      log.debug("Reset token not found");
      return jsonResponse({ 
        valid: false, 
        error: "Token inválido" 
      }, corsHeaders);
    }

    // Check expiration
    if (!user.reset_token_expires_at) {
      return jsonResponse({ 
        valid: false, 
        error: "Token inválido" 
      }, corsHeaders);
    }

    const expiresAt = new Date(user.reset_token_expires_at);
    if (expiresAt < new Date()) {
      log.debug("Reset token expired");
      return jsonResponse({ 
        valid: false, 
        error: "Token expirado. Solicite um novo link de recuperação." 
      }, corsHeaders);
    }

    log.info(`Reset token verified for: ${user.email}`);

    return jsonResponse({ 
      valid: true, 
      email: user.email 
    }, corsHeaders);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Token verification error:", msg);
    return jsonResponse({ 
      valid: false, 
      error: "Erro ao validar token" 
    }, corsHeaders, 500);
  }
}
