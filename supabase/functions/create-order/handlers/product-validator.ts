/**
 * product-validator.ts - Validação de Produto, Oferta e Checkout
 * 
 * @version 2.0.0 - RISE ARCHITECT PROTOCOL V3 - 10.0/10 - Zero `any`
 * 
 * Responsabilidade ÚNICA: Validar ownership e buscar dados do produto
 */
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("product-validator");

interface AffiliateSettings {
  enabled?: boolean;
  commission_percent?: number;
  [key: string]: unknown;
}

export interface ProductValidationResult {
  product: {
    id: string;
    price: number;
    name: string;
    user_id: string;
    affiliate_settings: AffiliateSettings;
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

interface ProductRecord {
  id: string;
  price: number;
  name: string;
  user_id: string;
  affiliate_settings: AffiliateSettings | null;
  pix_gateway: string | null;
  credit_card_gateway: string | null;
}

interface CheckoutRecord {
  id: string;
  product_id: string;
}

interface CheckoutLinkRecord {
  payment_links: { offer_id: string } | { offer_id: string }[] | null;
}

interface OfferRecord {
  id: string;
  product_id: string;
  price: number;
  name: string;
  status: string;
}

/**
 * Valida produto, oferta e checkout
 * Retorna dados validados ou lança erro
 */
export async function validateProduct(
  supabase: SupabaseClient,
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
    log.error("Produto não encontrado:", product_id);
    throw new Error("Produto principal não encontrado.");
  }

  const productData = product as ProductRecord;

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
      log.warn(`checkout_id inválido: ${checkout_id}`);
      validatedCheckoutId = null;
    } else {
      log.info(`checkout validado: ${checkout_id}`);
    }
  }

  // 3. Validar offer_id (ownership + status)
  let finalPrice = Number(productData.price);
  let offerName: string | null = null;
  let validatedOfferId: string | null = null;

  // FALLBACK: Se offer_id não foi fornecido mas checkout_id existe,
  // derivar offer_id do checkout via checkout_links → payment_links
  let derivedOfferId = offer_id;

  if (!derivedOfferId && validatedCheckoutId) {
    log.info("offer_id não fornecido, tentando derivar do checkout...");
    
    const { data: checkoutLink } = await supabase
      .from("checkout_links")
      .select(`
        payment_links!inner (
          offer_id
        )
      `)
      .eq("checkout_id", validatedCheckoutId)
      .maybeSingle();

    if (checkoutLink) {
      const linkData = checkoutLink as CheckoutLinkRecord;
      const paymentLinks = Array.isArray(linkData.payment_links) 
        ? linkData.payment_links[0] 
        : linkData.payment_links;
      if (paymentLinks) {
        derivedOfferId = paymentLinks.offer_id;
        log.info("✅ offer_id derivado do checkout:", derivedOfferId);
      }
    }
  }

  if (derivedOfferId && derivedOfferId !== product_id) {
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("id, product_id, price, name, status")
      .eq("id", derivedOfferId)
      .eq("product_id", productData.id)
      .eq("status", "active")
      .maybeSingle();

    if (offerError || !offer) {
      log.error("Oferta inválida:", { derivedOfferId, product_id: productData.id });
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

    const offerData = offer as OfferRecord;

    log.info("✅ Usando oferta:", {
      offer_id: offerData.id,
      name: offerData.name,
      price: offerData.price
    });

    finalPrice = Number(offerData.price);
    offerName = offerData.name;
    validatedOfferId = offerData.id;
  }

  return {
    product: {
      id: productData.id,
      price: productData.price,
      name: productData.name,
      user_id: productData.user_id,
      affiliate_settings: productData.affiliate_settings || {},
      pix_gateway: productData.pix_gateway || 'mercadopago',
      credit_card_gateway: productData.credit_card_gateway || 'mercadopago',
    },
    validatedOfferId,
    validatedCheckoutId,
    finalPrice,
    offerName
  };
}
