/**
 * Offers Service
 * 
 * MIGRATED: Uses Edge Function instead of direct database access
 * @see RISE Protocol V2 - Zero direct database access from frontend
 */

import { supabase } from "@/integrations/supabase/client";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";

export type NormalizedOffer = {
  id: string;
  product_id: string;
  price: number;        // em centavos decimais (990.00 = R$ 9,90)
  product_name?: string | null;
  updated_at?: string | null;
};

/**
 * Fetch offers by product
 * MIGRATED: Uses Edge Function
 */
export async function fetchOffersByProduct(productId: string): Promise<NormalizedOffer[]> {
  const sessionToken = getProducerSessionToken();

  const { data, error } = await supabase.functions.invoke("products-crud", {
    body: {
      action: "get-offers",
      productId,
    },
    headers: {
      "x-producer-session-token": sessionToken || "",
    },
  });

  if (error) {
    console.error("[Offers] load offers failed:", error);
    throw error;
  }

  return (data?.offers ?? []).map((offer: { id: string; product_id: string; price: number; name?: string; updated_at?: string }) => ({
    id: offer.id,
    product_id: offer.product_id,
    price: Number(offer.price), // Preço em centavos decimais (990.00 = R$ 9,90)
    product_name: offer.name,
    updated_at: offer.updated_at
  })) as NormalizedOffer[];
}
