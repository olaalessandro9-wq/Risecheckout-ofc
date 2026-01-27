/**
 * Members Area Settings Handler
 * 
 * @version 4.0.0 - RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * SSOT: users table is the single source of truth
 * Producer already exists in users table - no need for separate buyer_profiles
 */

import { SupabaseClient, MembersAreaSettings, JsonResponseData } from "./supabase-types.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("MembersArea");

// ============================================
// TYPES
// ============================================

type CorsHeaders = Record<string, string>;

interface GroupRecord {
  id: string;
}

// ============================================
// RESPONSE HELPERS
// ============================================

function jsonResponse(data: JsonResponseData, headers: CorsHeaders, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, headers: CorsHeaders, status = 400): Response {
  return jsonResponse({ success: false, error: message }, headers, status);
}

// ============================================
// INTERNAL HELPERS (para Enable)
// ============================================

/**
 * RISE V3: Producer already exists in users table
 * No need to create a separate buyer_profile for them
 * They can access their own members area using their existing user ID
 */
async function ensureProducerHasAccess(
  supabase: SupabaseClient,
  producerEmail: string,
  producerId: string
): Promise<void> {
  // RISE V3: Producer exists in users table, which is the SSOT
  // Simply verify they exist - no need to create anything
  const normalizedEmail = producerEmail.toLowerCase().trim();
  
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingUser) {
    log.info(`Producer already exists in users table: ${existingUser.id}`);
    return;
  }

  // If for some reason the producer doesn't exist in users, log a warning
  // This should not happen as producers are created during registration
  log.warn(`Producer ${producerId} not found in users table - this is unexpected`);
}

/**
 * Garante que o produto tem um grupo padrão
 */
async function ensureDefaultGroup(
  supabase: SupabaseClient,
  productId: string
): Promise<void> {
  // Check if any group exists
  const { data: existingGroups } = await supabase
    .from("product_member_groups")
    .select("id")
    .eq("product_id", productId)
    .limit(1) as { data: GroupRecord[] | null };

  if (existingGroups && existingGroups.length > 0) {
    log.info(`Default group already exists for product: ${productId}`);
    return;
  }

  // Create default group
  const { error: createError } = await supabase
    .from("product_member_groups")
    .insert({
      product_id: productId,
      name: "Padrão",
      description: "Grupo padrão para todos os alunos",
      is_default: true,
    });

  if (createError) {
    log.error("Error creating default group", createError);
  } else {
    log.info(`Created default group for product: ${productId}`);
  }
}

// ============================================
// ENABLE MEMBERS AREA (CONSOLIDATED - OPTIMIZED)
// ============================================

/**
 * Habilita a área de membros com todas as configurações necessárias em uma única chamada.
 * 
 * RISE V3: Producer uses unified users table - no buyer_profiles creation needed
 * 
 * Executa em paralelo:
 * 1. Atualiza members_area_enabled = true
 * 2. Verifica que producer existe em users (SSOT)
 * 3. Garante grupo padrão
 */
export async function handleEnableMembersArea(
  supabase: SupabaseClient,
  productId: string,
  producerEmail: string,
  producerId: string,
  corsHeaders: CorsHeaders
): Promise<Response> {
  log.info(`Enabling members area for product: ${productId}`);
  
  const startTime = Date.now();
  
  try {
    // 1. Atualizar produto (necessário completar antes de prosseguir)
    const { error: updateError } = await supabase
      .from("products")
      .update({ 
        members_area_enabled: true, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", productId);

    if (updateError) {
      log.error("Error enabling members area", updateError);
      return errorResponse("Erro ao habilitar área de membros", corsHeaders, 500);
    }

    // 2. Executar setup em paralelo (verify producer + default group)
    await Promise.all([
      ensureProducerHasAccess(supabase, producerEmail, producerId),
      ensureDefaultGroup(supabase, productId),
    ]);

    const duration = Date.now() - startTime;
    log.info(`Enabled members area in ${duration}ms for: ${productId}`);
    
    return jsonResponse({ success: true, enabled: true }, corsHeaders);
  } catch (error) {
    log.error("Unexpected error", error);
    return errorResponse("Erro interno ao habilitar área de membros", corsHeaders, 500);
  }
}

// ============================================
// DISABLE MEMBERS AREA (SIMPLE UPDATE)
// ============================================

/**
 * Desabilita a área de membros (apenas update simples)
 */
export async function handleDisableMembersArea(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: CorsHeaders
): Promise<Response> {
  log.info(`Disabling members area for product: ${productId}`);
  
  const { error: updateError } = await supabase
    .from("products")
    .update({ 
      members_area_enabled: false, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", productId);

  if (updateError) {
    log.error("Error disabling members area", updateError);
    return errorResponse("Erro ao desabilitar área de membros", corsHeaders, 500);
  }

  log.info(`Disabled members area for: ${productId}`);
  return jsonResponse({ success: true, enabled: false }, corsHeaders);
}

// ============================================
// UPDATE MEMBERS AREA SETTINGS HANDLER
// ============================================

export async function handleUpdateMembersAreaSettings(
  supabase: SupabaseClient,
  productId: string,
  enabled: boolean | undefined,
  settings: MembersAreaSettings | undefined,
  corsHeaders: CorsHeaders
): Promise<Response> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (enabled !== undefined) {
    updates.members_area_enabled = !!enabled;
  }

  if (settings !== undefined) {
    updates.members_area_settings = settings;
  }

  const { error: updateError } = await supabase.from("products").update(updates).eq("id", productId) as { error: { message: string } | null };

  if (updateError) {
    log.error("Update members area settings error", updateError);
    return errorResponse("Erro ao atualizar configurações da área de membros", corsHeaders, 500);
  }

  log.info(`Members area settings updated for: ${productId}`);
  return jsonResponse({ success: true, enabled, settings }, corsHeaders);
}
