/**
 * students-invite Edge Function
 * 
 * Handles student invite and token operations:
 * - validate-invite-token: Validate invite token (public)
 * - use-invite-token: Use invite token to activate access (public)
 * - generate-purchase-access: Generate access URL after purchase (public)
 * - invite: Send invite to student (authenticated)
 * 
 * RISE Protocol V2 Compliant - Zero `any`
 * Version: 2.0.0
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiter.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { genSaltSync, hashSync, compareSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

// ============================================
// INTERFACES
// ============================================

interface JsonResponseData {
  valid?: boolean;
  reason?: string;
  redirect?: string;
  needsPasswordSetup?: boolean;
  buyer_id?: string;
  product_id?: string;
  product_name?: string;
  product_image?: string | null;
  buyer_email?: string;
  buyer_name?: string;
  success?: boolean;
  error?: string;
  sessionToken?: string;
  buyer?: { id: string; email: string; name: string | null };
  accessUrl?: string;
  is_new_buyer?: boolean;
  email_sent?: boolean;
}

interface BuyerProfile {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
}

interface TokenData {
  id: string;
  buyer_id: string;
  product_id: string;
  is_used: boolean;
  expires_at: string;
  buyer: BuyerProfile | null;
}

interface ProductData {
  id: string;
  name: string;
  image_url: string | null;
  members_area_enabled?: boolean;
  user_id?: string;
}

// ============================================
// HELPERS
// ============================================

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function hashPassword(password: string): string {
  const salt = genSaltSync(10);
  return hashSync(password, salt);
}

function generateToken(): string {
  return crypto.randomUUID() + "-" + crypto.randomUUID();
}

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

function jsonResponse(data: JsonResponseData, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rateLimitResult = await rateLimitMiddleware(supabase, req, RATE_LIMIT_CONFIGS.MEMBERS_AREA);
    if (rateLimitResult) return rateLimitResult;

    const body = await req.json();
    const { action } = body;

    console.log(`[students-invite] Action: ${action}`);

    // ========== VALIDATE-INVITE-TOKEN (public) ==========
    if (action === "validate-invite-token") {
      const { token } = body;
      if (!token) return jsonResponse({ error: "token required" }, 400);

      const tokenHash = await hashToken(token);
      const { data: tokenData, error: tokenError } = await supabase
        .from("student_invite_tokens")
        .select(`id, buyer_id, product_id, is_used, expires_at, buyer:buyer_profiles(id, email, name, password_hash)`)
        .eq("token_hash", tokenHash)
        .single();

      if (tokenError || !tokenData) {
        return jsonResponse({ valid: false, reason: "Token inválido ou expirado" });
      }

      if (tokenData.is_used) {
        return jsonResponse({ valid: false, reason: "Este link já foi utilizado", redirect: "/minha-conta" });
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        return jsonResponse({ valid: false, reason: "Este link expirou" });
      }

      const typedTokenData = tokenData as unknown as TokenData;
      const buyer = typedTokenData.buyer;
      const needsPasswordSetup = !buyer?.password_hash || buyer.password_hash === "PENDING_PASSWORD_SETUP";

      const { data: product } = await supabase
        .from("products")
        .select("id, name, image_url")
        .eq("id", typedTokenData.product_id)
        .single();

      const typedProduct = product as ProductData | null;

      return jsonResponse({
        valid: true,
        needsPasswordSetup,
        buyer_id: typedTokenData.buyer_id,
        product_id: typedTokenData.product_id,
        product_name: typedProduct?.name || "Produto",
        product_image: typedProduct?.image_url || null,
        buyer_email: buyer?.email || "",
        buyer_name: buyer?.name || "",
      });
    }

    // ========== USE-INVITE-TOKEN (public) ==========
    if (action === "use-invite-token") {
      const { token, password } = body;
      if (!token) return jsonResponse({ error: "token required" }, 400);

      const tokenHash = await hashToken(token);
      const { data: tokenData, error: tokenError } = await supabase
        .from("student_invite_tokens")
        .select(`id, buyer_id, product_id, is_used, expires_at`)
        .eq("token_hash", tokenHash)
        .single();

      if (tokenError || !tokenData) return jsonResponse({ success: false, error: "Token inválido" }, 400);
      if (tokenData.is_used) return jsonResponse({ success: false, error: "Este link já foi utilizado" }, 400);
      if (new Date(tokenData.expires_at) < new Date()) return jsonResponse({ success: false, error: "Este link expirou" }, 400);

      const { data: buyer } = await supabase
        .from("buyer_profiles")
        .select("id, email, name, password_hash")
        .eq("id", tokenData.buyer_id)
        .single();

      if (!buyer) return jsonResponse({ success: false, error: "Perfil não encontrado" }, 400);

      const typedBuyer = buyer as BuyerProfile;
      const needsPasswordSetup = !typedBuyer.password_hash || typedBuyer.password_hash === "PENDING_PASSWORD_SETUP";

      if (needsPasswordSetup) {
        if (!password || password.length < 6) {
          return jsonResponse({ success: false, error: "Senha deve ter pelo menos 6 caracteres" }, 400);
        }
        const passwordHash = hashPassword(password);
        await supabase
          .from("buyer_profiles")
          .update({ password_hash: passwordHash, password_hash_version: 1, updated_at: new Date().toISOString() })
          .eq("id", typedBuyer.id);
      }

      await supabase.from("student_invite_tokens").update({ is_used: true, used_at: new Date().toISOString() }).eq("id", tokenData.id);

      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase.from("buyer_sessions").insert({ buyer_id: typedBuyer.id, session_token: sessionToken, expires_at: expiresAt.toISOString(), is_valid: true });
      await supabase.from("buyer_profiles").update({ last_login_at: new Date().toISOString() }).eq("id", typedBuyer.id);

      return jsonResponse({ 
        success: true, 
        sessionToken, 
        buyer: { id: typedBuyer.id, email: typedBuyer.email, name: typedBuyer.name }, 
        product_id: tokenData.product_id 
      });
    }

    // ========== GENERATE-PURCHASE-ACCESS (public) ==========
    if (action === "generate-purchase-access") {
      const { order_id, customer_email, product_id } = body;
      if (!order_id || !customer_email || !product_id) return jsonResponse({ error: "order_id, customer_email and product_id required" }, 400);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, status, customer_email, product_id")
        .eq("id", order_id)
        .single();

      if (orderError || !order) return jsonResponse({ error: "Pedido não encontrado" }, 404);
      if (order.status?.toLowerCase() !== "paid") return jsonResponse({ error: "Pedido ainda não foi pago" }, 400);

      const normalizedEmail = customer_email.toLowerCase().trim();
      if (order.customer_email?.toLowerCase().trim() !== normalizedEmail) {
        return jsonResponse({ error: "Email não corresponde ao pedido" }, 403);
      }

      const { data: product } = await supabase.from("products").select("id, name, members_area_enabled, user_id").eq("id", product_id).single();
      const typedProduct = product as ProductData | null;
      if (!typedProduct?.members_area_enabled) return jsonResponse({ error: "Produto não tem área de membros" }, 400);

      let buyerResult = await supabase.from("buyer_profiles").select("id, email, password_hash").eq("email", normalizedEmail).single();
      let buyer = buyerResult.data as BuyerProfile | null;

      if (!buyer) {
        const { data: newBuyer, error: createError } = await supabase
          .from("buyer_profiles")
          .insert({ email: normalizedEmail, password_hash: "PENDING_PASSWORD_SETUP", is_active: true })
          .select("id, email, password_hash")
          .single();
        if (createError) return jsonResponse({ error: "Erro ao criar perfil" }, 500);
        buyer = newBuyer as BuyerProfile;
      }

      await supabase.from("buyer_product_access").upsert({
        buyer_id: buyer.id,
        product_id,
        order_id,
        is_active: true,
        access_type: "purchase",
        granted_at: new Date().toISOString(),
      }, { onConflict: "buyer_id,product_id" });

      const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
      const needsPasswordSetup = !buyer.password_hash || buyer.password_hash === "PENDING_PASSWORD_SETUP";

      if (needsPasswordSetup) {
        const rawToken = generateToken();
        const tokenHash = await hashToken(rawToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await supabase.from("student_invite_tokens").insert({
          token_hash: tokenHash,
          buyer_id: buyer.id,
          product_id,
          invited_by: typedProduct.user_id,
          expires_at: expiresAt.toISOString(),
        });

        return jsonResponse({ success: true, needsPasswordSetup: true, accessUrl: `${baseUrl}/minha-conta/setup-acesso?token=${rawToken}` });
      }

      return jsonResponse({ success: true, needsPasswordSetup: false, accessUrl: `${baseUrl}/minha-conta` });
    }

    // ========== INVITE (authenticated) ==========
    if (action === "invite") {
      let producer;
      try {
        producer = await requireAuthenticatedProducer(supabase, req);
      } catch {
        return jsonResponse({ error: "Authorization required" }, 401);
      }

      const { product_id, email, name, group_ids } = body;
      if (!product_id || !email) return jsonResponse({ error: "product_id and email required" }, 400);

      const { data: product, error: productError } = await supabase.from("products").select("id, user_id, name, image_url").eq("id", product_id).single();
      const typedProduct = product as ProductData & { user_id: string } | null;
      if (productError || !typedProduct || typedProduct.user_id !== producer.id) {
        return jsonResponse({ error: "Product not found or access denied" }, 403);
      }

      const normalizedEmail = email.toLowerCase().trim();
      const { data: existingBuyer } = await supabase.from("buyer_profiles").select("id, email, name, password_hash").eq("email", normalizedEmail).single();

      let buyerId: string;
      let isNewBuyer = false;

      if (!existingBuyer) {
        const { data: newBuyer, error: createError } = await supabase
          .from("buyer_profiles")
          .insert({ email: normalizedEmail, name: name || null, password_hash: "PENDING_PASSWORD_SETUP", is_active: true })
          .select("id, email, name")
          .single();
        if (createError) return jsonResponse({ error: "Erro ao criar perfil do aluno" }, 500);
        buyerId = (newBuyer as BuyerProfile).id;
        isNewBuyer = true;
      } else {
        const typedExistingBuyer = existingBuyer as BuyerProfile;
        buyerId = typedExistingBuyer.id;
        if (name && !typedExistingBuyer.name) {
          await supabase.from("buyer_profiles").update({ name }).eq("id", buyerId);
        }
      }

      await supabase.from("buyer_product_access").upsert({
        buyer_id: buyerId,
        product_id,
        order_id: null,
        is_active: true,
        access_type: "invite",
        granted_at: new Date().toISOString(),
      }, { onConflict: "buyer_id,product_id" });

      if (group_ids && group_ids.length > 0) {
        await supabase.from("buyer_groups").delete().eq("buyer_id", buyerId);
        const groupInserts = group_ids.map((gid: string) => ({ buyer_id: buyerId, group_id: gid, is_active: true, granted_at: new Date().toISOString() }));
        await supabase.from("buyer_groups").insert(groupInserts);
      }

      const rawToken = generateToken();
      const tokenHash = await hashToken(rawToken);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await supabase.from("student_invite_tokens").insert({ token_hash: tokenHash, buyer_id: buyerId, product_id, invited_by: producer.id, expires_at: expiresAt.toISOString() });

      const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
      const accessLink = `${baseUrl}/minha-conta/setup-acesso?token=${rawToken}`;

      const { data: producerProfile } = await supabase.from("profiles").select("name").eq("id", producer.id).single();
      const studentName = name || normalizedEmail.split("@")[0];
      const producerName = (producerProfile as { name: string } | null)?.name || "Produtor";

      // Send email
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
          body: JSON.stringify({
            to: { email: normalizedEmail, name: studentName },
            subject: `${producerName} te enviou acesso ao produto "${typedProduct.name}"`,
            htmlBody: `<p>Você recebeu acesso ao produto ${typedProduct.name}. Clique <a href="${accessLink}">aqui</a> para acessar.</p>`,
            type: "transactional",
          }),
        });
      } catch (emailErr: unknown) {
        console.error("[students-invite] Email error:", emailErr);
      }

      return jsonResponse({ success: true, buyer_id: buyerId, is_new_buyer: isNewBuyer, email_sent: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);

  } catch (error: unknown) {
    console.error("[students-invite] Error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
