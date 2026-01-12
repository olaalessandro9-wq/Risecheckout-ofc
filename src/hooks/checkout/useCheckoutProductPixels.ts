/**
 * Hook: useCheckoutProductPixels
 * Busca pixels vinculados a um produto para uso no checkout público
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

/**
 * Busca pixels vinculados a um produto para renderização no checkout público.
 * Usa políticas RLS anon para acesso sem autenticação.
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

        // Buscar vínculos de pixels do produto
        const { data: links, error: linksError } = await supabase
          .from("product_pixels")
          .select(`
            pixel_id,
            fire_on_initiate_checkout,
            fire_on_purchase,
            fire_on_pix,
            fire_on_card,
            fire_on_boleto,
            custom_value_percent
          `)
          .eq("product_id", productId);

        if (linksError) throw linksError;

        if (!links || links.length === 0) {
          setPixels([]);
          setIsLoading(false);
          return;
        }

        // Buscar dados dos pixels
        const pixelIds = links.map(l => l.pixel_id);
        const { data: pixelsData, error: pixelsError } = await supabase
          .from("vendor_pixels")
          .select("id, platform, pixel_id, access_token, conversion_label, domain, is_active")
          .in("id", pixelIds)
          .eq("is_active", true);

        if (pixelsError) throw pixelsError;

        // Combinar dados
        const combinedPixels: CheckoutPixel[] = [];
        for (const link of links) {
          const pixel = pixelsData?.find(p => p.id === link.pixel_id);
          if (pixel && pixel.is_active) {
            combinedPixels.push({
              id: pixel.id,
              platform: pixel.platform as PixelPlatform,
              pixel_id: pixel.pixel_id,
              access_token: pixel.access_token,
              conversion_label: pixel.conversion_label,
              domain: pixel.domain,
              is_active: pixel.is_active,
              fire_on_initiate_checkout: link.fire_on_initiate_checkout,
              fire_on_purchase: link.fire_on_purchase,
              fire_on_pix: link.fire_on_pix,
              fire_on_card: link.fire_on_card,
              fire_on_boleto: link.fire_on_boleto,
              custom_value_percent: link.custom_value_percent,
            });
          }
        }

        setPixels(combinedPixels);
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
