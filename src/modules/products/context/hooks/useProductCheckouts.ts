/**
 * useProductCheckouts - Gerenciamento de Checkouts e Links
 * 
 * MIGRATED: Usa API Layer via Edge Function
 * 
 * Responsável por:
 * - Checkouts (checkouts)
 * - Links de Pagamento (paymentLinks)
 * 
 * @see RISE Protocol V2 - Zero direct database access
 */

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type { Checkout, PaymentLink } from "../../types/product.types";

const log = createLogger("useProductCheckouts");

interface UseProductCheckoutsOptions {
  productId: string | null;
}

interface UseProductCheckoutsReturn {
  checkouts: Checkout[];
  paymentLinks: PaymentLink[];
  refreshCheckouts: () => Promise<void>;
  refreshPaymentLinks: () => Promise<void>;
  // Setters para injeção de dados do BFF
  setCheckouts: React.Dispatch<React.SetStateAction<Checkout[]>>;
  setPaymentLinks: React.Dispatch<React.SetStateAction<PaymentLink[]>>;
}

interface CheckoutRecord {
  id: string;
  name: string;
  product_id: string;
  status: string;
  created_at: string;
  visits_count?: number;
  is_default?: boolean;
  products?: {
    name: string;
    price: number;
  };
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

interface PaymentLinkRecord {
  id: string;
  slug: string;
  url: string;
  status: string;
  offers?: {
    id: string;
    name: string;
    price: number;
    is_default: boolean;
    product_id: string;
  } | null;
  checkouts?: Array<{ id: string; name: string }>;
}

export function useProductCheckouts({
  productId,
}: UseProductCheckoutsOptions): UseProductCheckoutsReturn {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);

  // ---------------------------------------------------------------------------
  // REFRESH CHECKOUTS
  // ---------------------------------------------------------------------------

  const refreshCheckouts = useCallback(async () => {
    if (!productId) return;

    try {
      const { data, error } = await api.call<{ checkouts: CheckoutRecord[] }>("product-entities", {
        action: "checkouts",
        productId,
      });

      if (error) throw new Error(error.message);

      setCheckouts(
        (data?.checkouts || []).map((checkout) => {
          const checkoutLink = checkout.checkout_links?.[0];
          const paymentLink = checkoutLink?.payment_links;
          const offer = paymentLink?.offers;

          return {
            id: checkout.id,
            name: checkout.name,
            price: offer?.price || checkout.products?.price || 0,
            visits: checkout.visits_count || 0,
            offer: offer?.name || checkout.products?.name || "",
            isDefault: checkout.is_default || false,
            linkId: checkoutLink?.link_id || "",
            product_id: checkout.product_id,
            status: checkout.status,
            created_at: checkout.created_at,
          };
        })
      );
    } catch (error: unknown) {
      log.error("Error loading checkouts:", error);
    }
  }, [productId]);

  // ---------------------------------------------------------------------------
  // REFRESH PAYMENT LINKS
  // ---------------------------------------------------------------------------

  const refreshPaymentLinks = useCallback(async () => {
    if (!productId) return;

    try {
      const { data, error } = await api.call<{ paymentLinks: PaymentLinkRecord[] }>("product-entities", {
        action: "payment-links",
        productId,
      });

      if (error) throw new Error(error.message);

      setPaymentLinks(
        (data?.paymentLinks || []).map((link) => {
          const statusValue = link.status === "inactive" ? "inactive" : "active";

          return {
            id: link.id,
            slug: link.slug,
            url: link.url,
            offer_name: link.offers?.name || "",
            offer_price: Number(link.offers?.price || 0),
            is_default: link.offers?.is_default || false,
            status: statusValue as "active" | "inactive",
            checkouts: link.checkouts || [],
          };
        })
      );
    } catch (error: unknown) {
      log.error("Error loading payment links:", error);
    }
  }, [productId]);

  return {
    checkouts,
    paymentLinks,
    refreshCheckouts,
    refreshPaymentLinks,
    // Setters para injeção de dados do BFF
    setCheckouts,
    setPaymentLinks,
  };
}
