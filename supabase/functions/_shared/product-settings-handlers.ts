/**
 * Action handlers for product-settings Edge Function
 * Extracted for RISE Protocol compliance (< 300 lines per file)
 */

// ============================================
// TYPES
// ============================================

interface HandlerResult {
  response: Response;
}

type CorsHeaders = Record<string, string>;

// ============================================
// RESPONSE HELPERS
// ============================================

function jsonResponse(data: any, headers: CorsHeaders, status = 200): Response {
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
  supabase: any,
  productId: string,
  settings: any,
  corsHeaders: CorsHeaders
): Promise<Response> {
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  // Payment settings
  if (settings.default_payment_method !== undefined) updates.default_payment_method = settings.default_payment_method;
  if (settings.pix_gateway !== undefined) updates.pix_gateway = settings.pix_gateway;
  if (settings.credit_card_gateway !== undefined) updates.credit_card_gateway = settings.credit_card_gateway;

  // Required fields
  if (settings.required_fields !== undefined) {
    updates.required_fields = {
      name: true,
      email: true,
      phone: !!settings.required_fields.phone,
      cpf: !!settings.required_fields.cpf,
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
    .single();

  if (updateError) {
    console.error("[product-settings] Update error:", updateError);
    return errorResponse("Erro ao atualizar configurações", corsHeaders, 500);
  }

  console.log(`[product-settings] Settings updated for: ${productId}`);
  return jsonResponse({ success: true, product: updatedProduct }, corsHeaders);
}

// ============================================
// UPDATE GENERAL HANDLER
// ============================================

export async function handleUpdateGeneral(
  supabase: any,
  productId: string,
  data: any,
  corsHeaders: CorsHeaders
): Promise<Response> {
  if (!data || typeof data !== "object") {
    return errorResponse("Dados do produto são obrigatórios", corsHeaders, 400);
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

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

  if (data.external_delivery !== undefined) updates.external_delivery = data.external_delivery === true;
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
    .single();

  if (updateError) {
    console.error("[product-settings] Update-general error:", updateError);
    return errorResponse("Erro ao atualizar produto", corsHeaders, 500);
  }

  console.log(`[product-settings] General update for: ${productId}`);
  return jsonResponse({ success: true, product: updatedProduct }, corsHeaders);
}

// ============================================
// SMART DELETE HANDLER
// ============================================

export async function handleSmartDelete(
  supabase: any,
  productId: string,
  corsHeaders: CorsHeaders
): Promise<Response> {
  // Check orders
  const { count: orderCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const hasOrders = (orderCount || 0) > 0;

  if (hasOrders) {
    // SOFT DELETE
    console.log(`[product-settings] Soft deleting ${productId} (${orderCount} orders)`);

    await supabase
      .from("products")
      .update({ status: "deleted", updated_at: new Date().toISOString() })
      .eq("id", productId);

    await supabase.from("checkouts").update({ status: "deleted" }).eq("product_id", productId);

    const { data: offers } = await supabase.from("offers").select("id").eq("product_id", productId);
    if (offers?.length) {
      await supabase
        .from("payment_links")
        .update({ status: "inactive" })
        .in("offer_id", offers.map((o: any) => o.id));
    }

    console.log(`[product-settings] Soft deleted: ${productId}`);
    return jsonResponse({ success: true, type: "soft", deletedId: productId }, corsHeaders);
  } else {
    // HARD DELETE
    console.log(`[product-settings] Hard deleting ${productId} (no orders)`);

    const { error: deleteError } = await supabase.from("products").delete().eq("id", productId);
    if (deleteError) {
      console.error("[product-settings] Hard delete error:", deleteError);
      return errorResponse("Erro ao excluir produto", corsHeaders, 500);
    }

    console.log(`[product-settings] Hard deleted: ${productId}`);
    return jsonResponse({ success: true, type: "hard", deletedId: productId }, corsHeaders);
  }
}

// ============================================
// UPDATE PRICE HANDLER
// ============================================

export async function handleUpdatePrice(
  supabase: any,
  productId: string,
  price: number,
  corsHeaders: CorsHeaders
): Promise<Response> {
  console.log(`[product-settings] Updating price for ${productId} to ${price}`);

  // 1. Update product
  const { error: productError } = await supabase
    .from("products")
    .update({ price, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (productError) {
    console.error("[product-settings] Product price error:", productError);
    return errorResponse("Erro ao atualizar preço do produto", corsHeaders, 500);
  }

  // 2. Update default offer
  const { error: offerError } = await supabase
    .from("offers")
    .update({ price, updated_at: new Date().toISOString() })
    .eq("product_id", productId)
    .eq("is_default", true);

  if (offerError) {
    console.warn(`[product-settings] Failed to update default offer: ${offerError.message}`);
  }

  console.log(`[product-settings] Price updated for: ${productId}`);
  return jsonResponse({ success: true, price }, corsHeaders);
}

// ============================================
// UPDATE AFFILIATE GATEWAY SETTINGS HANDLER
// ============================================

export async function handleUpdateAffiliateGatewaySettings(
  supabase: any,
  productId: string,
  gatewaySettings: any,
  corsHeaders: CorsHeaders
): Promise<Response> {
  if (!gatewaySettings || typeof gatewaySettings !== "object") {
    return errorResponse("gatewaySettings é obrigatório", corsHeaders, 400);
  }

  // Sanitize structure
  const sanitized = {
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
    .eq("id", productId);

  if (updateError) {
    console.error("[product-settings] Update affiliate gateway settings error:", updateError);
    return errorResponse("Erro ao atualizar configurações de gateway", corsHeaders, 500);
  }

  console.log(`[product-settings] Affiliate gateway settings updated for: ${productId}`);
  return jsonResponse({ success: true }, corsHeaders);
}

// Members Area handler extracted to product-members-area-handlers.ts
export { handleUpdateMembersAreaSettings } from "./product-members-area-handlers.ts";
