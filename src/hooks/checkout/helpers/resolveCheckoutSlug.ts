/**
 * Helper: resolveCheckoutSlug
 * 
 * Resolve slug de checkout para checkout_id e product_id via RPC Proxy
 * 
 * @see RISE Protocol V2 - Zero direct RPC calls from frontend
 */

import { getCheckoutBySlugRpc } from "@/lib/rpc/rpcProxy";

export interface SlugResolution {
  checkoutId: string;
  productId: string;
}

export async function resolveCheckoutSlug(slug: string): Promise<SlugResolution> {
  const { data, error } = await getCheckoutBySlugRpc(slug);

  if (error || !data || data.length === 0 || !data[0]?.checkout_id) {
    console.error('[resolveCheckoutSlug] Erro:', error);
    throw new Error("Checkout não encontrado via RPC");
  }

  return {
    checkoutId: data[0].checkout_id,
    productId: data[0].product_id,
  };
}
