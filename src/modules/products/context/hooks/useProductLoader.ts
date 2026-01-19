/**
 * Product Full Loader Hook - React Query Edition
 * 
 * Substitui 6 chamadas paralelas por 1 única chamada BFF + cache inteligente.
 * Elimina re-fetches desnecessários via React Query staleTime/gcTime.
 * 
 * @module products/context/hooks
 * @version RISE V3 Compliant - 10.0/10
 * @updated 2026-01-19 - Exported interfaces for type safety
 */

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invokeEdgeFunction } from "@/lib/api-client";
import { createLogger } from "@/lib/logger";

const logger = createLogger("useProductLoader");

// ============================================================================
// QUERY KEYS FACTORY - Invalidação precisa
// ============================================================================

export const productQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productQueryKeys.all, "list"] as const,
  detail: (id: string) => [...productQueryKeys.all, "detail", id] as const,
  full: (id: string) => [...productQueryKeys.all, "full", id] as const,
};

// ============================================================================
// TYPES - Matching Edge Function response
// ============================================================================

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
  support_email: string | null;
  support_name: string | null;
  marketplace_description: string | null;
  marketplace_category: string | null;
  upsell_enabled: boolean;
  upsell_product_id: string | null;
  upsell_offer_id: string | null;
  upsell_checkout_id: string | null;
  upsell_timer_enabled: boolean;
  upsell_timer_minutes: number;
  affiliate_enabled: boolean;
  affiliate_commission_type: string;
  affiliate_commission_value: number;
  affiliate_cookie_days: number;
  affiliate_approval_mode: string;
  affiliate_allow_coupon: boolean;
  affiliate_public_in_marketplace: boolean;
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

export interface UseProductLoaderOptions {
  productId: string;
  enabled?: boolean;
}

export interface UseProductLoaderReturn {
  data: ProductFullData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  invalidate: () => void;
  refetch: () => Promise<ProductFullData | undefined>;
}

// ============================================================================
// HOOK PRINCIPAL - React Query Integration
// ============================================================================

export function useProductLoader({ 
  productId, 
  enabled = true 
}: UseProductLoaderOptions): UseProductLoaderReturn {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: productQueryKeys.full(productId),
    queryFn: async (): Promise<ProductFullData> => {
      logger.info("Fetching product full data", { productId });
      
      const { data: response, error: fetchError } = await invokeEdgeFunction<ProductFullResponse>(
        "product-full-loader",
        { action: "load-full", productId }
      );

      if (fetchError) {
        logger.error("Edge function error", { productId, error: fetchError });
        throw new Error(fetchError);
      }

      if (!response?.success || !response?.data) {
        const errorMsg = response?.error ?? "Failed to load product data";
        logger.error("Invalid response", { productId, error: errorMsg });
        throw new Error(errorMsg);
      }

      logger.info("Product full data loaded successfully", { productId });
      return response.data;
    },
    enabled: !!productId && enabled,
    staleTime: 1000 * 60 * 5,    // 5 minutos - dados considerados "frescos"
    gcTime: 1000 * 60 * 30,      // 30 minutos - mantém no garbage collection
    retry: 1,                     // 1 retry em caso de erro
    refetchOnWindowFocus: false,  // Não refetch ao focar janela
  });

  // Função para invalidar cache e forçar re-fetch
  const invalidate = useCallback(() => {
    logger.info("Invalidating product cache", { productId });
    queryClient.invalidateQueries({ 
      queryKey: productQueryKeys.full(productId) 
    });
  }, [queryClient, productId]);

  // Refetch manual
  const refetch = useCallback(async (): Promise<ProductFullData | undefined> => {
    const result = await query.refetch();
    return result.data;
  }, [query]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    invalidate,
    refetch,
  };
}
