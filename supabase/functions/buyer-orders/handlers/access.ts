/**
 * Access Handler
 * 
 * Handles GET /access - List products with access (purchased + owned)
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliance
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import type { BuyerData, AccessItem, OwnProductRow } from "../types.ts";

const log = createLogger("buyer-orders:access");

export async function handleAccess(
  supabase: SupabaseClient,
  buyer: BuyerData,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // 1. Fetch products with access via buyer_product_access
  const { data: access, error } = await supabase
    .from("buyer_product_access")
    .select(`
      id,
      product_id,
      granted_at,
      expires_at,
      is_active,
      access_type,
      product:product_id (
        id,
        name,
        description,
        image_url,
        members_area_enabled,
        user_id
      )
    `)
    .eq("buyer_id", buyer.id)
    .eq("is_active", true);

  if (error) {
    log.error("Error fetching access:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao buscar acessos" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2. Fetch products where producer (by email) is the owner
  const { data: producerId, error: rpcError } = await supabase.rpc(
    "get_user_id_by_email",
    { user_email: buyer.email }
  );

  if (rpcError) {
    log.debug(`RPC error getting producer id for ${buyer.email}:`, rpcError);
  }

  let ownProducts: AccessItem[] = [];
  if (producerId) {
    log.debug(`Found producer id ${producerId} for ${buyer.email}`);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, description, image_url, members_area_enabled, user_id")
      .eq("user_id", producerId)
      .eq("members_area_enabled", true);

    if (productsError) {
      log.debug(`Error fetching producer products:`, productsError);
    }

    if (products && products.length > 0) {
      log.debug(`Found ${products.length} products owned by producer`);
      ownProducts = products.map((p: OwnProductRow) => ({
        id: `own_${p.id}`,
        product_id: p.id,
        granted_at: null,
        expires_at: null,
        is_active: true,
        access_type: "producer",
        product: p,
      }));
    }
  } else {
    log.debug(`No producer id found for ${buyer.email}`);
  }

  // 3. Unify and remove duplicates (prioritize owner if exists)
  const uniqueProducts = new Map<string, AccessItem>();

  // First add own products
  for (const item of ownProducts) {
    uniqueProducts.set(item.product_id, item);
  }

  // Then add purchased (only if not already exists)
  for (const item of (access || []) as unknown as AccessItem[]) {
    if (!uniqueProducts.has(item.product_id)) {
      uniqueProducts.set(item.product_id, item);
    }
  }

  log.info(
    `Access for ${buyer.email}: ${uniqueProducts.size} products (${ownProducts.length} own)`
  );

  return new Response(
    JSON.stringify({ access: Array.from(uniqueProducts.values()) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
