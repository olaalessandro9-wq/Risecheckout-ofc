/**
 * Action handlers for product-settings Edge Function
 * Extracted for RISE Protocol compliance (< 300 lines per file)
 * 
 * @version 3.0.0 - Centralized Logger
 */

import { 
  SupabaseClient, 
  ProductSettings, 
  RequiredFields, 
  AffiliateGatewaySettings,
  JsonResponseData,
  Product,
  Offer,
  UpsellSettingsInput,
} from "./supabase-types.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("ProductSettings");

// ============================================
// TYPES
// ============================================

type CorsHeaders = Record<string, string>;

/** Tipos de entrega disponíveis */
type DeliveryType = 'standard' | 'members_area' | 'external';

interface ProductUpdateData {
  name?: string;
  description?: string;
  price?: number;
  support_name?: string;
  support_email?: string;
  delivery_url?: string | null;
  delivery_type?: DeliveryType;
  /** @deprecated Use delivery_type instead */
  external_delivery?: boolean;
  image_url?: string;
  status?: string;
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
// UPDATE SETTINGS HANDLER
// ============================================

export async function handleUpdateSettings(
  supabase: SupabaseClient,
  productId: string,
  settings: ProductSettings,
  corsHeaders: CorsHeaders
): Promise<Response> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  // Payment settings
  if (settings.default_payment_method !== undefined) updates.default_payment_method = settings.default_payment_method;
  if (settings.pix_gateway !== undefined) updates.pix_gateway = settings.pix_gateway;
  if (settings.credit_card_gateway !== undefined) updates.credit_card_gateway = settings.credit_card_gateway;

  // Required fields
  if (settings.required_fields !== undefined) {
    const reqFields = settings.required_fields as RequiredFields;
    updates.required_fields = {
      name: true,
      email: true,
      phone: !!reqFields.phone,
      cpf: !!reqFields.cpf,
    };
  }

  // Upsell settings
  if (settings.upsell_enabled !== undefined) updates.upsell_enabled = settings.upsell_enabled;
  if (settings.upsell_product_id !== undefined) updates.upsell_product_id = settings.upsell_product_id || null;
  if (settings.upsell_offer_id !== undefined) updates.upsell_offer_id = settings.upsell_offer_id || null;
  if (settings.upsell_title !== undefined) updates.upsell_title = settings.upsell_title;
  if (settings.upsell_description !== undefined) updates.upsell_description = settings.upsell_description;
  if (settings.upsell_button_text !== undefined) updates.upsell_button_text = settings.upsell_button_text;
  if (settings.upsell_decline_text !== undefined) updates.upsell_decline_text = settings.upsell_decline_text;
  if (settings.upsell_timer_enabled !== undefined) updates.upsell_timer_enabled = settings.upsell_timer_enabled;
  if (settings.upsell_timer_minutes !== undefined) updates.upsell_timer_minutes = settings.upsell_timer_minutes;

  // Affiliate settings
  if (settings.affiliate_commission !== undefined) updates.affiliate_commission = settings.affiliate_commission;
  if (settings.marketplace_enabled !== undefined) {
    updates.marketplace_enabled = settings.marketplace_enabled;
    if (settings.marketplace_enabled) updates.marketplace_enabled_at = new Date().toISOString();
  }
  if (settings.marketplace_auto_approve !== undefined) updates.marketplace_auto_approve = settings.marketplace_auto_approve;

  const { data: updatedProduct, error: updateError } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .select()
    .single() as { data: Product | null; error: { message: string } | null };

  if (updateError) {
    log.error("Update error:", updateError);
    return errorResponse("Erro ao atualizar configurações", corsHeaders, 500);
  }

  log.info(`Settings updated for: ${productId}`);
  return jsonResponse({ success: true, product: updatedProduct }, corsHeaders);
}

// ============================================
// UPDATE GENERAL HANDLER
// ============================================

