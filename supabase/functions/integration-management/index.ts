/**
 * integration-management Edge Function
 * 
 * Centralizes all integration CRUD operations with proper security:
 * - Authentication via producer_sessions
 * - Rate limiting per producer
 * - Backend validation
 * - Sentry error tracking
 * 
 * RISE Protocol Compliant
 * 
 * Endpoints:
 * - POST /save-credentials - Save/update integration credentials
 * - POST /disconnect - Remove integration
 * - POST /init-oauth - Initialize OAuth state
 * - GET /status - Get integration status
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS
import { handleCors } from "../_shared/cors.ts";

// Sentry
import { withSentry, captureException } from "../_shared/sentry.ts";

// ============================================
// TYPES
// ============================================

type IntegrationType = "MERCADOPAGO" | "STRIPE" | "ASAAS" | "PUSHINPAY";

interface CredentialsPayload {
  integrationType: IntegrationType;
  config: Record<string, any>;
}

// ============================================
// RATE LIMITING
// ============================================

async function checkRateLimit(
  supabase: any,
  producerId: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const MAX_ATTEMPTS = 20;
  const WINDOW_MS = 5 * 60 * 1000;

  const windowStart = new Date(Date.now() - WINDOW_MS);

  const { data: attempts, error } = await supabase
    .from("rate_limit_attempts")
    .select("id")
    .eq("identifier", `producer:${producerId}`)
    .eq("action", action)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    console.error("[integration-management] Rate limit check error:", error);
    return { allowed: true };
  }

  const count = attempts?.length || 0;
  if (count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: 300 };
  }

  return { allowed: true };
}

async function recordRateLimitAttempt(
  supabase: any,
  producerId: string,
  action: string
): Promise<void> {
  await supabase.from("rate_limit_attempts").insert({
    identifier: `producer:${producerId}`,
    action,
    success: true,
    created_at: new Date().toISOString(),
  });
}

// ============================================
// HELPERS
// ============================================

function jsonResponse(data: any, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

// ============================================
// SESSION VALIDATION
// ============================================

async function validateProducerSession(
  supabase: any,
  sessionToken: string
): Promise<{ valid: boolean; producerId?: string; error?: string }> {
  if (!sessionToken) {
    return { valid: false, error: "Token de sessão não fornecido" };
  }

  const { data: session, error } = await supabase
    .from("producer_sessions")
    .select("producer_id, expires_at, is_valid")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) {
    return { valid: false, error: "Sessão inválida" };
  }

  if (!session.is_valid) {
    return { valid: false, error: "Sessão expirada ou invalidada" };
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase
      .from("producer_sessions")
      .update({ is_valid: false })
      .eq("session_token", sessionToken);
    return { valid: false, error: "Sessão expirada" };
  }

  await supabase
    .from("producer_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("session_token", sessionToken);

  return { valid: true, producerId: session.producer_id };
}

// ============================================
// SECURE NONCE GENERATION
// ============================================

function generateSecureNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("integration-management", async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    console.log(`[integration-management] Action: ${action}, Method: ${req.method}`);

    let body: any = {};
    if (req.method !== "GET") {
      try {
        body = await req.json();
      } catch {
        return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
      }
    }

    // Authentication
    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token");
    const sessionValidation = await validateProducerSession(supabase, sessionToken);

    if (!sessionValidation.valid) {
      console.warn(`[integration-management] Auth failed: ${sessionValidation.error}`);
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }

    const producerId = sessionValidation.producerId!;
    console.log(`[integration-management] Authenticated producer: ${producerId}`);

    // ============================================
    // SAVE CREDENTIALS (Sandbox/Manual mode)
    // ============================================
    if (action === "save-credentials" && req.method === "POST") {
      const rateCheck = await checkRateLimit(supabase, producerId, "integration_save");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter },
          corsHeaders,
          429
        );
      }

      const { integrationType, config } = body as CredentialsPayload;

      if (!integrationType) {
        return errorResponse("Tipo de integração é obrigatório", corsHeaders, 400);
      }

      if (!config || typeof config !== "object") {
        return errorResponse("Configuração é obrigatória", corsHeaders, 400);
      }

      // Check if integration exists
      const { data: existing } = await supabase
        .from("vendor_integrations")
        .select("id")
        .eq("vendor_id", producerId)
        .eq("integration_type", integrationType)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("vendor_integrations")
          .update({
            config,
            active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          console.error("[integration-management] Update error:", error);
          return errorResponse("Erro ao atualizar integração", corsHeaders, 500);
        }
      } else {
        // Insert
        const { error } = await supabase
          .from("vendor_integrations")
          .insert({
            vendor_id: producerId,
            integration_type: integrationType,
            config,
            active: true,
          });

        if (error) {
          console.error("[integration-management] Insert error:", error);
          return errorResponse("Erro ao criar integração", corsHeaders, 500);
        }
      }

      await recordRateLimitAttempt(supabase, producerId, "integration_save");

      console.log(`[integration-management] Credentials saved for ${integrationType} by ${producerId}`);
      return jsonResponse({ success: true }, corsHeaders);
    }

    // ============================================
    // DISCONNECT
    // ============================================
    if (action === "disconnect" && (req.method === "DELETE" || req.method === "POST")) {
      const { integrationType, integrationId } = body;

      if (!integrationType && !integrationId) {
        return errorResponse("Tipo de integração ou ID é obrigatório", corsHeaders, 400);
      }

      let query = supabase.from("vendor_integrations").delete();
      
      if (integrationId) {
        query = query.eq("id", integrationId).eq("vendor_id", producerId);
      } else {
        query = query.eq("vendor_id", producerId).eq("integration_type", integrationType);
      }

      const { error } = await query;

      if (error) {
        console.error("[integration-management] Disconnect error:", error);
        return errorResponse("Erro ao desconectar integração", corsHeaders, 500);
      }

      console.log(`[integration-management] Disconnected ${integrationType || integrationId} for ${producerId}`);
      return jsonResponse({ success: true }, corsHeaders);
    }

    // ============================================
    // INIT OAUTH (Create state for OAuth flow)
    // ============================================
    if (action === "init-oauth" && req.method === "POST") {
      const rateCheck = await checkRateLimit(supabase, producerId, "oauth_init");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter },
          corsHeaders,
          429
        );
      }

      const { integrationType } = body;

      if (!integrationType) {
        return errorResponse("Tipo de integração é obrigatório", corsHeaders, 400);
      }

      // Generate secure nonce
      const nonce = generateSecureNonce();

      // Save state
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

      const { error } = await supabase
        .from("oauth_states")
        .insert({
          state: nonce,
          vendor_id: producerId,
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        console.error("[integration-management] OAuth state insert error:", error);
        return errorResponse("Erro ao iniciar autenticação", corsHeaders, 500);
      }

      await recordRateLimitAttempt(supabase, producerId, "oauth_init");

      console.log(`[integration-management] OAuth state created for ${integrationType} by ${producerId}`);
      return jsonResponse({ success: true, state: nonce }, corsHeaders);
    }

    // ============================================
    // GET STATUS
    // ============================================
    if (action === "status" && (req.method === "GET" || req.method === "POST")) {
      const integrationType = body.integrationType || url.searchParams.get("type");

      let query = supabase
        .from("vendor_integrations")
        .select("id, integration_type, active, config, created_at, updated_at")
        .eq("vendor_id", producerId);

      if (integrationType) {
        query = query.eq("integration_type", integrationType);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[integration-management] Status error:", error);
        return errorResponse("Erro ao buscar status", corsHeaders, 500);
      }

      // Sanitize config (remove sensitive data)
      const sanitized = data?.map((int: any) => ({
        id: int.id,
        type: int.integration_type,
        active: int.active,
        isTest: int.config?.is_test || false,
        email: int.config?.email || null,
        connectedAt: int.created_at,
        updatedAt: int.updated_at,
      })) || [];

      return jsonResponse({ success: true, integrations: sanitized }, corsHeaders);
    }

    // Unknown action
    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[integration-management] Unexpected error:", err.message);
    await captureException(err, {
      functionName: "integration-management",
      url: req.url,
      method: req.method,
    });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
