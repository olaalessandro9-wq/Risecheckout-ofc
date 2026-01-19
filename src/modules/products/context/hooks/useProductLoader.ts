/**
 * Product Full Loader Hook
 * 
 * Substitui 6 chamadas paralelas por 1 única chamada BFF.
 * 
 * @module products/context/hooks
 * @version RISE V3 Compliant
 */

import { useCallback, useState } from "react";
import { invokeEdgeFunction } from "@/lib/api-client";
import { createLogger } from "@/lib/logger";

const logger = createLogger("useProductLoader");

// Types matching the Edge Function response
export interface UpsellSettings {
  upsell_enabled: boolean;
  upsell_product_id: string | null;
  upsell_offer_id: string | null;
  upsell_checkout_id: string | null;
  upsell_timer_enabled: boolean;
  upsell_timer_minutes: number;
  upsell_custom_page_url: string | null;
}

export interface AffiliateSettings {
  affiliate_enabled: boolean;
  affiliate_commission_type: string;
  affiliate_commission_value: number;
  affiliate_cookie_days: number;
  affiliate_approval_mode: string;
  affiliate_allow_coupon: boolean;
  affiliate_public_in_marketplace: boolean;
}

export interface OfferRecord {
  id: string;
  product_id: string;
  name: string;
  price: number;
  original_price: number | null;
  billing_type: string;
  billing_cycle: string | null;
  billing_cycles_count: number | null;
  is_default: boolean;
  active: boolean;
  grant_member_group_ids: string[] | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * OrderBumpRecord - Corresponde EXATAMENTE ao schema order_bumps do banco
 * 
 * Colunas reais: id, checkout_id, product_id, offer_id, position, active,
 * discount_enabled, discount_price, call_to_action, custom_title,
 * custom_description, show_image, created_at, updated_at
 */
export interface OrderBumpRecord {
  id: string;
  checkout_id: string;
  product_id: string;
  offer_id: string | null;
  position: number;
  active: boolean;
  discount_enabled: boolean | null;
  discount_price: number | null;
  call_to_action: string | null;
  custom_title: string | null;
  custom_description: string | null;
  show_image: boolean | null;
  created_at: string;
  updated_at: string | null;
  // Relação com produto (para exibir nome e imagem)
  products?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  } | null;
}

export interface CheckoutRecord {
  id: string;
  product_id: string;
  name: string;
  slug: string | null;
  is_default: boolean;
  status: string | null;
  theme: string | null;
  visits_count: number;
  created_at: string;
  updated_at: string | null;
  // Relações aninhadas (BFF com WithRelations)
  products?: {
    name: string;
    price: number;
  } | null;
  checkout_links?: Array<{
    link_id: string;
    payment_links?: {
      offers?: {
        name: string;
        price: number;
      } | null;
    } | null;
  }>;
}

export interface PaymentLinkRecord {
  id: string;
  slug: string;
  url?: string;
  status?: string;
  active?: boolean;
  created_at?: string;
  // Relações aninhadas (BFF com WithRelations)
  offers?: {
    id: string;
    name: string;
    price: number;
    is_default: boolean;
    product_id: string;
  } | null;
  checkouts?: Array<{
    id: string;
    name: string;
  }>;
}

export interface CouponRecord {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  uses_count: number | null;
  expires_at: string | null;
  start_date: string | null;
  active: boolean;
  apply_to_order_bumps: boolean | null;
  created_at: string;
}

export interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  status: string;
  vendor_id: string;
  // Support fields
  support_email: string | null;
  support_name: string | null;
  // Marketplace fields
  marketplace_description: string | null;
  marketplace_category: string | null;
  // Upsell settings
  upsell_enabled: boolean;
  upsell_product_id: string | null;
  upsell_offer_id: string | null;
  upsell_checkout_id: string | null;
  upsell_timer_enabled: boolean;
  upsell_timer_minutes: number;
  // Affiliate settings
  affiliate_enabled: boolean;
  affiliate_commission_type: string;
  affiliate_commission_value: number;
  affiliate_cookie_days: number;
  affiliate_approval_mode: string;
  affiliate_allow_coupon: boolean;
  affiliate_public_in_marketplace: boolean;
  // Members area
  members_area_enabled: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ProductFullData {
  product: ProductRecord;
  upsellSettings: UpsellSettings;
  affiliateSettings: AffiliateSettings;
  offers: OfferRecord[];
  orderBumps: OrderBumpRecord[];
  checkouts: CheckoutRecord[];
  paymentLinks: PaymentLinkRecord[];
  coupons: CouponRecord[];
}

interface ProductFullResponse {
  success: boolean;
  data?: ProductFullData;
  error?: string;
}

interface UseProductLoaderOptions {
  productId: string;
}

interface UseProductLoaderReturn {
  loadFull: () => Promise<ProductFullData>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para carregar todos os dados de um produto em 1 chamada HTTP
 */
export function useProductLoader({ productId }: UseProductLoaderOptions): UseProductLoaderReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFull = useCallback(async (): Promise<ProductFullData> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: fetchError } = await invokeEdgeFunction<ProductFullResponse>(
        "product-full-loader",
        { action: "load-full", productId }
      );

      if (fetchError) {
        throw new Error(fetchError);
      }

      if (!response?.success || !response?.data) {
        throw new Error(response?.error ?? "Failed to load product data");
      }

      logger.info("Product full data loaded successfully", { productId });
      return response.data;

    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("Failed to load product full data", { productId, error: message });
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  return {
    loadFull,
    isLoading,
    error,
  };
}
