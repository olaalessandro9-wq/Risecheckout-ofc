/**
 * Helper: fetchOfferData
 * 
 * Busca dados da oferta associada ao checkout via checkout_links → payment_links → offers
 */

import { supabase } from "@/integrations/supabase/client";

export interface OfferData {
  offerId: string;
  offerName: string;
  offerPrice: number;
}

export async function fetchOfferData(checkoutId: string): Promise<OfferData> {
  const { data, error } = await supabase
    .from("checkout_links")
    .select(`
      link_id,
      payment_links!inner (
        offer_id,
        offers!inner (
          id,
          name,
          price
        )
      )
    `)
    .eq("checkout_id", checkoutId)
    .maybeSingle();

  if (error || !data) {
    console.error('[fetchOfferData] Erro:', error);
    throw new Error("Oferta não encontrada");
  }

  const paymentLinks = data.payment_links as {
    offer_id: string;
    offers: {
      id: string;
      name: string;
      price: number;
    };
  };

  return {
    offerId: paymentLinks.offer_id,
    offerName: paymentLinks.offers.name,
    offerPrice: paymentLinks.offers.price,
  };
}
