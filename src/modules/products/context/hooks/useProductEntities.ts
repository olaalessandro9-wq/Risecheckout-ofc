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
import { createLogger } from "@/lib/logger";

const log = createLogger("useProductEntities");

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
  // Setters para injeção de dados do BFF
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>;
  setOrderBumps: React.Dispatch<React.SetStateAction<OrderBump[]>>;
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
}

// ============================================================================
// TIPOS IMPORTADOS DO SINGLE SOURCE OF TRUTH
// @see memory/architecture/product-module-ssot
// ============================================================================
import type { 
  OfferRecord, 
  OrderBumpRecord, 
  CouponRecord 
} from "./useProductLoader";

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
      
      // Mapeamento seguro: OfferRecord -> Offer
      const mappedOffers: Offer[] = (data?.offers || []).map((record) => ({
        id: record.id,
        product_id: record.product_id,
        name: record.name,
        price: record.price,
        is_default: record.is_default,
        created_at: record.created_at,
        updated_at: record.updated_at,
      }));
      
      setOffers(mappedOffers);
    } catch (error: unknown) {
      log.error("Error loading offers:", error);
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
      
      // Mapeamento seguro: OrderBumpRecord (SSOT) -> OrderBump (UI)
      // @see memory/domain/order-bumps-schema-mapping
      const mappedOrderBumps: OrderBump[] = (data?.orderBumps || []).map((record) => ({
        id: record.id,
        name: record.custom_title || record.products?.name || "Order Bump",
        description: record.custom_description || null,
        price: record.discount_price ?? record.products?.price ?? 0,
        image_url: record.show_image !== false ? record.products?.image_url ?? null : null,
        bump_product_id: record.product_id,
        created_at: record.created_at,
      }));
      
      setOrderBumps(mappedOrderBumps);
    } catch (error: unknown) {
      log.error("Error loading order bumps:", error);
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
      log.error("Error loading coupons:", error);
    }
  }, [productId]);

  return {
    offers,
    orderBumps,
    coupons,
    refreshOffers,
    refreshOrderBumps,
    refreshCoupons,
    // Setters para injeção de dados do BFF
    setOffers,
    setOrderBumps,
    setCoupons,
  };
}
