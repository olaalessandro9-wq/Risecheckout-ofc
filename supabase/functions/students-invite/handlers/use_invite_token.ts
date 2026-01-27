/**
 * Handler: Use invite token to activate access (public)
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hashToken, hashPassword } from "../helpers/hash.ts";
import { jsonResponse } from "../helpers/response.ts";
import { 
  createSession,
  createUnifiedAuthCookies,
  type AppRole,
} from "../../_shared/unified-auth-v2.ts";
import type { UserProfile } from "../types.ts";

export async function handleUseInviteToken(
  supabase: SupabaseClient,
  token: string | undefined,
  password: string | undefined,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!token) {
    return jsonResponse({ error: "token required" }, 400, corsHeaders);
  }

  const tokenHash = await hashToken(token);
  const { data: tokenData, error: tokenError } = await supabase
    .from("student_invite_tokens")
    .select("id, buyer_id, product_id, is_used, expires_at")
    .eq("token_hash", tokenHash)
    .single();

  if (tokenError || !tokenData) {
    return jsonResponse({ success: false, error: "Token inválido" }, 400, corsHeaders);
  }
  if (tokenData.is_used) {
    return jsonResponse({ success: false, error: "Este link já foi utilizado" }, 400, corsHeaders);
  }
  if (new Date(tokenData.expires_at) < new Date()) {
    return jsonResponse({ success: false, error: "Este link expirou" }, 400, corsHeaders);
  }

  // RISE V3: Look up user directly in users table (SSOT)
  const { data: user } = await supabase
    .from("users")
    .select("id, email, name, password_hash")
    .eq("id", tokenData.buyer_id)
    .single();

  if (!user) {
    return jsonResponse({ success: false, error: "Perfil não encontrado" }, 400, corsHeaders);
  }

  const typedUser = user as UserProfile;
  const needsPasswordSetup = !typedUser.password_hash || typedUser.password_hash === "PENDING_PASSWORD_SETUP";

  if (needsPasswordSetup) {
    if (!password || password.length < 6) {
      return jsonResponse({ success: false, error: "Senha deve ter pelo menos 6 caracteres" }, 400, corsHeaders);
    }
    const passwordHash = hashPassword(password);
    await supabase
      .from("users")
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq("id", typedUser.id);
  }

  await supabase.from("student_invite_tokens").update({ is_used: true, used_at: new Date().toISOString() }).eq("id", tokenData.id);

  // RISE V3: Create unified session
  const session = await createSession(supabase, typedUser.id, "buyer" as AppRole, req);
  
  if (session) {
    const cookies = createUnifiedAuthCookies(session.sessionToken, session.refreshToken);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        buyer: { id: typedUser.id, email: typedUser.email, name: typedUser.name }, 
        product_id: tokenData.product_id 
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Set-Cookie": cookies.join(", "),
        },
      }
    );
  }

  return jsonResponse({ success: false, error: "Erro ao criar sessão" }, 500, corsHeaders);
}
