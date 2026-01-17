/**
 * Helper: fetchProductData
 * 
 * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { api } from "@/lib/api";

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
    console.error('[fetchProductData] Edge function error:', error);
    throw new Error("Produto não encontrado");
  }

  if (!data?.success || !data?.data) {
    console.error('[fetchProductData] Invalid response:', data);
    throw new Error(data?.error || "Produto não encontrado");
  }

  return data.data;
}
