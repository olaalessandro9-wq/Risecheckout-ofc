/**
 * Hook: useCheckoutData (V3 - REFATORADO)
 * 
 * Orquestrador que usa helpers modulares para buscar dados do checkout.
 * 
 * REFATORAÇÃO (RISE ARCHITECT PROTOCOL):
 * - Lógica de fetch extraída para helpers individuais
 * - Este arquivo agora tem ~120 linhas (antes: 430)
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { parseJsonSafely } from "@/lib/utils";
import { normalizeDesign } from "@/lib/checkout/normalizeDesign";
import { createLogger } from "@/lib/logger";
import type { ThemePreset } from "@/lib/checkout/themePresets";

const log = createLogger("CheckoutData");

// Helpers modulares
import {
  resolveCheckoutSlug,
  fetchCheckoutById,
  fetchProductData,
  fetchOfferData,
  fetchOrderBumps,
  fetchAffiliateInfo,
  getAffiliateCode,
  type OrderBumpFormatted,
} from "./helpers";

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
  upsell_settings?: unknown;
  affiliate_settings?: {
    enabled?: boolean;
    commissionPercentage?: number;
    cookieDuration?: number;
    attributionModel?: 'last_click' | 'first_click';
  };
}

interface Checkout {
  id: string;
  vendorId: string; // ID do vendedor (user_id do produto)
  name: string;
  slug: string;
  visits_count: number;
  seller_name?: string;
  pix_gateway?: 'pushinpay' | 'mercadopago' | 'stripe' | 'asaas';
  credit_card_gateway?: 'mercadopago' | 'stripe' | 'asaas';
  mercadopago_public_key?: string | null;
  stripe_public_key?: string | null;
  product: CheckoutProduct;
  font?: string;
  components?: unknown[];
  top_components?: unknown[];
  bottom_components?: unknown[];
  rows?: unknown[];
  design?: unknown;
  theme?: string;
  affiliate_pix_gateway?: string | null;
  affiliate_credit_card_gateway?: string | null;
  offerId?: string; // ID da oferta específica do link de pagamento
}

interface UseCheckoutDataReturn {
  checkout: Checkout | null;
  design: ThemePreset | null;
  orderBumps: OrderBumpFormatted[];
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
  const [orderBumps, setOrderBumps] = useState<OrderBumpFormatted[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (slug) {
      loadCheckoutData(slug);
    }
  }, [slug]);

  const loadCheckoutData = async (slug: string) => {
    try {
      setIsLoading(true);
      setIsError(false);

      log.debug('Carregando checkout', { slug });

      // 1. Resolver slug → IDs
      const { checkoutId, productId } = await resolveCheckoutSlug(slug);

      // 2. Buscar dados em paralelo
      const [checkoutData, productData, offerData, bumps] = await Promise.all([
        fetchCheckoutById(checkoutId),
        fetchProductData(productId),
        fetchOfferData(checkoutId),
        fetchOrderBumps(checkoutId),
      ]);

      // 3. Buscar afiliado se houver ?ref= na URL
      const affiliateCode = getAffiliateCode();
      const affiliateInfo = affiliateCode 
        ? await fetchAffiliateInfo(affiliateCode, productId)
        : { pixGateway: null, creditCardGateway: null, mercadoPagoPublicKey: null, stripePublicKey: null };

      // 4. Normalizar required_fields
      const requiredFields = productData.required_fields as { phone?: boolean; cpf?: boolean } | null;
      const requirePhone = requiredFields?.phone ?? false;
      const requireCpf = requiredFields?.cpf ?? false;
      const defaultMethod = (productData.default_payment_method as 'pix' | 'credit_card') ?? 'pix';

      // 5. Determinar gateways finais (afiliado sobrescreve produto se configurado)
      const finalPixGateway = affiliateInfo.pixGateway || productData.pix_gateway || 'mercadopago';
      const finalCreditCardGateway = affiliateInfo.creditCardGateway || productData.credit_card_gateway || 'mercadopago';

      // 6. Montar objeto Checkout
      const fullCheckout: Checkout = {
        id: checkoutData.id,
        vendorId: productData.user_id, // ID do vendedor para tracking
        name: checkoutData.name,
        slug: checkoutData.slug,
        visits_count: checkoutData.visits_count,
        seller_name: checkoutData.seller_name ?? undefined,
        pix_gateway: finalPixGateway as Checkout['pix_gateway'],
        credit_card_gateway: finalCreditCardGateway as Checkout['credit_card_gateway'],
        mercadopago_public_key: affiliateInfo.mercadoPagoPublicKey || checkoutData.mercadopago_public_key,
        stripe_public_key: affiliateInfo.stripePublicKey || checkoutData.stripe_public_key,
        affiliate_pix_gateway: affiliateInfo.pixGateway,
        affiliate_credit_card_gateway: affiliateInfo.creditCardGateway,
        offerId: offerData.offerId, // ✅ ID da oferta específica do link
        product: {
          id: productData.id,
          name: productData.name,
          description: productData.description || '',
          price: offerData.offerPrice,
          image_url: productData.image_url,
          support_name: productData.support_name ?? undefined,
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
        font: checkoutData.font ?? undefined,
        components: parseJsonSafely(checkoutData.components, []),
        top_components: parseJsonSafely(checkoutData.top_components, []),
        bottom_components: parseJsonSafely(checkoutData.bottom_components, []),
        rows: parseJsonSafely(checkoutData.components, []),
        design: parseJsonSafely(checkoutData.design, {}),
        theme: checkoutData.theme ?? undefined,
      };

      setCheckout(fullCheckout);
      setDesign(normalizeDesign(fullCheckout as unknown as Parameters<typeof normalizeDesign>[0]));
      setOrderBumps(bumps);

      log.info('Checkout carregado com sucesso');

    } catch (error: unknown) {
      log.error('Erro ao carregar checkout', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return { checkout, design, orderBumps, isLoading, isError };
}
