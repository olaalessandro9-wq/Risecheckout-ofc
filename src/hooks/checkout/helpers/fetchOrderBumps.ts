/**
 * Helper: fetchOrderBumps
 * 
 * Busca order bumps ativos para um checkout
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
  const { data, error } = await supabase
    .from("order_bumps")
    .select(`*, products(id, name, description, price, image_url), offers(id, name, price)`)
    .eq("checkout_id", checkoutId)
    .eq("active", true)
    .order("position");

  if (error) {
    console.error('[fetchOrderBumps] Erro:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Normalizar order bumps
  return data.map((bump: OrderBumpRaw) => {
    const product = bump.products;
    const offer = bump.offers;
    
    // Preços já vêm em CENTAVOS do banco
    const priceInCents = offer?.price ? Number(offer.price) : (product?.price || 0);
    let price = priceInCents;
    let originalPrice: number | null = null;
    
    if (bump.discount_enabled && bump.discount_price) {
      originalPrice = price;
      price = Number(bump.discount_price);
    }

    return {
      id: bump.id,
      product_id: bump.product_id,
      name: bump.custom_title || product?.name || "Oferta Especial",
      description: bump.custom_description || product?.description || "",
      price,
      original_price: originalPrice,
      image_url: bump.show_image ? product?.image_url : null,
      call_to_action: bump.call_to_action,
      product,
      offer,
    };
  });
}
