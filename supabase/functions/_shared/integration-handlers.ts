/**
 * Integration Management Handlers
 * 
 * Extracted handlers for integration-management edge function.
 * 
 * RISE Protocol V3 Compliant:
 * - Response helpers from response-helpers.ts
 * - Uses consolidated rate-limiting
 * - Centralized Logger
 * @version 3.1.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  checkRateLimit as checkRateLimitCore, 
  RATE_LIMIT_CONFIGS,
  type RateLimitResult 
} from "./rate-limiting/index.ts";
import { jsonResponse, errorResponse } from "./response-helpers.ts";
import { createLogger } from "./logger.ts";
import { deleteCredentialsFromVault } from "./vault-credentials.ts";

const log = createLogger("IntegrationHandlers");

// Re-export for public API
export { jsonResponse, errorResponse };

// ============================================================================
// TYPES
// ============================================================================

export type IntegrationType = "MERCADOPAGO" | "STRIPE" | "ASAAS" | "PUSHINPAY";

const VALID_INTEGRATION_TYPES: readonly string[] = ["MERCADOPAGO", "STRIPE", "ASAAS", "PUSHINPAY"];

export interface CredentialsPayload {
  integrationType: IntegrationType;
  config: Record<string, unknown>;
}

// ============================================================================
// UUID VALIDATION HELPER
// ============================================================================

/**
 * Validates if a string is a valid UUID (v1-v5 format).
 * Used to prevent Postgres 22P02 errors when invalid IDs are passed.
 */
function isUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// ============================================================================
// RATE LIMITING (RISE V3 - simplified signature wrapper)
// ============================================================================

/**
 * Rate limit check with simplified signature for API stability.
 * Delegates to consolidated rate-limiting module.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  producerId: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const result: RateLimitResult = await checkRateLimitCore(
    supabase, 
    `producer:${producerId}:${action}`, 
    RATE_LIMIT_CONFIGS.PRODUCER_ACTION
  );
  
  // Convert ISO timestamp to seconds remaining
  let retryAfterSeconds: number | undefined;
  if (result.retryAfter) {
    const retryDate = new Date(result.retryAfter);
    retryAfterSeconds = Math.max(0, Math.ceil((retryDate.getTime() - Date.now()) / 1000));
  }
  
  return { 
    allowed: result.allowed, 
    retryAfter: retryAfterSeconds 
  };
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
  supabase: SupabaseClient,
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
      log.error("Update error:", error);
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
      log.error("Insert error:", error);
      return errorResponse("Erro ao criar integração", corsHeaders, 500);
    }
  }

  // Rate limit auto-records in consolidated module

  log.info(`Credentials saved for ${integrationType} by ${producerId}`);
  return jsonResponse({ success: true }, corsHeaders);
}

// ============================================================================
// HANDLER: DISCONNECT (RISE V3 - Soft-Delete + Vault Cleanup)
// ============================================================================

export async function handleDisconnect(
  supabase: SupabaseClient,
  producerId: string,
  body: { integrationType?: string; integrationId?: string },
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { integrationType, integrationId } = body;

  if (!integrationType && !integrationId) {
    return errorResponse("Tipo de integração ou ID é obrigatório", corsHeaders, 400);
  }

  // RISE V3: Validate integrationId is UUID if provided (prevents Postgres 22P02)
  if (integrationId && !isUuid(integrationId)) {
    log.warn("Invalid integrationId format:", { integrationId, producerId });
    return errorResponse("integrationId inválido; esperado UUID", corsHeaders, 400);
  }

  // RISE V3: Validate integrationType against allowed values
  if (integrationType) {
    const normalizedType = integrationType.toUpperCase();
    if (!VALID_INTEGRATION_TYPES.includes(normalizedType)) {
      log.warn("Invalid integrationType:", { integrationType, producerId });
      return errorResponse(`integrationType inválido: ${integrationType}`, corsHeaders, 400);
    }
  }

  try {
    // 1. BUSCAR A INTEGRAÇÃO PRIMEIRO (para obter o tipo se não fornecido)
    let query = supabase.from("vendor_integrations").select("id, integration_type");
    
    if (integrationId) {
      query = query.eq("id", integrationId).eq("vendor_id", producerId);
    } else {
      const normalizedType = integrationType!.toUpperCase();
      query = query.eq("vendor_id", producerId).eq("integration_type", normalizedType);
    }

    const { data: integration, error: fetchError } = await query.maybeSingle();

    if (fetchError) {
      log.error("Error fetching integration:", fetchError);
      return errorResponse("Erro ao buscar integração", corsHeaders, 500);
    }

    if (!integration) {
      log.warn("Integration not found", { integrationId, integrationType, producerId });
      return errorResponse("Integração não encontrada", corsHeaders, 404);
    }

    const gatewayType = (integration.integration_type as string).toLowerCase();

    // 2. DELETAR CREDENCIAIS DO VAULT (se existirem)
    const vaultResult = await deleteCredentialsFromVault(
      supabase,
      producerId,
      gatewayType
    );
    
    if (!vaultResult.success) {
      log.warn("Failed to delete vault credentials (continuing):", vaultResult.error);
      // Não falha a operação inteira - credenciais podem não existir
    } else {
      log.info("✅ Credentials deleted from Vault");
    }

    // 3. SOFT-DELETE: UPDATE active=false, limpar config
    const { error: updateError } = await supabase
      .from("vendor_integrations")
      .update({
        active: false,
        config: {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id);

    if (updateError) {
      log.error("Error deactivating integration:", updateError);
      return errorResponse("Erro ao desativar integração", corsHeaders, 500);
    }

    log.info(`✅ Disconnected ${gatewayType} for ${producerId}`);
    return jsonResponse({ success: true }, corsHeaders);

  } catch (error) {
    log.error("Disconnect exception:", error);
    return errorResponse("Erro inesperado ao desconectar", corsHeaders, 500);
  }
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
  handleUpdateProfile,
} from "./integration-profile-handlers.ts";
