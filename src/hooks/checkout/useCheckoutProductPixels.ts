/**
 * Hook: useCheckoutProductPixels
 * 
 * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { PixelPlatform } from "@/components/pixels/types";

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
        const { data, error: fnError } = await api.publicCall<PixelsResponse>("checkout-public-data", {
          action: "product-pixels",
          productId,
        });

        if (fnError) {
          console.error("[useCheckoutProductPixels] Edge function error:", fnError);
          throw fnError;
        }

        if (!data?.success) {
          console.error("[useCheckoutProductPixels] API error:", data?.error);
          setPixels([]);
          return;
        }

        setPixels(data.data || []);
      } catch (err) {
        console.error("[useCheckoutProductPixels] Error:", err);
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
