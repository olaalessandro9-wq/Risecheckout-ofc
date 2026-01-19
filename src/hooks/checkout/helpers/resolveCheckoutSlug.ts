/**
 * Helper: resolveCheckoutSlug
 * 
 * Resolve slug de checkout para checkout_id e product_id via RPC Proxy
 * 
 * @see RISE Protocol V3 - Zero console.log
 */

import { getCheckoutBySlugRpc } from "@/lib/rpc/rpcProxy";
import { createLogger } from "@/lib/logger";

const log = createLogger("ResolveCheckoutSlug");

export interface SlugResolution {
  checkoutId: string;
  productId: string;
}

export async function resolveCheckoutSlug(slug: string): Promise<SlugResolution> {
  const { data, error } = await getCheckoutBySlugRpc(slug);

  if (error || !data || data.length === 0 || !data[0]?.checkout_id) {
    log.error("Erro:", error);
    throw new Error("Checkout não encontrado via RPC");
  }

  return {
    checkoutId: data[0].checkout_id,
    productId: data[0].product_id,
  };
}
