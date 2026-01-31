/**
 * Product CRUD Handlers
 * 
 * Extracted handlers for product-crud edge function.
 * Keeps index.ts as a clean router (~120 lines).
 * 
 * RISE Protocol Compliant - Zero `any` (uses typed interfaces)
 * 
 * @version 2.1.0 - Migrated to centralized logger
 */

import { SupabaseClient } from "./supabase-types.ts";
import { captureException } from "./sentry.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("ProductCrud");

// ============================================
// TYPES
// ============================================

/** Tipos de entrega disponíveis */
export type DeliveryType = 'standard' | 'members_area' | 'external';

export interface ProductCreatePayload {
  name: string;
  description?: string;
  price: number;
  delivery_url?: string | null;
  delivery_type?: DeliveryType;
  /** @deprecated Use delivery_type instead */
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

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ProductListResult {
  items: unknown[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
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

  // Resolve delivery_type with external_delivery fallback
  let deliveryType: DeliveryType = 'standard';
  if (data.delivery_type && ['standard', 'members_area', 'external'].includes(data.delivery_type as string)) {
    deliveryType = data.delivery_type as DeliveryType;
  } else if (data.external_delivery === true) {
    deliveryType = 'external';
  }

  // Sync external_delivery from delivery_type for database consistency
  const externalDelivery = deliveryType === 'external';

  let deliveryUrl: string | null = null;
  // Only validate delivery_url for 'standard' type
  if (deliveryType === 'standard' && data.delivery_url) {
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
      delivery_type: deliveryType,
      external_delivery: externalDelivery, // @deprecated - kept for database sync
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

  // Handle delivery_type with external_delivery sync
  if (data.delivery_type !== undefined) {
    if (['standard', 'members_area', 'external'].includes(data.delivery_type as string)) {
      updates.delivery_type = data.delivery_type;
      // Sync database field
      updates.external_delivery = data.delivery_type === 'external';
    }
  } else if (data.external_delivery !== undefined) {
    // Fallback: external_delivery boolean
    updates.external_delivery = data.external_delivery === true;
    updates.delivery_type = data.external_delivery ? 'external' : 'standard';
  }

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
// LIST HANDLER
// ============================================

export async function handleListProducts(
  supabase: SupabaseClient,
  producerId: string,
  params: ProductListParams,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const offset = (page - 1) * pageSize;
  const sortBy = params.sortBy || "created_at";
  const sortOrder = params.sortOrder === "asc";

  try {
    // Build query
    let query = supabase
      .from("products")
      .select("id, name, description, price, status, image_url, created_at, updated_at, members_area_enabled", { count: "exact" })
      .eq("user_id", producerId);

    // Apply filters
    if (params.status && ["active", "blocked"].includes(params.status)) {
      query = query.eq("status", params.status);
    }

    if (params.search) {
      query = query.ilike("name", `%${params.search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder });

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: products, error, count } = await query;

    if (error) {
      log.error("List error", error);
      return new Response(JSON.stringify({ success: false, error: "Erro ao listar produtos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const total = count || 0;
    const result: ProductListResult = {
      items: products || [],
      total,
      page,
      pageSize,
      hasMore: offset + pageSize < total,
    };

    log.info(`Listed ${products?.length || 0} products for producer ${producerId}`);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("List error", errorMessage);
    return new Response(JSON.stringify({ success: false, error: "Erro ao listar produtos" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

// ============================================
// GET HANDLER
// ============================================

export async function handleGetProduct(
  supabase: SupabaseClient,
  producerId: string,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { data: product, error } = await supabase
      .from("products")
      .select(`
        id, name, description, price, status, image_url, 
        delivery_url, external_delivery, support_name, support_email,
        members_area_enabled, marketplace_enabled, affiliate_enabled,
        created_at, updated_at
      `)
      .eq("id", productId)
      .eq("user_id", producerId)
      .maybeSingle();

    if (error) {
      log.error("Get error", error);
      return new Response(JSON.stringify({ success: false, error: "Erro ao buscar produto" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!product) {
      return new Response(JSON.stringify({ success: false, error: "Produto não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    log.info(`Got product ${productId} for producer ${producerId}`);

    return new Response(JSON.stringify({ success: true, data: product }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Get error", errorMessage);
    return new Response(JSON.stringify({ success: false, error: "Erro ao buscar produto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

// ============================================
// CREATE HANDLER
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
    log.error("Insert error", insertError);
    await captureException(new Error(insertError.message), { functionName: "product-crud", extra: { action: "create", producerId } });
    return new Response(JSON.stringify({ success: false, error: "Erro ao criar produto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  log.info(`Product created: ${(newProduct as ProductRecord).id}`);
  return new Response(JSON.stringify({ success: true, product: newProduct }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// ============================================
// UPDATE HANDLER
// ============================================

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
    log.error("Update error", updateError);
    return new Response(JSON.stringify({ success: false, error: "Erro ao atualizar produto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  log.info(`Product updated: ${productId}`);
  return new Response(JSON.stringify({ success: true, product: updatedProduct }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// ============================================
// DELETE HANDLER
// ============================================

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
    log.error("Delete error", deleteError);
    return new Response(JSON.stringify({ success: false, error: "Erro ao excluir produto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  log.info(`Product deleted: ${productId} (${product.name})`);
  return new Response(JSON.stringify({ success: true, deletedId: productId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
