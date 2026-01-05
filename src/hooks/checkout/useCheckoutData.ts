/**
 * Hook: useCheckoutData (V2 - CORRIGIDO)
 * 
 * Responsabilidade Única: Buscar e normalizar dados do checkout público.
 * 
 * CORREÇÕES APLICADAS:
 * - ✅ Usar RPC get_checkout_by_payment_slug (evita RLS)
 * - ✅ Remover .eq("active", true) - coluna não existe!
 * - ✅ Validar por status !== "deleted"
 * - ✅ Buscar vendor_id de products.user_id
 * - ✅ Usar parseJsonSafely() e normalizeDesign()
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { parseJsonSafely } from "@/lib/utils";
import { normalizeDesign } from "@/lib/checkout/normalizeDesign";
import type { ThemePreset } from "@/lib/checkout/themePresets";

// ============================================================================
// INTERFACES
// ============================================================================

interface CheckoutProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  support_name?: string;
  required_fields?: {
    name: boolean;
    email: boolean;
    phone: boolean;
    cpf: boolean;
  };
  default_payment_method?: 'pix' | 'credit_card';
  upsell_settings?: any;
  affiliate_settings?: {
    enabled?: boolean;
    commissionPercentage?: number;
    cookieDuration?: number;
    attributionModel?: 'last_click' | 'first_click' | 'linear';
  };
}

interface Checkout {
  id: string;
  name: string;
  slug: string;
  visits_count: number;
  seller_name?: string;
  pix_gateway?: 'pushinpay' | 'mercadopago' | 'stripe' | 'asaas';
  credit_card_gateway?: 'mercadopago' | 'stripe' | 'asaas';
  // Payment keys desnormalizados (evita RLS de vendor_integrations)
  mercadopago_public_key?: string | null;
  stripe_public_key?: string | null;
  product: CheckoutProduct;
  font?: string;
  components?: any[];
  top_components?: any[];
  bottom_components?: any[];
  rows?: any[];
  design?: any;
  theme?: string;
  // Gateway do afiliado (se aplicável)
  affiliate_pix_gateway?: string | null;
  affiliate_credit_card_gateway?: string | null;
}

interface OrderBump {
  id: string;
  product_id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  call_to_action?: string;
  product?: any;
  offer?: any;
}

interface UseCheckoutDataReturn {
  checkout: Checkout | null;
  design: ThemePreset | null;
  orderBumps: OrderBump[];
  isLoading: boolean;
  isError: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useCheckoutData(): UseCheckoutDataReturn {
  const { slug } = useParams<{ slug: string }>();
  
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [design, setDesign] = useState<ThemePreset | null>(null);
  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Obter código de afiliado da URL
  const getAffiliateCode = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref') || null;
  };

  useEffect(() => {
    if (slug) {
      loadCheckoutData();
    }
  }, [slug]);

  const loadCheckoutData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      console.log('[useCheckoutData V2] Carregando checkout:', slug);

      // ============================================================================
      // ESTRATÉGIA 1: Usar RPC para mapear slug → checkout_id (evita RLS)
      // ============================================================================
      
      const { data: mapData, error: mapError } = await supabase.rpc('get_checkout_by_payment_slug', { 
        p_slug: slug 
      });

      console.log('[useCheckoutData V2] RPC result:', { mapData, mapError });

      if (mapError || !mapData || mapData.length === 0 || !mapData[0]?.checkout_id) {
        throw new Error("Checkout não encontrado via RPC");
      }

      const checkoutId = mapData[0].checkout_id;
      const productId = mapData[0].product_id;

      console.log('[useCheckoutData V2] checkout_id:', checkoutId, 'product_id:', productId);

      // ============================================================================
      // BUSCAR CHECKOUT COMPLETO POR ID
      // ============================================================================
      
      const { data: checkoutData, error: checkoutError } = await supabase
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

      if (checkoutError || !checkoutData) {
        console.error('[useCheckoutData V2] Erro ao buscar checkout:', checkoutError);
        throw new Error("Checkout não encontrado");
      }

      // ✅ VALIDAR STATUS (não usar .eq("active", true)!)
      if (checkoutData.status === "deleted") {
        throw new Error("Checkout não disponível");
      }

      // ============================================================================
      // BUSCAR OFERTA ASSOCIADA AO CHECKOUT (via payment_links)
      // ============================================================================
      
      const { data: checkoutLink, error: linkError } = await supabase
        .from("checkout_links")
        .select(`
          link_id,
          payment_links!inner (
            offer_id,
            offers!inner (
              id,
              name,
              price
            )
          )
        `)
        .eq("checkout_id", checkoutId)
        .maybeSingle();

      if (linkError || !checkoutLink) {
        console.error('[useCheckoutData V2] Erro ao buscar link/oferta:', linkError);
        throw new Error("Oferta não encontrada");
      }

      const offerId = checkoutLink.payment_links.offer_id;
      const offerPrice = checkoutLink.payment_links.offers.price; // ✅ Preço já vem correto do banco

      console.log('[useCheckoutData V2] offer_id:', offerId, 'offer_price:', offerPrice);

      // ============================================================================
      // BUSCAR PRODUTO POR ID
      // ============================================================================
      
      // ✅ SEGURANÇA: Não buscar user_id - cliente não precisa ver o ID do produtor
      // ✅ CORREÇÃO: Buscar pix_gateway e credit_card_gateway do PRODUTO (não do checkout)
      const { data: productData, error: productError } = await supabase
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

      if (productError || !productData) {
        console.error('[useCheckoutData V2] Erro ao buscar produto:', productError);
        throw new Error("Produto não encontrado");
      }

      // Validar status do produto
      if (productData.status === "deleted" || productData.status === "blocked") {
        throw new Error("Produto não disponível");
      }

      // ✅ SEGURANÇA: vendor_id NÃO é mais exposto ao cliente
      // O backend resolve o vendor_id internamente via checkout_id/product_id

      // ============================================================================
      // BUSCAR GATEWAYS DO AFILIADO (se tiver ?ref= na URL)
      // ============================================================================
      
      let affiliatePixGateway: string | null = null;
      let affiliateCreditCardGateway: string | null = null;
      let affiliateMercadoPagoPublicKey: string | null = null;
      let affiliateStripePublicKey: string | null = null;
      
      const affiliateCode = getAffiliateCode();
      if (affiliateCode) {
        console.log('[useCheckoutData V2] Código de afiliado detectado:', affiliateCode);
        
        // Usar RPC SECURITY DEFINER para buscar info do afiliado (contorna RLS)
        const { data: affiliateInfo, error: affiliateError } = await supabase
          .rpc('get_affiliate_checkout_info', {
            p_affiliate_code: affiliateCode,
            p_product_id: productId
          });
        
        if (affiliateError) {
          console.warn('[useCheckoutData V2] Erro ao buscar info do afiliado:', affiliateError.message);
        } else if (affiliateInfo && affiliateInfo.length > 0) {
          const info = affiliateInfo[0];
          affiliatePixGateway = info.pix_gateway;
          affiliateCreditCardGateway = info.credit_card_gateway;
          affiliateMercadoPagoPublicKey = info.mercadopago_public_key;
          affiliateStripePublicKey = info.stripe_public_key;
          
          console.log('[useCheckoutData V2] ✅ Info do afiliado via RPC:', { 
            pix: affiliatePixGateway, 
            card: affiliateCreditCardGateway,
            hasMpKey: !!affiliateMercadoPagoPublicKey,
            hasStripeKey: !!affiliateStripePublicKey
          });
        }
      }

      // ============================================================================
      // NORMALIZAR DADOS
      // ============================================================================
      
      // Extrair required_fields
      const requiredFields = productData.required_fields as { phone?: boolean; cpf?: boolean } | null;
      const requirePhone = requiredFields?.phone ?? false;
      const requireCpf = requiredFields?.cpf ?? false;
      const defaultMethod = (productData.default_payment_method as 'pix' | 'credit_card') ?? 'pix';

      // Determinar gateways finais (afiliado sobrescreve PRODUTO se configurado)
      // ✅ CORREÇÃO: Gateway vem do PRODUTO, não do checkout
      const finalPixGateway = affiliatePixGateway || productData.pix_gateway || 'mercadopago';
      const finalCreditCardGateway = affiliateCreditCardGateway || productData.credit_card_gateway || 'mercadopago';

      // Montar objeto completo do checkout
      const fullCheckout: Checkout = {
        id: checkoutData.id,
        name: checkoutData.name,
        slug: checkoutData.slug,
        visits_count: checkoutData.visits_count,
        seller_name: checkoutData.seller_name,
        pix_gateway: finalPixGateway as Checkout['pix_gateway'],
        credit_card_gateway: finalCreditCardGateway as Checkout['credit_card_gateway'],
        // Payment keys: usar do afiliado se disponível, senão fallback para produtor
        mercadopago_public_key: affiliateMercadoPagoPublicKey || checkoutData.mercadopago_public_key,
        stripe_public_key: affiliateStripePublicKey || checkoutData.stripe_public_key,
        // Gateways originais do afiliado (para referência)
        affiliate_pix_gateway: affiliatePixGateway,
        affiliate_credit_card_gateway: affiliateCreditCardGateway,
        product: {
          id: productData.id,
          name: productData.name,
          description: productData.description,
          price: offerPrice, // ✅ CORRIGIDO: Usar offers.price (já vem correto do banco)
          image_url: productData.image_url,
          support_name: productData.support_name,
          required_fields: { 
            name: true, 
            email: true, 
            phone: requirePhone, 
            cpf: requireCpf 
          },
          default_payment_method: defaultMethod,
          upsell_settings: productData.upsell_settings,
          affiliate_settings: productData.affiliate_settings as CheckoutProduct['affiliate_settings'],
        },
        font: checkoutData.font,
        // ✅ Usar parseJsonSafely para campos JSONB
        components: parseJsonSafely(checkoutData.components, []),
        top_components: parseJsonSafely(checkoutData.top_components, []),
        bottom_components: parseJsonSafely(checkoutData.bottom_components, []),
        rows: parseJsonSafely(checkoutData.components, []),
        design: parseJsonSafely(checkoutData.design, {}),
        theme: checkoutData.theme,
      };

      setCheckout(fullCheckout);
      
      // ✅ Normalizar design
      setDesign(normalizeDesign(fullCheckout));

      // ============================================================================
      // CARREGAR ORDER BUMPS
      // ============================================================================
      
      await loadOrderBumps(checkoutData.id);

      console.log('[useCheckoutData V2] ✅ Checkout carregado com sucesso');

    } catch (error) {
      console.error('[useCheckoutData V2] Erro ao carregar checkout:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrderBumps = async (checkoutId: string) => {
    try {
      const { data, error } = await supabase
        .from("order_bumps")
        .select(`*, products(id, name, description, price, image_url), offers(id, name, price)`)
        .eq("checkout_id", checkoutId)
        .eq("active", true)
        .order("position");

      if (error) {
        console.error('[useCheckoutData V2] Erro ao carregar order bumps:', error);
        return;
      }

      if (data) {
        // ✅ Normalizar order bumps (name e price vêm de products/offers)
        const formatted: OrderBump[] = data.map((bump: any) => {
          const product = bump.products;
          const offer = bump.offers;
          // ✅ Preços já vêm em CENTAVOS do banco
          const priceInCents = offer?.price ? Number(offer.price) : (product?.price || 0);
          let price = priceInCents; // Já está em centavos
          let originalPrice = null;
          
          if (bump.discount_enabled && bump.discount_price) {
            originalPrice = price;
            price = Number(bump.discount_price); // Já está em centavos
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

        setOrderBumps(formatted);
        console.log('[useCheckoutData V2] ✅ Order bumps carregados:', formatted.length);
      }
    } catch (error) {
      console.error('[useCheckoutData V2] Erro ao carregar order bumps:', error);
    }
  };

  return {
    checkout,
    design,
    orderBumps,
    isLoading,
    isError,
  };
}