export async function handleUpdateGeneral(
  supabase: SupabaseClient,
  productId: string,
  data: ProductUpdateData,
  corsHeaders: CorsHeaders
): Promise<Response> {
  if (!data || typeof data !== "object") {
    return errorResponse("Dados do produto são obrigatórios", corsHeaders, 400);
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim().length < 1) {
      return errorResponse("Nome do produto é obrigatório", corsHeaders, 400);
    }
    updates.name = data.name.trim();
  }

  if (data.description !== undefined) {
    updates.description = typeof data.description === "string" ? data.description.trim() : "";
  }

  if (data.price !== undefined) {
    if (typeof data.price !== "number" || data.price <= 0) {
      return errorResponse("Preço deve ser maior que zero", corsHeaders, 400);
    }
    updates.price = data.price;
  }

  if (data.support_name !== undefined) {
    updates.support_name = typeof data.support_name === "string" ? data.support_name.trim() : "";
  }

  if (data.support_email !== undefined) {
    const email = typeof data.support_email === "string" ? data.support_email.trim().toLowerCase() : "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse("E-mail de suporte inválido", corsHeaders, 400);
    }
    updates.support_email = email;
  }

  if (data.delivery_url !== undefined) {
    if (data.delivery_url !== null && typeof data.delivery_url === "string") {
      const url = data.delivery_url.trim();
      if (url && !url.startsWith("https://")) {
        return errorResponse("Link de entrega deve começar com https://", corsHeaders, 400);
      }
      updates.delivery_url = url || null;
    } else {
      updates.delivery_url = null;
    }
  }

  // Handle delivery_type with external_delivery sync
  if (data.delivery_type !== undefined) {
    if (['standard', 'members_area', 'external'].includes(data.delivery_type)) {
      updates.delivery_type = data.delivery_type;
      // Sync database field
      updates.external_delivery = data.delivery_type === 'external';
    }
  } else if (data.external_delivery !== undefined) {
    // Fallback: external_delivery boolean
    updates.external_delivery = data.external_delivery === true;
    updates.delivery_type = data.external_delivery ? 'external' : 'standard';
  }

  if (data.image_url !== undefined) updates.image_url = data.image_url;

  if (data.status !== undefined) {
    if (!["active", "blocked", "deleted"].includes(data.status)) {
      return errorResponse("Status inválido", corsHeaders, 400);
    }
    updates.status = data.status;
  }

  const { data: updatedProduct, error: updateError } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .select()
    .single() as { data: Product | null; error: { message: string } | null };

  if (updateError) {
    log.error("Update-general error:", updateError);
    return errorResponse("Erro ao atualizar produto", corsHeaders, 500);
  }

  log.info(`General update for: ${productId}`);
  return jsonResponse({ success: true, product: updatedProduct }, corsHeaders);
}

// ============================================
// SMART DELETE HANDLER
// ============================================

export async function handleSmartDelete(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: CorsHeaders
): Promise<Response> {
  // Check orders
  const { count: orderCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId) as { count: number | null };

  const hasOrders = (orderCount || 0) > 0;

  if (hasOrders) {
    // SOFT DELETE
    log.info(`Soft deleting ${productId} (${orderCount} orders)`);

    await supabase
      .from("products")
      .update({ status: "deleted", updated_at: new Date().toISOString() })
      .eq("id", productId);

    await supabase.from("checkouts").update({ status: "deleted" }).eq("product_id", productId);

    const { data: offers } = await supabase
      .from("offers")
      .select("id")
      .eq("product_id", productId) as { data: Offer[] | null };
    
    if (offers?.length) {
      await supabase
        .from("payment_links")
        .update({ status: "inactive" })
        .in("offer_id", offers.map((o: Offer) => o.id));
    }

    log.info(`Soft deleted: ${productId}`);
    return jsonResponse({ success: true, type: "soft", deletedId: productId }, corsHeaders);
  } else {
    // HARD DELETE
    log.info(`Hard deleting ${productId} (no orders)`);

    const { error: deleteError } = await supabase.from("products").delete().eq("id", productId) as { error: { message: string } | null };
    if (deleteError) {
      log.error("Hard delete error:", deleteError);
      return errorResponse("Erro ao excluir produto", corsHeaders, 500);
    }

    log.info(`Hard deleted: ${productId}`);
    return jsonResponse({ success: true, type: "hard", deletedId: productId }, corsHeaders);
  }
}

// ============================================
// UPDATE PRICE HANDLER
// ============================================

