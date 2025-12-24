/**
 * useProductEntities - Gerenciamento de Entidades do Produto
 * 
 * Responsável por:
 * - Ofertas (offers)
 * - Order Bumps (orderBumps)
 * - Cupons (coupons)
 * 
 * Nota: Apenas leitura/refresh neste contexto.
 * Operações CRUD são feitas por componentes específicos.
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error: any) {
      console.error("[useProductEntities] Error loading offers:", error);
    }
  }, [productId]);

  // ---------------------------------------------------------------------------
  // REFRESH ORDER BUMPS
  // ---------------------------------------------------------------------------

  const refreshOrderBumps = useCallback(async () => {
    if (!productId) return;

    try {
      // Buscar order_bumps via checkouts do produto
      const { data: checkoutsData, error: checkoutsError } = await supabase
        .from("checkouts")
        .select("id")
        .eq("product_id", productId);

      if (checkoutsError) throw checkoutsError;

      const checkoutIds = (checkoutsData || []).map((c) => c.id);

      if (checkoutIds.length === 0) {
        setOrderBumps([]);
        return;
      }

      const { data, error } = await supabase
        .from("order_bumps")
        .select("*")
        .in("checkout_id", checkoutIds);

      if (error) throw error;

      // Type assertion: order_bumps schema differs from OrderBump interface
      setOrderBumps((data || []) as any);
    } catch (error: any) {
      console.error("[useProductEntities] Error loading order bumps:", error);
    }
  }, [productId]);

  // ---------------------------------------------------------------------------
  // REFRESH COUPONS
  // ---------------------------------------------------------------------------

  const refreshCoupons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select(
          `
          *,
          coupon_products (
            product_id
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCoupons(
        (data || []).map((coupon) => ({
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
    } catch (error: any) {
      console.error("[useProductEntities] Error loading coupons:", error);
    }
  }, []);

  return {
    offers,
    orderBumps,
    coupons,
    refreshOffers,
    refreshOrderBumps,
    refreshCoupons,
  };
}
