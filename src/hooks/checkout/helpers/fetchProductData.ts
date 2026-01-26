/**
 * Helper: fetchProductData
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("FetchProductData");

export interface ProductRawData {
  id: string;
  user_id: string; // ID do vendedor (vendor)
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  support_name: string | null;
  required_fields: unknown;
  default_payment_method: string | null;
  upsell_settings: unknown;
  affiliate_settings: unknown;
  status: string | null;
  pix_gateway: string | null;
  credit_card_gateway: string | null;
}

interface ProductResponse {
  success?: boolean;
  data?: ProductRawData;
  error?: string;
}

export async function fetchProductData(productId: string): Promise<ProductRawData> {
  const { data, error } = await api.publicCall<ProductResponse>("checkout-public-data", {
    action: "product",
    productId,
  });

  if (error) {
    log.error('Edge function error:', error);
    throw new Error("Produto não encontrado");
  }

  if (!data?.success || !data?.data) {
    log.error('Invalid response:', data);
    throw new Error(data?.error || "Produto não encontrado");
  }

  return data.data;
}
