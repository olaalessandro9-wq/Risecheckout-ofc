/**
 * Helper: fetchCheckoutById
 * 
 * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { api } from "@/lib/api";

export interface CheckoutRawData {
  id: string;
  name: string;
  slug: string;
  visits_count: number;
  seller_name: string | null;
  product_id: string | null;
  font: string | null;
  background_color: string | null;
  text_color: string | null;
  primary_color: string | null;
  button_color: string | null;
  button_text_color: string | null;
  components: unknown;
  top_components: unknown;
  bottom_components: unknown;
  status: string | null;
  design: unknown;
  theme: string | null;
  pix_gateway: string | null;
  credit_card_gateway: string | null;
  mercadopago_public_key: string | null;
  stripe_public_key: string | null;
}

interface CheckoutResponse {
  success?: boolean;
  data?: CheckoutRawData;
  error?: string;
}

export async function fetchCheckoutById(checkoutId: string): Promise<CheckoutRawData> {
  const { data, error } = await api.publicCall<CheckoutResponse>("checkout-public-data", {
    action: "checkout",
    checkoutId,
  });

  if (error) {
    console.error('[fetchCheckoutById] Edge function error:', error);
    throw new Error("Checkout não encontrado");
  }

  if (!data?.success || !data?.data) {
    console.error('[fetchCheckoutById] Invalid response:', data);
    throw new Error(data?.error || "Checkout não encontrado");
  }

  return data.data;
}
