/**
 * Members Area Handlers for admin-data
 * 
 * Handles: members-area-data, members-area-modules, members-area-settings, 
 *          members-area-modules-with-contents
 * 
 * @see RISE Protocol V3 - Limite 300 linhas por arquivo
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../types.ts";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("admin-data/members-area");

// ==========================================
// MEMBERS AREA DATA (Dual-Layout Support)
// ==========================================

export async function getMembersAreaData(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("user_id, name, members_area_settings, image_url")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  if (product.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("product_members_sections")
    .select("*")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (sectionsError) {
    log.error("Sections error", sectionsError);
    return errorResponse("Erro ao buscar seções", "DB_ERROR", corsHeaders, 500);
  }

  // Split sections by viewport (dual-layout)
  const allSections = sections || [];
  const desktopSections = allSections.filter(s => s.viewport === 'desktop' || !s.viewport);
  const mobileSections = allSections.filter(s => s.viewport === 'mobile');

  return jsonResponse({
    sections: allSections,
    desktopSections,
    mobileSections,
    settings: product.members_area_settings || {},
    productImageUrl: product.image_url || null,
    productName: product.name || null,
  }, corsHeaders);
}

// ==========================================
// MEMBERS AREA MODULES
// ==========================================

export async function getMembersAreaModules(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  if (product.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("product_member_modules")
    .select("*")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    log.error("Modules error", error);
    return errorResponse("Erro ao buscar módulos", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ modules: data || [] }, corsHeaders);
}

// ==========================================
// MEMBERS AREA SETTINGS
// ==========================================

export async function getMembersAreaSettings(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: product, error } = await supabase
    .from("products")
    .select("user_id, members_area_enabled, members_area_settings")
    .eq("id", productId)
    .single();

  if (error || !product) {
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  if (product.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  return jsonResponse({
    success: true,
    data: {
      enabled: product.members_area_enabled || false,
      settings: product.members_area_settings || null,
    },
  }, corsHeaders);
}

// ==========================================
// MEMBERS AREA MODULES WITH CONTENTS
// ==========================================

export async function getMembersAreaModulesWithContents(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: product } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", productId)
    .single();

  if (product?.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("product_member_modules")
    .select(`*, contents:product_member_content (*)`)
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    log.error("Modules with contents error", error);
    return errorResponse("Erro ao buscar módulos", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ success: true, data: data || [] }, corsHeaders);
}
