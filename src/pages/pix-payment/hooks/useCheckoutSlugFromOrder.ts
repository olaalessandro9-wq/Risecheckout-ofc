/**
 * useCheckoutSlugFromOrder - Hook para recuperar checkout slug via orderId
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Usado como fallback quando o navigation state não está disponível
 * (ex: refresh da página, deep link direto).
 */

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("useCheckoutSlugFromOrder");

interface CheckoutSlugResponse {
  success: boolean;
  slug?: string;
  error?: string;
}

export function useCheckoutSlugFromOrder(orderId: string | undefined) {
  const [checkoutSlug, setCheckoutSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    async function fetchSlug() {
      setLoading(true);
      try {
        log.debug("Fetching checkout slug for order", { orderId });
        
        const { data, error } = await api.publicCall<CheckoutSlugResponse>(
          "checkout-public-data",
          { action: "get-checkout-slug-by-order", orderId }
        );

        if (error) {
          log.error("Failed to fetch checkout slug", { error: error.message });
          return;
        }

        if (data?.success && data.slug) {
          log.info("Checkout slug retrieved", { slug: data.slug });
          setCheckoutSlug(data.slug);
        }
      } catch (err) {
        log.error("Error fetching checkout slug", { error: String(err) });
      } finally {
        setLoading(false);
      }
    }

    fetchSlug();
  }, [orderId]);

  return { checkoutSlug, loading };
}
