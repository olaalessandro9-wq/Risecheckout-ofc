/**
 * Integration Profile & Status Handlers
 * 
 * Extracted profile wallet and status handlers for integration-management.
 * RISE Protocol V2 Compliant - Zero `any`
 * 
 * @created 2026-01-13 - Extracted from integration-handlers.ts
 * @version 2.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import { 
  jsonResponse, 
  errorResponse,
} from "./integration-handlers.ts";

// ============================================================================
// TYPES
// ============================================================================

interface IntegrationRecord {
  id: string;
  integration_type: string;
  active: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HANDLER: GET STATUS
// ============================================================================

export async function handleGetStatus(
  supabase: SupabaseClient,
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
// HANDLER: SAVE PROFILE WALLET
// ============================================================================

export async function handleSaveProfileWallet(
  supabase: SupabaseClient,
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

// ============================================================================
// HANDLER: CLEAR PROFILE WALLET
// ============================================================================

export async function handleClearProfileWallet(
  supabase: SupabaseClient,
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
