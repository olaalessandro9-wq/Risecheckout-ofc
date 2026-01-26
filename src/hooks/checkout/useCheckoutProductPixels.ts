/**
 * Hook: useCheckoutProductPixels
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useEffect } from "react";
import { publicApi } from "@/lib/api/public-client";
import { createLogger } from "@/lib/logger";
import type { PixelPlatform } from "@/modules/pixels";

const log = createLogger("UseCheckoutProductPixels");

export interface CheckoutPixel {
  id: string;
  platform: PixelPlatform;
  pixel_id: string;
  access_token?: string | null;
  conversion_label?: string | null;
  domain?: string | null;
  is_active: boolean;
  // Configurações de disparo
  fire_on_initiate_checkout: boolean;
  fire_on_purchase: boolean;
  fire_on_pix: boolean;
  fire_on_card: boolean;
  fire_on_boleto: boolean;
  custom_value_percent: number;
}

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
