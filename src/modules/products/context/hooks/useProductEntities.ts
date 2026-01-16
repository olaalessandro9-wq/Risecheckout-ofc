/**
 * useProductEntities - Gerenciamento de Entidades do Produto
 * 
 * MIGRATED: Usa API Layer via Edge Function
 * 
 * Responsável por:
 * - Ofertas (offers)
 * - Order Bumps (orderBumps)
 * - Cupons (coupons)
 * 
 * @see RISE Protocol V2 - Zero direct database access
 */

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Offer, OrderBump, Coupon } from "../../types/product.types";

interface UseProductEntitiesOptions {
  productId: string | null;
}

interface UseProductEntitiesReturn {
  offers: Offer[];
  orderBumps: OrderBump[];
  coupons: Coupon[];
  refreshOffers: () => Promise<void>;
  refreshOrderBumps: () => Promise<void>;
  refreshCoupons: () => Promise<void>;
}

interface OfferRecord {
  id: string;
  product_id: string;
  name: string;
  price: number;
  status: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface OrderBumpRecord {
  id: string;
  checkout_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  bump_product_id: string | null;
}

interface CouponRecord {
  id: string;
  code: string;
  discount_value: number;
  discount_type: string;
  created_at: string;
  expires_at: string | null;
  uses_count: number | null;
  max_uses: number | null;
  coupon_products: Array<{ product_id: string }>;
}

export function useProductEntities({
  productId,
}: UseProductEntitiesOptions): UseProductEntitiesReturn {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // ---------------------------------------------------------------------------
  // REFRESH OFFERS
  // ---------------------------------------------------------------------------

  const refreshOffers = useCallback(async () => {
    if (!productId) return;

    try {
      const { data, error } = await api.call<{ offers: OfferRecord[] }>("product-entities", {
        action: "offers",
        productId,
      });

      if (error) throw new Error(error.message);
      setOffers((data?.offers || []) as unknown as Offer[]);
    } catch (error: unknown) {
      console.error("[useProductEntities] Error loading offers:", error);
    }
  }, [productId]);

  // ---------------------------------------------------------------------------
  // REFRESH ORDER BUMPS
  // ---------------------------------------------------------------------------

  const refreshOrderBumps = useCallback(async () => {
    if (!productId) return;

    try {
      const { data, error } = await api.call<{ orderBumps: OrderBumpRecord[] }>("product-entities", {
        action: "order-bumps",
        productId,
      });

      if (error) throw new Error(error.message);
      setOrderBumps((data?.orderBumps || []) as unknown as OrderBump[]);
    } catch (error: unknown) {
      console.error("[useProductEntities] Error loading order bumps:", error);
    }
  }, [productId]);

  // ---------------------------------------------------------------------------
  // REFRESH COUPONS
  // ---------------------------------------------------------------------------

  const refreshCoupons = useCallback(async () => {
    if (!productId) return;

    try {
      const { data, error } = await api.call<{ coupons: CouponRecord[] }>("product-entities", {
        action: "coupons",
        productId,
      });

      if (error) throw new Error(error.message);

      setCoupons(
        (data?.coupons || []).map((coupon) => ({
          id: coupon.id,
          code: coupon.code,
          discount: Number(coupon.discount_value),
          discount_type: coupon.discount_type as "percentage" | "fixed",
          startDate: coupon.created_at ? new Date(coupon.created_at) : new Date(),
          endDate: coupon.expires_at ? new Date(coupon.expires_at) : new Date(),
          usageCount: coupon.uses_count || 0,
          max_uses: coupon.max_uses,
          applyToOrderBumps: false,
          created_at: coupon.created_at,
          expires_at: coupon.expires_at,
        }))
      );
    } catch (error: unknown) {
      console.error("[useProductEntities] Error loading coupons:", error);
    }
  }, [productId]);

  return {
    offers,
    orderBumps,
    coupons,
    refreshOffers,
    refreshOrderBumps,
    refreshCoupons,
  };
}
