/**
 * Integration Profile & Status Handlers
 * 
 * RISE Protocol V3 - 10.0/10 Compliant
 * Uses 'users' table as SSOT for all profile operations
 * 
 * @created 2026-01-13 - Extracted from integration-handlers.ts
 * @updated 2026-01-29 - Migrated from profiles to users (SSOT)
 * @version 3.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import { 
  jsonResponse, 
  errorResponse,
} from "./integration-handlers.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("IntegrationProfile");

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
    log.error("Status error", error);
    return errorResponse("Erro ao buscar status", corsHeaders, 500);
  }

  const integrations = (data as IntegrationRecord[] | null) || [];
  const sanitized = integrations.map((int) => ({
    id: int.id,
    type: int.integration_type,
    integration_type: int.integration_type, // Alias para compatibilidade
    active: int.active,
    isTest: (int.config as { is_test?: boolean })?.is_test || false,
    config: int.config, // Incluir config completo para frontend
    email: (int.config as { email?: string })?.email || null,
    connectedAt: int.created_at,
    updatedAt: int.updated_at,
  }));

  return jsonResponse({ success: true, integrations: sanitized }, corsHeaders);
}

// ============================================================================
// HANDLER: SAVE PROFILE WALLET
// RISE V3: Uses 'users' table as SSOT
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
    .from("users")
    .update({ asaas_wallet_id: walletId })
    .eq("id", producerId);

  if (error) {
    log.error("Save profile wallet error", error);
    return errorResponse("Erro ao salvar wallet", corsHeaders, 500);
  }

  log.info(`Profile wallet saved for ${producerId}: ${walletId}`);
  return jsonResponse({ success: true }, corsHeaders);
}

// ============================================================================
// HANDLER: CLEAR PROFILE WALLET
// RISE V3: Uses 'users' table as SSOT
// ============================================================================

export async function handleClearProfileWallet(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { error } = await supabase
    .from("users")
    .update({ asaas_wallet_id: null })
    .eq("id", producerId);

  if (error) {
    log.error("Clear profile wallet error", error);
    return errorResponse("Erro ao limpar wallet", corsHeaders, 500);
  }

  log.info(`Profile wallet cleared for ${producerId}`);
  return jsonResponse({ success: true }, corsHeaders);
}

// ============================================================================
// HANDLER: UPDATE PROFILE (Nome, CPF, Telefone)
// RISE V3: Uses 'users' table as SSOT
// ============================================================================

interface UpdateProfilePayload {
  name?: string;
  cpf_cnpj?: string;
  phone?: string;
}

export async function handleUpdateProfile(
  supabase: SupabaseClient,
  producerId: string,
  body: UpdateProfilePayload,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { name, cpf_cnpj, phone } = body;

  // Validação: pelo menos um campo deve ser fornecido
  if (!name && cpf_cnpj === undefined && phone === undefined) {
    return errorResponse("Nenhum campo para atualizar", corsHeaders, 400);
  }

  // Monta objeto de update apenas com campos fornecidos
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (name !== undefined) {
    updateData.name = name.trim();
  }
  if (cpf_cnpj !== undefined) {
    updateData.cpf_cnpj = cpf_cnpj || null;
  }
  if (phone !== undefined) {
    updateData.phone = phone || null;
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", producerId);

  if (error) {
    log.error("Update profile error", error);
    return errorResponse("Erro ao atualizar perfil", corsHeaders, 500);
  }

  log.info(`Profile updated for ${producerId}`);
  return jsonResponse({ success: true }, corsHeaders);
}
