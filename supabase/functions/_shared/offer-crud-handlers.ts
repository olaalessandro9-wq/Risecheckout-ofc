/**
 * Offer CRUD Handlers
 * 
 * Extracted handlers for offer-crud edge function.
 * Keeps index.ts as a clean router (~100 lines).
 * 
 * RISE Protocol Compliant - Zero `any` (uses typed interfaces)
 */

import { SupabaseClient } from "./supabase-types.ts";
import { captureException } from "./sentry.ts";

// ============================================
// TYPES
// ============================================

export interface OfferCreatePayload {
  product_id: string;
  name: string;
  price: number;
  is_default?: boolean;
  member_group_id?: string | null;
}

interface OfferRecord {
  id: string;
  product_id: string;
}

interface ProductOwnerRecord {
  user_id: string;
}

interface OfferWithProductRecord {
  id: string;
  product_id: string;
  products: ProductOwnerRecord | ProductOwnerRecord[];
}

// ============================================
// VALIDATION
// ============================================

export function validateCreateOffer(data: Record<string, unknown>): { valid: boolean; error?: string; sanitized?: OfferCreatePayload } {
  if (!data.product_id || typeof data.product_id !== "string") {
    return { valid: false, error: "ID do produto é obrigatório" };
  }

  if (!data.name || typeof data.name !== "string") {
    return { valid: false, error: "Nome da oferta é obrigatório" };
  }

  const name = data.name.trim();
  if (name.length < 1 || name.length > 100) {
    return { valid: false, error: "Nome deve ter entre 1 e 100 caracteres" };
  }

  if (typeof data.price !== "number" || !Number.isInteger(data.price) || data.price <= 0) {
    return { valid: false, error: "Preço deve ser um valor inteiro positivo em centavos" };
  }

  return {
    valid: true,
    sanitized: {
      product_id: data.product_id as string,
      name,
      price: data.price as number,
      is_default: data.is_default === true,
      member_group_id: (data.member_group_id as string) || null,
    },
  };
}

export function validateUpdateOffer(data: Record<string, unknown>): { valid: boolean; error?: string; offer_id?: string; updates?: Partial<OfferCreatePayload> } {
  if (!data.offer_id || typeof data.offer_id !== "string") {
    return { valid: false, error: "ID da oferta é obrigatório" };
  }

  const updates: Partial<OfferCreatePayload> = {};

  if (data.name !== undefined) {
    if (typeof data.name !== "string") {
      return { valid: false, error: "Nome deve ser texto" };
    }
    const name = data.name.trim();
    if (name.length < 1 || name.length > 100) {
      return { valid: false, error: "Nome deve ter entre 1 e 100 caracteres" };
    }
    updates.name = name;
  }

  if (data.price !== undefined) {
    if (typeof data.price !== "number" || !Number.isInteger(data.price) || data.price <= 0) {
      return { valid: false, error: "Preço deve ser um valor inteiro positivo em centavos" };
    }
    updates.price = data.price;
  }

  if (data.member_group_id !== undefined) {
    updates.member_group_id = (data.member_group_id as string) || null;
  }

  return { valid: true, offer_id: data.offer_id as string, updates };
}

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

export async function verifyProductOwnership(
  supabase: SupabaseClient,
  productId: string,
  producerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("user_id", producerId)
    .single();

  return !error && !!data;
}

export async function verifyOfferOwnership(
  supabase: SupabaseClient,
  offerId: string,
  producerId: string
): Promise<{ valid: boolean; productId?: string }> {
  const { data, error } = await supabase
    .from("offers")
    .select("id, product_id, products!inner(user_id)")
    .eq("id", offerId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  const offerData = data as OfferWithProductRecord;
  const productOwner = Array.isArray(offerData.products) ? offerData.products[0] : offerData.products;
  if (productOwner?.user_id !== producerId) {
    return { valid: false };
  }

  return { valid: true, productId: offerData.product_id };
}

// ============================================
// HANDLERS
// ============================================

export async function handleCreateOffer(
  supabase: SupabaseClient,
  producerId: string,
  offerData: OfferCreatePayload,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const isOwner = await verifyProductOwnership(supabase, offerData.product_id, producerId);
  if (!isOwner) {
    return new Response(JSON.stringify({ success: false, error: "Você não tem permissão para criar ofertas neste produto" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const { data: newOffer, error: insertError } = await supabase
    .from("offers")
    .insert({
      product_id: offerData.product_id,
      name: offerData.name,
      price: offerData.price,
      is_default: offerData.is_default || false,
      member_group_id: offerData.member_group_id,
      status: "active",
    })
    .select()
    .single();

  if (insertError) {
    console.error("[offer-crud] Insert error:", insertError);
    await captureException(new Error(insertError.message), { functionName: "offer-crud", extra: { action: "create", producerId } });
    return new Response(JSON.stringify({ success: false, error: "Erro ao criar oferta" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  console.log(`[offer-crud] Offer created: ${(newOffer as OfferRecord).id}`);
  return new Response(JSON.stringify({ success: true, offer: newOffer }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

export async function handleUpdateOffer(
  supabase: SupabaseClient,
  producerId: string,
  offerId: string,
  updates: Partial<OfferCreatePayload>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const ownershipCheck = await verifyOfferOwnership(supabase, offerId, producerId);
  if (!ownershipCheck.valid) {
    return new Response(JSON.stringify({ success: false, error: "Você não tem permissão para editar esta oferta" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const { data: updatedOffer, error: updateError } = await supabase
    .from("offers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", offerId)
    .select()
    .single();

  if (updateError) {
    console.error("[offer-crud] Update error:", updateError);
    await captureException(new Error(updateError.message), { functionName: "offer-crud", extra: { action: "update", producerId } });
    return new Response(JSON.stringify({ success: false, error: "Erro ao atualizar oferta" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  console.log(`[offer-crud] Offer updated: ${offerId}`);
  return new Response(JSON.stringify({ success: true, offer: updatedOffer }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

export async function handleDeleteOffer(
  supabase: SupabaseClient,
  producerId: string,
  offerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const ownershipCheck = await verifyOfferOwnership(supabase, offerId, producerId);
  if (!ownershipCheck.valid) {
    return new Response(JSON.stringify({ success: false, error: "Você não tem permissão para excluir esta oferta" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  await supabase.from("payment_links").update({ status: "inactive" }).eq("offer_id", offerId);

  const { error: deleteError } = await supabase
    .from("offers")
    .update({ status: "deleted", updated_at: new Date().toISOString() })
    .eq("id", offerId);

  if (deleteError) {
    console.error("[offer-crud] Delete error:", deleteError);
    await captureException(new Error(deleteError.message), { functionName: "offer-crud", extra: { action: "delete", producerId } });
    return new Response(JSON.stringify({ success: false, error: "Erro ao excluir oferta" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  console.log(`[offer-crud] Offer deleted: ${offerId}`);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
