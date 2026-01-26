/**
 * Helper: fetchOfferData
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { publicApi } from "@/lib/api/public-client";
import { createLogger } from "@/lib/logger";

const log = createLogger("FetchOfferData");

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
  const { data, error } = await publicApi.call<OfferDataResponse>("checkout-public-data", {
    action: "offer",
    checkoutId,
  });

  if (error) {
    log.error('API error:', error);
    throw new Error("Oferta não encontrada");
  }

  if (!data?.success || !data?.data) {
    log.error('Invalid response:', data);
    throw new Error(data?.error || "Oferta não encontrada");
  }

  return data.data;
}
