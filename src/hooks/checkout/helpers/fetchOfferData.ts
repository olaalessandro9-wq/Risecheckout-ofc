/**
 * Helper: fetchOfferData
 * 
 * MIGRATED: Uses api.publicCall() for public checkout data
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { api } from "@/lib/api";

export interface OfferData {
  offerId: string;
  offerName: string;
  offerPrice: number;
}

interface OfferDataResponse {
  success: boolean;
  data?: OfferData;
  error?: string;
}

export async function fetchOfferData(checkoutId: string): Promise<OfferData> {
  const { data, error } = await api.publicCall<OfferDataResponse>("checkout-public-data", {
    action: "offer",
    checkoutId,
  });

  if (error) {
    console.error('[fetchOfferData] API error:', error);
    throw new Error("Oferta não encontrada");
  }

  if (!data?.success || !data?.data) {
    console.error('[fetchOfferData] Invalid response:', data);
    throw new Error(data?.error || "Oferta não encontrada");
  }

  return data.data;
}
