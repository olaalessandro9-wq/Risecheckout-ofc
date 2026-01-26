/**
 * Helper: fetchOrderBumps
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Fetches order bumps for a checkout via Edge Function.
 * 
 * CRITICAL PRICE SEMANTICS:
 * - `price`: The REAL price to be charged (from offer or product)
 * - `original_price`: MARKETING price for strikethrough display only
 * - When displaying: show "~~original_price~~ price"
 * - original_price is NEVER used for billing calculations
 * 
 * @see Zero database access from frontend
 * @module checkout/helpers
 */

import { publicApi } from "@/lib/api/public-client";
import { createLogger } from "@/lib/logger";

const log = createLogger("FetchOrderBumps");

interface FetchOrderBumpsResponse {
  success?: boolean;
  data?: OrderBumpFormatted[];
}

/**
 * Raw order bump data from database
 */
export interface OrderBumpRaw {
  id: string;
  product_id: string;
  custom_title: string | null;
  custom_description: string | null;
  discount_enabled: boolean | null;
  /** MARKETING price - for strikethrough display only, never used for billing */
  original_price: number | null;
  show_image: boolean | null;
  call_to_action: string | null;
  products: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
  } | null;
  offers: {
    id: string;
    name: string;
    price: number;
  } | null;
}

/**
 * Formatted order bump for frontend consumption
 */
export interface OrderBumpFormatted {
  id: string;
  product_id: string;
  name: string;
  description: string;
  /** REAL price - what customer pays (from offer or product) */
  price: number;
  /** MARKETING price - for strikethrough display only */
  original_price: number | null;
  image_url: string | null;
  call_to_action: string | null;
  product: OrderBumpRaw['products'];
  offer: OrderBumpRaw['offers'];
}

export async function fetchOrderBumps(checkoutId: string): Promise<OrderBumpFormatted[]> {
  const { data, error } = await publicApi.call<FetchOrderBumpsResponse>("checkout-public-data", {
    action: "order-bumps",
    checkoutId,
  });

  if (error) {
    log.error("Edge function error:", error);
    return [];
  }

  if (!data?.success) {
    log.error("Invalid response:", data);
    return [];
  }

  return data.data || [];
}
