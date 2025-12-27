/**
 * product-validator.ts - Validação de Produto, Oferta e Checkout
 * 
 * Responsabilidade ÚNICA: Validar ownership e buscar dados do produto
 */

export interface ProductValidationResult {
  product: {
    id: string;
    price: number;
    name: string;
    user_id: string;
    affiliate_settings: Record<string, any>;
  };
  validatedOfferId: string | null;
  validatedCheckoutId: string | null;
  finalPrice: number;
  offerName: string | null;
}

export interface ProductValidationInput {
  product_id: string;
  offer_id?: string;
  checkout_id?: string;
}

/**
 * Valida produto, oferta e checkout
 * Retorna dados validados ou lança erro
 */
export async function validateProduct(
  supabase: any,
  input: ProductValidationInput,
  corsHeaders: Record<string, string>
): Promise<ProductValidationResult | Response> {
  const { product_id, offer_id, checkout_id } = input;

  // 1. Buscar produto
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, price, name, user_id, affiliate_settings")
    .eq("id", product_id)
    .maybeSingle();

  if (productError || !product) {
    console.error("[product-validator] Produto não encontrado:", product_id);
    throw new Error("Produto principal não encontrado.");
  }

  // 2. Validar checkout_id (ownership graceful)
  let validatedCheckoutId: string | null = checkout_id || null;
  
  if (checkout_id) {
    const { data: checkout, error: checkoutError } = await supabase
      .from("checkouts")
      .select("id, product_id")
      .eq("id", checkout_id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (checkoutError || !checkout) {
      console.warn(`[product-validator] checkout_id inválido: ${checkout_id}`);
      validatedCheckoutId = null;
    } else {
      console.log(`[product-validator] checkout validado: ${checkout_id}`);
    }
  }

  // 3. Validar offer_id (ownership + status)
  let finalPrice = Number(product.price);
  let offerName: string | null = null;
  let validatedOfferId: string | null = null;

  if (offer_id && offer_id !== product_id) {
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("id, product_id, price, name, status")
      .eq("id", offer_id)
      .eq("product_id", product.id)
      .eq("status", "active")
      .maybeSingle();

    if (offerError || !offer) {
      console.error("[product-validator] Oferta inválida:", { offer_id, product_id: product.id });
      return new Response(
        JSON.stringify({
          error: "Invalid or inactive offer",
          details: "The selected offer is not available for this product"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("[product-validator] Usando oferta:", {
      offer_id: offer.id,
      name: offer.name,
      price: offer.price
    });

    finalPrice = Number(offer.price);
    offerName = offer.name;
    validatedOfferId = offer.id;
  }

  return {
    product: {
      id: product.id,
      price: product.price,
      name: product.name,
      user_id: product.user_id,
      affiliate_settings: product.affiliate_settings || {}
    },
    validatedOfferId,
    validatedCheckoutId,
    finalPrice,
    offerName
  };
}
