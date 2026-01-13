/**
 * Product CRUD Handlers
 * 
 * Extracted handlers for product-crud edge function.
 * Keeps index.ts as a clean router (~120 lines).
 * 
 * RISE Protocol Compliant - Zero `any` (uses typed interfaces)
 */

import { SupabaseClient } from "./supabase-types.ts";
import { captureException } from "./sentry.ts";

// ============================================
// TYPES
// ============================================

export interface ProductCreatePayload {
  name: string;
  description?: string;
  price: number;
  delivery_url?: string | null;
  external_delivery?: boolean;
  support_name?: string;
  support_email?: string;
  image_url?: string | null;
}

interface ProductRecord {
  id: string;
  user_id: string;
  name?: string;
}

// ============================================
// VALIDATION
// ============================================

export function validateCreateProduct(data: Record<string, unknown>): { valid: boolean; error?: string; sanitized?: ProductCreatePayload } {
  if (!data.name || typeof data.name !== "string") {
    return { valid: false, error: "Nome do produto é obrigatório" };
  }

  const name = data.name.trim();
  if (name.length < 1 || name.length > 200) {
    return { valid: false, error: "Nome deve ter entre 1 e 200 caracteres" };
  }

  if (typeof data.price !== "number" || !Number.isInteger(data.price) || data.price <= 0) {
    return { valid: false, error: "Preço deve ser um valor inteiro positivo em centavos" };
  }

  let description = "";
  if (data.description) {
    if (typeof data.description !== "string") {
      return { valid: false, error: "Descrição deve ser texto" };
    }
    description = data.description.trim();
    if (description.length > 2000) {
      return { valid: false, error: "Descrição deve ter no máximo 2000 caracteres" };
    }
  }

  let deliveryUrl: string | null = null;
  const externalDelivery = data.external_delivery === true;

  if (!externalDelivery && data.delivery_url) {
    if (typeof data.delivery_url !== "string") {
      return { valid: false, error: "Link de entrega deve ser texto" };
    }
    deliveryUrl = data.delivery_url.trim();
    if (deliveryUrl && !deliveryUrl.startsWith("https://")) {
      return { valid: false, error: "Link de entrega deve começar com https://" };
    }
    if (deliveryUrl) {
      try { new URL(deliveryUrl); } catch { return { valid: false, error: "Link de entrega inválido" }; }
    }
  }

  return {
    valid: true,
    sanitized: {
      name,
      description,
      price: data.price as number,
      delivery_url: deliveryUrl,
      external_delivery: externalDelivery,
      support_name: typeof data.support_name === "string" ? data.support_name.trim() : "",
      support_email: typeof data.support_email === "string" ? data.support_email.trim().toLowerCase() : "",
      image_url: (data.image_url as string) || null,
    },
  };
}

