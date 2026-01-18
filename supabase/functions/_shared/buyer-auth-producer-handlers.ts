/**
 * Buyer Auth Producer Handlers
 * 
 * Handlers para produtores acessando área de membros
 * 
 * RISE V3: Response helpers imported from response-helpers.ts
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import { SESSION_DURATION_DAYS } from "./auth-constants.ts";
import { generateSessionToken } from "./buyer-auth-handlers.ts";
import { jsonResponse, errorResponse } from "./response-helpers.ts";

// ============================================
// CHECK-PRODUCER-BUYER HANDLER
// ============================================
export async function handleCheckProducerBuyer(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { email, producerUserId } = await req.json();

  if (!email) {
    return errorResponse("Email é obrigatório", corsHeaders, 400);
  }

  let hasOwnProducts = false;
  if (producerUserId) {
    const { data: ownProducts } = await supabase
      .from("products")
      .select("id")
      .eq("user_id", producerUserId)
      .eq("members_area_enabled", true)
      .limit(1);
    hasOwnProducts = !!(ownProducts && ownProducts.length > 0);
  }

  const { data: buyer } = await supabase
    .from("buyer_profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (!buyer && !hasOwnProducts) {
    console.log(`[buyer-auth] No buyer profile or own products for producer: ${email}`);
    return jsonResponse({ hasBuyerProfile: false, hasOwnProducts: false }, corsHeaders, 200);
  }

  let hasActiveAccess = false;
  if (buyer) {
    const { data: access } = await supabase
      .from("buyer_product_access")
      .select("id")
      .eq("buyer_id", buyer.id)
      .eq("is_active", true)
      .limit(1);
    hasActiveAccess = !!(access && access.length > 0);
  }

  const shouldShowStudentPanel = hasActiveAccess || hasOwnProducts;

  console.log(`[buyer-auth] Producer buyer check: ${email}, hasAccess: ${hasActiveAccess}, hasOwnProducts: ${hasOwnProducts}`);
  return jsonResponse({
    hasBuyerProfile: shouldShowStudentPanel,
    hasOwnProducts,
    buyerId: buyer?.id || null,
  }, corsHeaders, 200);
}

// ============================================
// ENSURE-PRODUCER-ACCESS HANDLER
// ============================================
export async function handleEnsureProducerAccess(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { email, productId, producerUserId } = await req.json();

  if (!email || !productId) {
    return errorResponse("Email e productId são obrigatórios", corsHeaders, 400);
  }

  try {
    let { data: buyer } = await supabase
      .from("buyer_profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (!buyer) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", producerUserId)
        .single();

      const { data: newBuyer, error: createError } = await supabase
        .from("buyer_profiles")
        .insert({
          email: email.toLowerCase(),
          password_hash: "OWNER_NO_PASSWORD",
          password_hash_version: 2,
          name: profile?.name || null,
          is_active: true,
        })
        .select("id")
        .single();

      if (createError) {
        console.error("[buyer-auth] Error creating producer buyer profile:", createError);
        throw createError;
      }
      buyer = newBuyer;
      console.log(`[buyer-auth] Created buyer profile for producer: ${email}`);
    }

    console.log(`[buyer-auth] Producer ${email} has access via product ownership, no buyer_product_access needed`);

    return jsonResponse({ success: true, buyerId: buyer.id }, corsHeaders, 200);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[buyer-auth] Error ensuring producer access:", errorMessage);
    return errorResponse("Erro ao criar acesso do produtor", corsHeaders, 500);
  }
}

// ============================================
// PRODUCER-LOGIN HANDLER
// ============================================
export async function handleProducerLogin(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { email } = await req.json();

  if (!email) {
    return errorResponse("Email é obrigatório", corsHeaders, 400);
  }

  const { data: buyer, error: findError } = await supabase
    .from("buyer_profiles")
    .select("id, email, name, is_active")
    .eq("email", email.toLowerCase())
    .single();

  if (findError || !buyer) {
    console.log(`[buyer-auth] Producer login failed - buyer not found: ${email}`);
    return errorResponse("Perfil de comprador não encontrado", corsHeaders, 404);
  }

  if (!buyer.is_active) {
    return errorResponse("Conta desativada", corsHeaders, 403);
  }

  const sessionToken = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const { error: sessionError } = await supabase
    .from("buyer_sessions")
    .insert({
      buyer_id: buyer.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      ip_address: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

  if (sessionError) {
    console.error("[buyer-auth] Error creating producer session:", sessionError);
    return errorResponse("Erro ao criar sessão", corsHeaders, 500);
  }

  await supabase
    .from("buyer_profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", buyer.id);

  console.log(`[buyer-auth] Producer login successful: ${email}`);
  return jsonResponse({
    success: true,
    sessionToken,
    expiresAt: expiresAt.toISOString(),
    buyer: { id: buyer.id, email: buyer.email, name: buyer.name },
  }, corsHeaders, 200);
}
