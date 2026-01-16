/**
 * Helper: fetchOfferData
 * 
 * MIGRATED: Uses checkout-public-data Edge Function
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { supabase } from "@/integrations/supabase/client";

export interface OfferData {
  offerId: string;
  offerName: string;
  offerPrice: number;
}

export async function fetchOfferData(checkoutId: string): Promise<OfferData> {
  const { data, error } = await supabase.functions.invoke("checkout-public-data", {
    body: {
      action: "offer",
      checkoutId,
    },
  });

  if (error) {
    console.error('[fetchOfferData] Edge function error:', error);
    throw new Error("Oferta não encontrada");
  }

  if (!data?.success || !data?.data) {
    console.error('[fetchOfferData] Invalid response:', data);
    throw new Error(data?.error || "Oferta não encontrada");
  }

  return data.data;
}
