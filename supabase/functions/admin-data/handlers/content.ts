/**
 * Content Handlers for admin-data
 * 
 * Handles: content-editor-data, content-drip-settings, content-access-check,
 *          vendor-integration, marketplace-categories, marketplace-stats
 * 
 * @see RISE Protocol V3 - Limite 300 linhas por arquivo
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../types.ts";

// ==========================================
// CONTENT EDITOR DATA
// ==========================================

export async function getContentEditorData(
  supabase: SupabaseClient,
  contentId: string | undefined,
  moduleId: string | undefined,
  isNew: boolean,
  _producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const result: Record<string, unknown> = {
    content: null,
    attachments: [],
    release: null,
    moduleContents: [],
  };

  if (moduleId) {
    const { data: contentsData } = await supabase
      .from("product_member_content")
      .select("id, title")
      .eq("module_id", moduleId)
      .eq("is_active", true)
      .order("position", { ascending: true });

    result.moduleContents = contentsData || [];
  }

  if (isNew || !contentId) {
    return jsonResponse(result, corsHeaders);
  }

  const { data: contentData, error: contentError } = await supabase
    .from("product_member_content")
    .select("*")
    .eq("id", contentId)
    .single();

  if (contentError) {
    console.error("[admin-data] Content error:", contentError);
    return errorResponse("Conteúdo não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  result.content = contentData;

  const { data: attachmentsData } = await supabase
    .from("content_attachments")
    .select("*")
    .eq("content_id", contentId)
    .order("position", { ascending: true });

  result.attachments = attachmentsData || [];

  const { data: releaseData } = await supabase
    .from("content_release_settings")
    .select("*")
    .eq("content_id", contentId)
    .maybeSingle();

  result.release = releaseData;

  return jsonResponse(result, corsHeaders);
}

// ==========================================
// CONTENT DRIP SETTINGS
// ==========================================

export async function getContentDripSettings(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: modules } = await supabase
    .from("product_member_modules")
    .select("id")
    .eq("product_id", productId);

  if (!modules?.length) {
    return jsonResponse({ settings: [] }, corsHeaders);
  }

  const moduleIds = modules.map(m => m.id);

  const { data: contents } = await supabase
    .from("product_member_content")
    .select("id")
    .in("module_id", moduleIds);

  if (!contents?.length) {
    return jsonResponse({ settings: [] }, corsHeaders);
  }

  const contentIds = contents.map(c => c.id);

  const { data: settings } = await supabase
    .from("content_release_settings")
    .select("*")
    .in("content_id", contentIds);

  return jsonResponse({ settings: settings || [] }, corsHeaders);
}

// ==========================================
// CONTENT ACCESS CHECK
// ==========================================

export async function checkContentAccess(
  supabase: SupabaseClient,
  contentId: string,
  buyerId: string,
  purchaseDate: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: settings } = await supabase
    .from("content_release_settings")
    .select("*")
    .eq("content_id", contentId)
    .maybeSingle();

  if (!settings) {
    return jsonResponse({
      content_id: contentId,
      is_accessible: true,
      unlock_date: null,
      reason: "available",
    }, corsHeaders);
  }

  const now = new Date();
  const purchase = new Date(purchaseDate);

  if (settings.release_type === "after_content" && settings.after_content_id) {
    const { data: progress } = await supabase
      .from("buyer_content_progress")
      .select("completed_at")
      .eq("buyer_id", buyerId)
      .eq("content_id", settings.after_content_id)
      .maybeSingle();

    if (!progress?.completed_at) {
      return jsonResponse({
        content_id: contentId,
        is_accessible: false,
        unlock_date: null,
        reason: "drip_locked",
      }, corsHeaders);
    }

    return jsonResponse({
      content_id: contentId,
      is_accessible: true,
      unlock_date: null,
      reason: "available",
    }, corsHeaders);
  }

  let unlockDate: Date | null = null;

  if (settings.release_type === "days_after_purchase" && settings.days_after_purchase) {
    unlockDate = new Date(purchase);
    unlockDate.setDate(unlockDate.getDate() + settings.days_after_purchase);
  } else if (settings.release_type === "fixed_date" && settings.fixed_date) {
    unlockDate = new Date(settings.fixed_date);
  }

  if (!unlockDate || now >= unlockDate) {
    return jsonResponse({
      content_id: contentId,
      is_accessible: true,
      unlock_date: unlockDate?.toISOString() || null,
      reason: "available",
    }, corsHeaders);
  }

  return jsonResponse({
    content_id: contentId,
    is_accessible: false,
    unlock_date: unlockDate.toISOString(),
    reason: "drip_locked",
  }, corsHeaders);
}

// ==========================================
// VENDOR INTEGRATION
// ==========================================

export async function getVendorIntegration(
  supabase: SupabaseClient,
  producerId: string,
  integrationType: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("vendor_integrations")
    .select("*")
    .eq("vendor_id", producerId)
    .eq("integration_type", integrationType)
    .maybeSingle();

  if (error) throw error;

  return jsonResponse({ integration: data }, corsHeaders);
}

// ==========================================
// MARKETPLACE CATEGORIES
// ==========================================

export async function getMarketplaceCategories(
  supabase: SupabaseClient,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("marketplace_categories")
    .select("*")
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[admin-data] Marketplace categories error:", error);
    return errorResponse("Erro ao buscar categorias", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ success: true, data: data || [] }, corsHeaders);
}

// ==========================================
// MARKETPLACE STATS
// ==========================================

export async function getMarketplaceStats(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("products")
    .select("marketplace_views, marketplace_clicks, marketplace_enabled_at")
    .eq("id", productId)
    .single();

  if (error) {
    console.error("[admin-data] Marketplace stats error:", error);
    return errorResponse("Erro ao buscar estatísticas", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({
    success: true,
    data: {
      views: data?.marketplace_views || 0,
      clicks: data?.marketplace_clicks || 0,
      enabledAt: data?.marketplace_enabled_at,
    }
  }, corsHeaders);
}
