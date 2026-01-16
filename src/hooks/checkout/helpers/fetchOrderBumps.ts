/**
 * Helper: fetchOrderBumps
 * 
 * MIGRATED: Uses checkout-public-data Edge Function
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { supabase } from "@/integrations/supabase/client";

export interface OrderBumpRaw {
  id: string;
  product_id: string;
  custom_title: string | null;
  custom_description: string | null;
  discount_enabled: boolean | null;
  discount_price: number | null;
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

export interface OrderBumpFormatted {
  id: string;
  product_id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  call_to_action: string | null;
  product: OrderBumpRaw['products'];
  offer: OrderBumpRaw['offers'];
}

export async function fetchOrderBumps(checkoutId: string): Promise<OrderBumpFormatted[]> {
  const { data, error } = await supabase.functions.invoke("checkout-public-data", {
    body: {
      action: "order-bumps",
      checkoutId,
    },
  });

  if (error) {
    console.error('[fetchOrderBumps] Edge function error:', error);
    return [];
  }

  if (!data?.success) {
    console.error('[fetchOrderBumps] Invalid response:', data);
    return [];
  }

  return data.data || [];
}
