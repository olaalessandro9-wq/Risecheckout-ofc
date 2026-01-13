/**
 * Hook: useProductPixels
 * Gerencia pixels vinculados a um produto específico
 * 
 * MIGRADO para Edge Function: pixel-management
 * Ações: list-product-links, link-to-product, unlink-from-product, update-product-link
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VendorPixel, ProductPixel, ProductPixelLinkData, PixelPlatform } from "@/components/pixels/types";

interface LinkedPixel extends VendorPixel {
  link: ProductPixel;
}

interface UseProductPixelsReturn {
  vendorPixels: VendorPixel[];
  linkedPixels: LinkedPixel[];
  isLoading: boolean;
  isSaving: boolean;
  linkPixel: (data: ProductPixelLinkData) => Promise<boolean>;
  unlinkPixel: (pixelId: string) => Promise<boolean>;
  updateLink: (pixelId: string, data: Partial<ProductPixelLinkData>) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useProductPixels(productId: string): UseProductPixelsReturn {
  const [vendorPixels, setVendorPixels] = useState<VendorPixel[]>([]);
  const [linkedPixels, setLinkedPixels] = useState<LinkedPixel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!productId) return;

    try {
      setIsLoading(true);

      const sessionToken = localStorage.getItem('producer_session_token');
      if (!sessionToken) {
        console.error("[useProductPixels] No session token");
        return;
      }

      const { data, error } = await supabase.functions.invoke('pixel-management', {
        body: {
          action: 'list-product-links',
          productId,
        },
        headers: {
          'x-producer-session-token': sessionToken,
        },
      });

      if (error) {
        console.error("[useProductPixels] Fetch error:", error);
        return;
      }

      if (!data.success) {
        console.error("[useProductPixels] API error:", data.error);
        return;
      }

      // Map vendor pixels with proper typing
      const pixelsTyped: VendorPixel[] = (data.vendorPixels || []).map((p: any) => ({
        ...p,
        platform: p.platform as PixelPlatform,
      }));

      setVendorPixels(pixelsTyped);

      // Map linked pixels with link data
      const linked: LinkedPixel[] = (data.linkedPixels || []).map((item: any) => ({
        ...item,
        platform: item.platform as PixelPlatform,
        link: item.link as ProductPixel,
      }));

      setLinkedPixels(linked);
    } catch (err) {
      console.error("[useProductPixels] Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const linkPixel = useCallback(async (data: ProductPixelLinkData): Promise<boolean> => {
    try {
      setIsSaving(true);

      const sessionToken = localStorage.getItem('producer_session_token');
      if (!sessionToken) {
        console.error("[useProductPixels] No session token");
        return false;
      }

      const { data: result, error } = await supabase.functions.invoke('pixel-management', {
        body: {
          action: 'link-to-product',
          productId,
          pixelId: data.pixel_id,
          data: {
            fire_on_initiate_checkout: data.fire_on_initiate_checkout,
            fire_on_purchase: data.fire_on_purchase,
            fire_on_pix: data.fire_on_pix,
            fire_on_card: data.fire_on_card,
            fire_on_boleto: data.fire_on_boleto,
            custom_value_percent: data.custom_value_percent,
          },
        },
        headers: {
          'x-producer-session-token': sessionToken,
        },
      });

      if (error) {
        console.error("[useProductPixels] Link error:", error);
        return false;
      }

      if (!result.success) {
        console.error("[useProductPixels] API error:", result.error);
        return false;
      }

      await fetchData();
      return true;
    } catch (err) {
      console.error("[useProductPixels] Link error:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [productId, fetchData]);

  const unlinkPixel = useCallback(async (pixelId: string): Promise<boolean> => {
    try {
      setIsSaving(true);

      const sessionToken = localStorage.getItem('producer_session_token');
      if (!sessionToken) {
        console.error("[useProductPixels] No session token");
        return false;
      }

      const { data: result, error } = await supabase.functions.invoke('pixel-management', {
        body: {
          action: 'unlink-from-product',
          productId,
          pixelId,
        },
        headers: {
          'x-producer-session-token': sessionToken,
        },
      });

      if (error) {
        console.error("[useProductPixels] Unlink error:", error);
        return false;
      }

      if (!result.success) {
        console.error("[useProductPixels] API error:", result.error);
        return false;
      }

      await fetchData();
      return true;
    } catch (err) {
      console.error("[useProductPixels] Unlink error:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [productId, fetchData]);

  const updateLink = useCallback(async (pixelId: string, data: Partial<ProductPixelLinkData>): Promise<boolean> => {
    try {
      setIsSaving(true);

      const sessionToken = localStorage.getItem('producer_session_token');
      if (!sessionToken) {
        console.error("[useProductPixels] No session token");
        return false;
      }

      const { data: result, error } = await supabase.functions.invoke('pixel-management', {
        body: {
          action: 'update-product-link',
          productId,
          pixelId,
          data: {
            fire_on_initiate_checkout: data.fire_on_initiate_checkout,
            fire_on_purchase: data.fire_on_purchase,
            fire_on_pix: data.fire_on_pix,
            fire_on_card: data.fire_on_card,
            fire_on_boleto: data.fire_on_boleto,
            custom_value_percent: data.custom_value_percent,
          },
        },
        headers: {
          'x-producer-session-token': sessionToken,
        },
      });

      if (error) {
        console.error("[useProductPixels] Update link error:", error);
        return false;
      }

      if (!result.success) {
        console.error("[useProductPixels] API error:", result.error);
        return false;
      }

      await fetchData();
      return true;
    } catch (err) {
      console.error("[useProductPixels] Update link error:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [productId, fetchData]);

  return {
    vendorPixels,
    linkedPixels,
    isLoading,
    isSaving,
    linkPixel,
    unlinkPixel,
    updateLink,
    refetch: fetchData,
  };
}
