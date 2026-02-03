/**
 * Hook: useCheckoutProductPixels
 * 
 * @deprecated Para o checkout público, use os dados de productPixels
 * que vêm do BFF unificado (resolve-and-load action) via checkoutPublicMachine.
 * 
 * Este hook ainda pode ser útil em outros contextos que precisam
 * carregar pixels de produto de forma isolada (ex: preview no dashboard).
 * 
 * PHASE 2 ARCHITECTURE:
 * - Checkout público: usa machine.productPixels (BFF unificado)
 * - Dashboard/preview: pode usar este hook diretamente
 * 
 * @see src/modules/checkout-public/machines/checkoutPublicMachine.actors.ts
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useEffect } from "react";
import { publicApi } from "@/lib/api/public-client";
import { createLogger } from "@/lib/logger";

// Re-export CheckoutPixel type from SSOT
export type { CheckoutPixel } from "@/types/checkout-pixels.types";
import type { CheckoutPixel } from "@/types/checkout-pixels.types";

const log = createLogger("UseCheckoutProductPixels");

interface UseCheckoutProductPixelsReturn {
  pixels: CheckoutPixel[];
  isLoading: boolean;
  error: string | null;
}

interface PixelsResponse {
  success: boolean;
  data?: CheckoutPixel[];
  error?: string;
}

/**
 * Busca pixels vinculados a um produto para renderização no checkout público.
 * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
 */
export function useCheckoutProductPixels(productId: string | null): UseCheckoutProductPixelsReturn {
  const [pixels, setPixels] = useState<CheckoutPixel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setPixels([]);
      setIsLoading(false);
      return;
    }

    const fetchPixels = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch via Edge Function (public)
        const { data, error: fnError } = await publicApi.call<PixelsResponse>("checkout-public-data", {
          action: "product-pixels",
          productId,
        });

        if (fnError) {
          log.error("Edge function error:", fnError);
          throw fnError;
        }

        if (!data?.success) {
          log.error("API error:", data?.error);
          setPixels([]);
          return;
        }

        setPixels(data.data || []);
      } catch (err) {
        log.error("Error:", err);
        setError("Erro ao carregar pixels");
        setPixels([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPixels();
  }, [productId]);

  return { pixels, isLoading, error };
}
