/**
 * Helper: fetchCheckoutById
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("FetchCheckoutById");

/**
 * RISE V3: SSOT - Individual color columns are DEPRECATED.
 * All color data comes from the `design` JSON field.
 */
export interface CheckoutRawData {
  id: string;
  name: string;
  slug: string;
  visits_count: number;
  seller_name: string | null;
  product_id: string | null;
  font: string | null;
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
    log.error('Edge function error:', error);
    throw new Error("Checkout não encontrado");
  }

  if (!data?.success || !data?.data) {
    log.error('Invalid response:', data);
    throw new Error(data?.error || "Checkout não encontrado");
  }

  return data.data;
}
