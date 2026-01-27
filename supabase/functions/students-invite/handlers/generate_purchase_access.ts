/**
 * Handler: Generate access URL after purchase (public)
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hashToken } from "../helpers/hash.ts";
import { generateToken } from "../helpers/token.ts";
import { jsonResponse } from "../helpers/response.ts";
import type { ProductData } from "../types.ts";

export async function handleGeneratePurchaseAccess(
  supabase: SupabaseClient,
  orderId: string | undefined,
  customerEmail: string | undefined,
  productId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!orderId || !customerEmail || !productId) {
    return jsonResponse({ error: "order_id, customer_email and product_id required" }, 400, corsHeaders);
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, customer_email, product_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return jsonResponse({ error: "Pedido não encontrado" }, 404, corsHeaders);
  }
  if (order.status?.toLowerCase() !== "paid") {
    return jsonResponse({ error: "Pedido ainda não foi pago" }, 400, corsHeaders);
  }

  const normalizedEmail = customerEmail.toLowerCase().trim();
  if (order.customer_email?.toLowerCase().trim() !== normalizedEmail) {
    return jsonResponse({ error: "Email não corresponde ao pedido" }, 403, corsHeaders);
  }

  const { data: product } = await supabase.from("products").select("id, name, members_area_enabled, user_id").eq("id", productId).single();
  const typedProduct = product as ProductData | null;
  if (!typedProduct?.members_area_enabled) {
    return jsonResponse({ error: "Produto não tem área de membros" }, 400, corsHeaders);
  }

  // RISE V3: Look up user in users table only (SSOT)
  let userId: string;
  let passwordHash: string | null = null;

  const { data: existingUser } = await supabase.from("users").select("id, email, password_hash").eq("email", normalizedEmail).single();

  if (existingUser) {
    userId = existingUser.id;
    passwordHash = existingUser.password_hash;
  } else {
    // Create new user in users table
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({ email: normalizedEmail, password_hash: "PENDING_PASSWORD_SETUP", account_status: "active" })
      .select("id")
      .single();
    if (createError) {
      return jsonResponse({ error: "Erro ao criar perfil" }, 500, corsHeaders);
    }
    userId = newUser.id;
    passwordHash = "PENDING_PASSWORD_SETUP";
  }

  // RISE V3: Use users.id for buyer_product_access
  await supabase.from("buyer_product_access").upsert({
    buyer_id: userId,
    product_id: productId,
    order_id: orderId,
    is_active: true,
    access_type: "purchase",
    granted_at: new Date().toISOString(),
  }, { onConflict: "buyer_id,product_id" });

  const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
  const needsPasswordSetup = !passwordHash || passwordHash === "PENDING_PASSWORD_SETUP";

  if (needsPasswordSetup) {
    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // RISE V3: Use users.id for student_invite_tokens
    await supabase.from("student_invite_tokens").insert({
      token_hash: tokenHash,
      buyer_id: userId,
      product_id: productId,
      invited_by: typedProduct.user_id,
      expires_at: expiresAt.toISOString(),
    });

    return jsonResponse({ success: true, needsPasswordSetup: true, accessUrl: `${baseUrl}/minha-conta/setup-acesso?token=${rawToken}` }, 200, corsHeaders);
  }

  return jsonResponse({ success: true, needsPasswordSetup: false, accessUrl: `${baseUrl}/minha-conta` }, 200, corsHeaders);
}
