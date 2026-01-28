/**
 * Content Handler
 * 
 * Handles GET /content - Fetch product content with drip verification
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliance
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { calculateContentLock } from "../helpers/drip.ts";
import type {
  BuyerData,
  ProductData,
  ModuleWithContents,
  ContentItem,
  Attachment,
  AttachmentRecord,
  ReleaseSettings,
} from "../types.ts";

const log = createLogger("buyer-orders:content");

export async function handleContent(
  supabase: SupabaseClient,
  buyer: BuyerData,
  productId: string,
  viewport: 'desktop' | 'mobile', // RISE V3: Filter by viewport
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Check if buyer has access to this product (via purchase)
  const { data: hasAccess } = await supabase
    .from("buyer_product_access")
    .select("id")
    .eq("buyer_id", buyer.id)
    .eq("product_id", productId)
    .eq("is_active", true)
    .limit(1)
    .single();

  // If no direct access, check if buyer is the product owner
  let isOwner = false;
  if (!hasAccess) {
    const { data: producerId } = await supabase.rpc("get_user_id_by_email", {
      user_email: buyer.email,
    });

    if (producerId) {
      const { data: productData } = await supabase
        .from("products")
        .select("user_id")
        .eq("id", productId)
        .single();

      isOwner = productData?.user_id === producerId;
    }
  }

  if (!hasAccess && !isOwner) {
    return new Response(
      JSON.stringify({ error: "Você não tem acesso a este produto" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  log.debug(
    `Content access for ${buyer.email} to product ${productId}: hasAccess=${!!hasAccess}, isOwner=${isOwner}`
  );

  // Get product info
  const { data: product } = await supabase
    .from("products")
    .select("id, name, description, image_url, members_area_enabled, members_area_settings")
    .eq("id", productId)
    .single();

  if (!product) {
    return new Response(
      JSON.stringify({ error: "Produto não encontrado" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const typedProduct = product as ProductData;

  if (!typedProduct.members_area_enabled) {
    return new Response(
      JSON.stringify({ error: "Área de membros não está habilitada para este produto" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get Builder sections (banners, modules, etc.) - RISE V3: FILTERED BY VIEWPORT
  const { data: sections, error: sectionsError } = await supabase
    .from("product_members_sections")
    .select("*")
    .eq("product_id", productId)
    .eq("viewport", viewport) // RISE V3: Filter by viewport to prevent duplicates
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (sectionsError) {
    log.debug("Error fetching sections (table may not exist):", sectionsError);
  }

  // Get modules with content
  const { data: modules, error: modulesError } = await supabase
    .from("product_member_modules")
    .select(`
      id,
      title,
      description,
      position,
      is_active,
      cover_image_url,
      contents:product_member_content (
        id,
        title,
        description,
        content_type,
        content_url,
        body,
        content_data,
        position,
        is_active
      )
    `)
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (modulesError) {
    log.error("Error fetching modules:", modulesError);
    return new Response(
      JSON.stringify({ error: "Erro ao buscar conteúdo" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Sort contents by position and filter inactive
  const sortedModules = ((modules || []) as ModuleWithContents[]).map((module) => ({
    ...module,
    contents: (module.contents || [])
      .filter((c: ContentItem) => c.is_active)
      .sort((a: ContentItem, b: ContentItem) => a.position - b.position),
  }));

  // Fetch attachments for all contents
  const allContentIds = sortedModules.flatMap((m) => m.contents.map((c: ContentItem) => c.id));

  const attachmentsMap: Record<string, Attachment[]> = {};
  if (allContentIds.length > 0) {
    const { data: attachments } = await supabase
      .from("content_attachments")
      .select("id, content_id, file_name, file_url, file_type, file_size, position")
      .in("content_id", allContentIds)
      .order("position", { ascending: true });

    if (attachments && attachments.length > 0) {
      log.debug(`Found ${attachments.length} attachments for ${allContentIds.length} contents`);
      for (const att of attachments as AttachmentRecord[]) {
        if (!attachmentsMap[att.content_id]) {
          attachmentsMap[att.content_id] = [];
        }
        attachmentsMap[att.content_id].push({
          id: att.id,
          file_name: att.file_name,
          file_url: att.file_url,
          file_type: att.file_type,
          file_size: att.file_size,
        });
      }
    }
  }

  // RISE V3: Fetch release settings and buyer progress for drip calculation
  const releaseSettingsMap = new Map<string, ReleaseSettings>();
  const completedContentIds = new Set<string>();
  let purchaseDate: string | null = null;

  if (allContentIds.length > 0) {
    // Get release settings
    const { data: releaseData } = await supabase
      .from("content_release_settings")
      .select("content_id, release_type, days_after_purchase, fixed_date, after_content_id")
      .in("content_id", allContentIds);

    if (releaseData) {
      for (const rs of releaseData as ReleaseSettings[]) {
        releaseSettingsMap.set(rs.content_id, rs);
      }
    }

    // Get buyer's completed contents (only if not owner)
    if (!isOwner) {
      const { data: progress } = await supabase
        .from("buyer_content_progress")
        .select("content_id")
        .eq("buyer_id", buyer.id)
        .not("completed_at", "is", null);

      if (progress) {
        for (const p of progress as { content_id: string }[]) {
          completedContentIds.add(p.content_id);
        }
      }

      // Get purchase date for drip calculation
      const { data: accessData } = await supabase
        .from("buyer_product_access")
        .select("granted_at")
        .eq("buyer_id", buyer.id)
        .eq("product_id", productId)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (accessData) {
        purchaseDate = accessData.granted_at;
      }
    }
  }

  // Add attachments and lock info to each content
  const modulesWithAttachments = sortedModules.map((module) => ({
    ...module,
    contents: module.contents.map((c: ContentItem) => {
      const lockInfo = isOwner
        ? { is_locked: false, unlock_date: null, lock_reason: null }
        : calculateContentLock(c.id, releaseSettingsMap, purchaseDate, completedContentIds);

      return {
        ...c,
        attachments: attachmentsMap[c.id] || [],
        ...lockInfo,
      };
    }),
  }));

  return new Response(
    JSON.stringify({
      product: {
        id: typedProduct.id,
        name: typedProduct.name,
        description: typedProduct.description,
        imageUrl: typedProduct.image_url,
        settings: typedProduct.members_area_settings,
      },
      modules: modulesWithAttachments,
      sections: sections || [],
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
