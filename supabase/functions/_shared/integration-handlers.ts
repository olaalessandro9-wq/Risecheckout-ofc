/**
 * Integration Management Handlers
 * 
 * Extracted handlers for integration-management edge function.
 * 
 * RISE Protocol Compliant - < 300 linhas
 */

// deno-lint-ignore-file no-explicit-any
type SupabaseClientAny = any;

// ============================================================================
// TYPES
// ============================================================================

export type IntegrationType = "MERCADOPAGO" | "STRIPE" | "ASAAS" | "PUSHINPAY";

export interface CredentialsPayload {
  integrationType: IntegrationType;
  config: Record<string, unknown>;
}

interface SessionRecord {
  producer_id: string;
  expires_at: string;
  is_valid: boolean;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export async function checkRateLimit(
  supabase: SupabaseClientAny,
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

export async function recordRateLimitAttempt(
  supabase: SupabaseClientAny,
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

// ============================================================================
// HELPERS
// ============================================================================

export function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

export async function validateProducerSession(
  supabase: SupabaseClientAny,
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

  const sessionRecord = session as SessionRecord;

  if (!sessionRecord.is_valid) {
    return { valid: false, error: "Sessão expirada ou invalidada" };
  }

  if (new Date(sessionRecord.expires_at) < new Date()) {
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

  return { valid: true, producerId: sessionRecord.producer_id };
}

// ============================================================================
// NONCE GENERATION
// ============================================================================

export function generateSecureNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// HANDLER: SAVE CREDENTIALS
// ============================================================================

export async function handleSaveCredentials(
  supabase: SupabaseClientAny,
  producerId: string,
  body: { integrationType?: IntegrationType; config?: Record<string, unknown> },
  corsHeaders: Record<string, string>
): Promise<Response> {
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

  const { data: existing } = await supabase
    .from("vendor_integrations")
    .select("id")
    .eq("vendor_id", producerId)
    .eq("integration_type", integrationType)
    .maybeSingle();

  if (existing) {
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

// ============================================================================
// HANDLER: DISCONNECT
// ============================================================================

export async function handleDisconnect(
  supabase: SupabaseClientAny,
  producerId: string,
  body: { integrationType?: string; integrationId?: string },
  corsHeaders: Record<string, string>
): Promise<Response> {
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

// ============================================================================
// RE-EXPORT OAUTH HANDLERS
// ============================================================================

export { handleInitOAuth } from "./integration-oauth-handlers.ts";

// ============================================================================
// RE-EXPORT PROFILE & STATUS HANDLERS
// ============================================================================

export { 
  handleGetStatus,
  handleSaveProfileWallet, 
  handleClearProfileWallet,
} from "./integration-profile-handlers.ts";
