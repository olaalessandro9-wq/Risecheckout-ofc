/**
 * Offers Service
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
 * @see RISE Protocol V3 - Zero console.log
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("OffersService");

export type NormalizedOffer = {
  id: string;
  product_id: string;
  price: number;        // em centavos decimais (990.00 = R$ 9,90)
  product_name?: string | null;
  updated_at?: string | null;
};

interface OffersResponse {
  offers?: Array<{
    id: string;
    product_id: string;
    price: number;
    name?: string;
    updated_at?: string;
  }>;
}

/**
 * Fetch offers by product
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
 */
export async function fetchOffersByProduct(productId: string): Promise<NormalizedOffer[]> {
  const { data, error } = await api.call<OffersResponse>("products-crud", {
    action: "get-offers",
    productId,
  });

  if (error) {
    log.error("load offers failed:", error);
    throw new Error(error.message);
  }

  return (data?.offers ?? []).map((offer) => ({
    id: offer.id,
    product_id: offer.product_id,
    price: Number(offer.price), // Preço em centavos decimais (990.00 = R$ 9,90)
    product_name: offer.name,
    updated_at: offer.updated_at
  })) as NormalizedOffer[];
}
