/**
 * Helper: fetchProductData
 * 
 * Busca dados do produto por ID no Supabase
 */

import { supabase } from "@/integrations/supabase/client";

export interface ProductRawData {
  id: string;
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

export async function fetchProductData(productId: string): Promise<ProductRawData> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      image_url,
      support_name,
      required_fields,
      default_payment_method,
      upsell_settings,
      affiliate_settings,
      status,
      pix_gateway,
      credit_card_gateway
    `)
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) {
    console.error('[fetchProductData] Erro:', error);
    throw new Error("Produto não encontrado");
  }

  // Validar status
  if (data.status === "deleted" || data.status === "blocked") {
    throw new Error("Produto não disponível");
  }

  return data;
}
