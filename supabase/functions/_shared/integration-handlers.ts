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

interface IntegrationRecord {
  id: string;
  integration_type: string;
  active: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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
// HANDLER: INIT OAUTH
// ============================================================================

export async function handleInitOAuth(
  supabase: SupabaseClientAny,
  producerId: string,
  body: { integrationType?: string },
  corsHeaders: Record<string, string>
): Promise<Response> {
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

  const nonce = generateSecureNonce();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

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

// ============================================================================
// HANDLER: GET STATUS
// ============================================================================

export async function handleGetStatus(
  supabase: SupabaseClientAny,
  producerId: string,
  integrationType: string | null,
  corsHeaders: Record<string, string>
): Promise<Response> {
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

  const integrations = (data as IntegrationRecord[] | null) || [];
  const sanitized = integrations.map((int) => ({
    id: int.id,
    type: int.integration_type,
    active: int.active,
    isTest: (int.config as { is_test?: boolean })?.is_test || false,
    email: (int.config as { email?: string })?.email || null,
    connectedAt: int.created_at,
    updatedAt: int.updated_at,
  }));

  return jsonResponse({ success: true, integrations: sanitized }, corsHeaders);
}

// ============================================================================
// HANDLER: SAVE/CLEAR PROFILE WALLET
// ============================================================================

export async function handleSaveProfileWallet(
  supabase: SupabaseClientAny,
  producerId: string,
  walletId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!walletId || typeof walletId !== "string") {
    return errorResponse("walletId é obrigatório", corsHeaders, 400);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ asaas_wallet_id: walletId })
    .eq("id", producerId);

  if (error) {
    console.error("[integration-management] Save profile wallet error:", error);
    return errorResponse("Erro ao salvar wallet", corsHeaders, 500);
  }

  console.log(`[integration-management] Profile wallet saved for ${producerId}: ${walletId}`);
  return jsonResponse({ success: true }, corsHeaders);
}

export async function handleClearProfileWallet(
  supabase: SupabaseClientAny,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { error } = await supabase
    .from("profiles")
    .update({ asaas_wallet_id: null })
    .eq("id", producerId);

  if (error) {
    console.error("[integration-management] Clear profile wallet error:", error);
    return errorResponse("Erro ao limpar wallet", corsHeaders, 500);
  }

  console.log(`[integration-management] Profile wallet cleared for ${producerId}`);
  return jsonResponse({ success: true }, corsHeaders);
}
