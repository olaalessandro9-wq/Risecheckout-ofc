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

/**
 * OfferRecord - Estrutura do banco de dados
 * Importado de useProductLoader para Single Source of Truth
 */
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

/**
 * OrderBumpRecord - Estrutura do banco de dados
 * Campos reais: custom_title, custom_description, discount_price
 * @see memory/domain/order-bumps-schema-mapping
 */
interface OrderBumpRecord {
  id: string;
  checkout_id: string;
  custom_title: string | null;
  custom_description: string | null;
  discount_price: number | null;
  show_image: boolean;
  product_id: string | null;
  products?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  } | null;
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
      
      // Mapeamento seguro: OrderBumpRecord -> OrderBump
      // @see memory/domain/order-bumps-schema-mapping
      const mappedOrderBumps: OrderBump[] = (data?.orderBumps || []).map((record) => ({
        id: record.id,
        name: record.custom_title || record.products?.name || "Order Bump",
        description: record.custom_description || null,
        price: record.discount_price ?? record.products?.price ?? 0,
        image_url: record.show_image ? record.products?.image_url ?? null : null,
        bump_product_id: record.product_id,
        created_at: undefined,
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
