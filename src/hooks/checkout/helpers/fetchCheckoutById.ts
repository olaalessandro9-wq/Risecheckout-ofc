/**
 * Helper: fetchCheckoutById
 * 
 * Busca checkout completo por ID no Supabase
 */

import { supabase } from "@/integrations/supabase/client";

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

export async function fetchCheckoutById(checkoutId: string): Promise<CheckoutRawData> {
  const { data, error } = await supabase
    .from("checkouts")
    .select(`
      id,
      name,
      slug,
      visits_count,
      seller_name,
      product_id,
      font,
      background_color,
      text_color,
      primary_color,
      button_color,
      button_text_color,
      components,
      top_components,
      bottom_components,
      status,
      design,
      theme,
      pix_gateway,
      credit_card_gateway,
      mercadopago_public_key,
      stripe_public_key
    `)
    .eq("id", checkoutId)
    .maybeSingle();

  if (error || !data) {
    console.error('[fetchCheckoutById] Erro:', error);
    throw new Error("Checkout não encontrado");
  }

  // Validar status
  if (data.status === "deleted") {
    throw new Error("Checkout não disponível");
  }

  return data;
}