export function validateUpdateProduct(data: Record<string, unknown>): { valid: boolean; error?: string; productId?: string; updates?: Record<string, unknown> } {
  if (!data.productId || typeof data.productId !== "string") {
    return { valid: false, error: "ID do produto é obrigatório" };
  }

  const updates: Record<string, unknown> = {};

  if (data.name !== undefined) {
    if (typeof data.name !== "string") return { valid: false, error: "Nome deve ser texto" };
    const name = data.name.trim();
    if (name.length < 1 || name.length > 200) return { valid: false, error: "Nome deve ter entre 1 e 200 caracteres" };
    updates.name = name;
  }

  if (data.description !== undefined) {
    if (typeof data.description !== "string") return { valid: false, error: "Descrição deve ser texto" };
    updates.description = data.description.trim();
  }

  if (data.price !== undefined) {
    if (typeof data.price !== "number" || !Number.isInteger(data.price) || data.price <= 0) {
      return { valid: false, error: "Preço deve ser um valor inteiro positivo em centavos" };
    }
    updates.price = data.price;
  }

  if (data.delivery_url !== undefined) {
    if (data.delivery_url !== null && typeof data.delivery_url !== "string") {
      return { valid: false, error: "Link de entrega deve ser texto" };
    }
    if (data.delivery_url) {
      const url = (data.delivery_url as string).trim();
      if (url && !url.startsWith("https://")) return { valid: false, error: "Link de entrega deve começar com https://" };
      try { if (url) new URL(url); } catch { return { valid: false, error: "Link de entrega inválido" }; }
      updates.delivery_url = url;
    } else {
      updates.delivery_url = null;
    }
  }

  if (data.external_delivery !== undefined) updates.external_delivery = data.external_delivery === true;
  if (data.support_name !== undefined) updates.support_name = typeof data.support_name === "string" ? data.support_name.trim() : "";
  if (data.support_email !== undefined) updates.support_email = typeof data.support_email === "string" ? data.support_email.trim().toLowerCase() : "";
  if (data.image_url !== undefined) updates.image_url = data.image_url;
  if (data.status !== undefined) {
    if (!["active", "blocked"].includes(data.status as string)) return { valid: false, error: "Status deve ser 'active' ou 'blocked'" };
    updates.status = data.status;
  }

  return { valid: true, productId: data.productId as string, updates };
}

// ============================================
// HANDLERS
// ============================================

export async function handleCreateProduct(
  supabase: SupabaseClient,
  producerId: string,
  productData: ProductCreatePayload,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: newProduct, error: insertError } = await supabase
    .from("products")
    .insert({ ...productData, user_id: producerId, status: "active" })
    .select()
    .single();

  if (insertError) {
    console.error("[product-crud] Insert error:", insertError);
    await captureException(new Error(insertError.message), { functionName: "product-crud", extra: { action: "create", producerId } });
    return new Response(JSON.stringify({ success: false, error: "Erro ao criar produto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  console.log(`[product-crud] Product created: ${(newProduct as ProductRecord).id}`);
  return new Response(JSON.stringify({ success: true, product: newProduct }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

export async function handleUpdateProduct(
  supabase: SupabaseClient,
  producerId: string,
  productId: string,
  updates: Record<string, unknown>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Verify ownership
  const { data: existingProduct, error: fetchError } = await supabase
    .from("products")
    .select("id, user_id")
    .eq("id", productId)
    .single();

  if (fetchError || !existingProduct) {
    return new Response(JSON.stringify({ success: false, error: "Produto não encontrado" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  if ((existingProduct as ProductRecord).user_id !== producerId) {
    return new Response(JSON.stringify({ success: false, error: "Você não tem permissão para editar este produto" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const { data: updatedProduct, error: updateError } = await supabase
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select()
    .single();

  if (updateError) {
    console.error("[product-crud] Update error:", updateError);
    return new Response(JSON.stringify({ success: false, error: "Erro ao atualizar produto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  console.log(`[product-crud] Product updated: ${productId}`);
  return new Response(JSON.stringify({ success: true, product: updatedProduct }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

export async function handleDeleteProduct(
  supabase: SupabaseClient,
  producerId: string,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Verify ownership
  const { data: existingProduct, error: fetchError } = await supabase
    .from("products")
    .select("id, user_id, name")
    .eq("id", productId)
    .single();

  if (fetchError || !existingProduct) {
    return new Response(JSON.stringify({ success: false, error: "Produto não encontrado" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const product = existingProduct as ProductRecord;

  if (product.user_id !== producerId) {
    return new Response(JSON.stringify({ success: false, error: "Você não tem permissão para excluir este produto" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const { error: deleteError } = await supabase.from("products").delete().eq("id", productId);
  if (deleteError) {
    console.error("[product-crud] Delete error:", deleteError);
    return new Response(JSON.stringify({ success: false, error: "Erro ao excluir produto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  console.log(`[product-crud] Product deleted: ${productId} (${product.name})`);
  return new Response(JSON.stringify({ success: true, deletedId: productId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
