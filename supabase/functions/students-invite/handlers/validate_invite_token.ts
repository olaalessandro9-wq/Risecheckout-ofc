/**
 * Handler: Validate invite token (public)
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hashToken } from "../helpers/hash.ts";
import { jsonResponse } from "../helpers/response.ts";
import type { ProductData } from "../types.ts";

export async function handleValidateInviteToken(
  supabase: SupabaseClient,
  token: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!token) {
    return jsonResponse({ error: "token required" }, 400, corsHeaders);
  }

  const tokenHash = await hashToken(token);
  
  // RISE V3: Token now references users.id directly
  const { data: tokenData, error: tokenError } = await supabase
    .from("student_invite_tokens")
    .select("id, buyer_id, product_id, is_used, expires_at")
    .eq("token_hash", tokenHash)
    .single();

  if (tokenError || !tokenData) {
    return jsonResponse({ valid: false, reason: "Token inválido ou expirado" }, 200, corsHeaders);
  }

  if (tokenData.is_used) {
    return jsonResponse({ valid: false, reason: "Este link já foi utilizado", redirect: "/minha-conta" }, 200, corsHeaders);
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return jsonResponse({ valid: false, reason: "Este link expirou" }, 200, corsHeaders);
  }

  // RISE V3: Look up user directly in users table (SSOT)
  const { data: user } = await supabase
    .from("users")
    .select("id, email, name, password_hash")
    .eq("id", tokenData.buyer_id)
    .single();

  const needsPasswordSetup = !user?.password_hash || user.password_hash === "PENDING_PASSWORD_SETUP";

  const { data: product } = await supabase
    .from("products")
    .select("id, name, image_url")
    .eq("id", tokenData.product_id)
    .single();

  const typedProduct = product as ProductData | null;

  return jsonResponse({
    valid: true,
    needsPasswordSetup,
    buyer_id: tokenData.buyer_id,
    product_id: tokenData.product_id,
    product_name: typedProduct?.name || "Produto",
    product_image: typedProduct?.image_url || null,
    buyer_email: user?.email || "",
    buyer_name: user?.name || "",
  }, 200, corsHeaders);
}
