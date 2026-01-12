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
    pix_gateway: string;
    credit_card_gateway: string;
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

  // 1. Buscar produto (incluindo gateways)
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, price, name, user_id, affiliate_settings, pix_gateway, credit_card_gateway")
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

  // FALLBACK: Se offer_id não foi fornecido mas checkout_id existe,
  // derivar offer_id do checkout via checkout_links → payment_links
  let derivedOfferId = offer_id;

  if (!derivedOfferId && validatedCheckoutId) {
    console.log("[product-validator] offer_id não fornecido, tentando derivar do checkout...");
    
    const { data: checkoutLink } = await supabase
      .from("checkout_links")
      .select(`
        payment_links!inner (
          offer_id
        )
      `)
      .eq("checkout_id", validatedCheckoutId)
      .maybeSingle();

    if (checkoutLink?.payment_links) {
      const paymentLinks = checkoutLink.payment_links as { offer_id: string };
      derivedOfferId = paymentLinks.offer_id;
      console.log("[product-validator] ✅ offer_id derivado do checkout:", derivedOfferId);
    }
  }

  if (derivedOfferId && derivedOfferId !== product_id) {
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("id, product_id, price, name, status")
      .eq("id", derivedOfferId) // ✅ Usa derivedOfferId
      .eq("product_id", product.id)
      .eq("status", "active")
      .maybeSingle();

    if (offerError || !offer) {
      console.error("[product-validator] Oferta inválida:", { derivedOfferId, product_id: product.id });
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

    console.log("[product-validator] ✅ Usando oferta:", {
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
      affiliate_settings: product.affiliate_settings || {},
      pix_gateway: product.pix_gateway || 'mercadopago',
      credit_card_gateway: product.credit_card_gateway || 'mercadopago',
    },
    validatedOfferId,
    validatedCheckoutId,
    finalPrice,
    offerName
  };
}