export async function handleUpdatePrice(
  supabase: SupabaseClient,
  productId: string,
  price: number,
  corsHeaders: CorsHeaders
): Promise<Response> {
  log.info(`Updating price for ${productId} to ${price}`);

  // 1. Update product
  const { error: productError } = await supabase
    .from("products")
    .update({ price, updated_at: new Date().toISOString() })
    .eq("id", productId) as { error: { message: string } | null };

  if (productError) {
    log.error("Product price error:", productError);
    return errorResponse("Erro ao atualizar preço do produto", corsHeaders, 500);
  }

  // 2. Update default offer
  const { error: offerError } = await supabase
    .from("offers")
    .update({ price, updated_at: new Date().toISOString() })
    .eq("product_id", productId)
    .eq("is_default", true) as { error: { message: string } | null };

  if (offerError) {
    log.warn(`Failed to update default offer: ${offerError.message}`);
  }

  log.info(`Price updated for: ${productId}`);
  return jsonResponse({ success: true, price }, corsHeaders);
}

// ============================================
// UPDATE AFFILIATE GATEWAY SETTINGS HANDLER
// ============================================

export async function handleUpdateAffiliateGatewaySettings(
  supabase: SupabaseClient,
  productId: string,
  gatewaySettings: AffiliateGatewaySettings,
  corsHeaders: CorsHeaders
): Promise<Response> {
  if (!gatewaySettings || typeof gatewaySettings !== "object") {
    return errorResponse("gatewaySettings é obrigatório", corsHeaders, 400);
  }

  // Sanitize structure
  const sanitized: AffiliateGatewaySettings = {
    pix_allowed: Array.isArray(gatewaySettings.pix_allowed) ? gatewaySettings.pix_allowed : ["asaas"],
    credit_card_allowed: Array.isArray(gatewaySettings.credit_card_allowed)
      ? gatewaySettings.credit_card_allowed
      : ["mercadopago", "stripe"],
    require_gateway_connection: gatewaySettings.require_gateway_connection !== false,
  };

  const { error: updateError } = await supabase
    .from("products")
    .update({
      affiliate_gateway_settings: sanitized,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId) as { error: { message: string } | null };

  if (updateError) {
    log.error("Update affiliate gateway settings error:", updateError);
    return errorResponse("Erro ao atualizar configurações de gateway", corsHeaders, 500);
  }

  log.info(`Affiliate gateway settings updated for: ${productId}`);
  return jsonResponse({ success: true }, corsHeaders);
}

// ============================================
// UPDATE UPSELL SETTINGS HANDLER (JSONB column)
// ============================================

export async function handleUpdateUpsellSettings(
  supabase: SupabaseClient,
  productId: string,
  upsellSettings: UpsellSettingsInput,
  corsHeaders: CorsHeaders
): Promise<Response> {
  log.info(`Updating upsell_settings for: ${productId}`, upsellSettings);

  // Validation: URL required when custom page is enabled
  if (upsellSettings.hasCustomThankYouPage) {
    const url = upsellSettings.customPageUrl?.trim();
    if (!url) {
      return errorResponse("URL é obrigatória quando página personalizada está ativa", corsHeaders, 400);
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return errorResponse("URL deve usar protocolo HTTP ou HTTPS", corsHeaders, 400);
      }
    } catch {
      return errorResponse("URL inválida", corsHeaders, 400);
    }
  }

  // Sanitize and save as JSONB
  const sanitized = {
    hasCustomThankYouPage: !!upsellSettings.hasCustomThankYouPage,
    customPageUrl: upsellSettings.customPageUrl?.trim() || "",
    redirectIgnoringOrderBumpFailures: !!upsellSettings.redirectIgnoringOrderBumpFailures,
  };

  const { error } = await supabase
    .from("products")
    .update({
      upsell_settings: sanitized,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    log.error("Update upsell_settings error:", error);
    return errorResponse("Erro ao atualizar configurações de upsell", corsHeaders, 500);
  }

  log.info(`upsell_settings updated successfully for: ${productId}`);
  return jsonResponse({ success: true }, corsHeaders);
}

// Members Area handler extracted to product-members-area-handlers.ts
export { handleUpdateMembersAreaSettings } from "./product-members-area-handlers.ts";
