/**
 * Hook: useProductPixels
 * Gerencia pixels vinculados a um produto específico
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar todos os pixels do vendedor
      const { data: pixels, error: pixelsError } = await supabase
        .from("vendor_pixels")
        .select("*")
        .eq("vendor_id", user.id)
        .order("platform", { ascending: true })
        .order("name", { ascending: true });

      if (pixelsError) throw pixelsError;

      // Buscar vínculos do produto
      const { data: links, error: linksError } = await supabase
        .from("product_pixels")
        .select("*")
        .eq("product_id", productId);

      if (linksError) throw linksError;

      const pixelsTyped: VendorPixel[] = (pixels || []).map(p => ({
        ...p,
        platform: p.platform as PixelPlatform,
      }));

      setVendorPixels(pixelsTyped);

      // Criar lista de pixels vinculados com dados do link
      const linked: LinkedPixel[] = [];
      for (const link of links || []) {
        const pixel = pixelsTyped.find(p => p.id === link.pixel_id);
        if (pixel) {
          linked.push({
            ...pixel,
            link: link as ProductPixel,
          });
        }
      }

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

      const { error } = await supabase
        .from("product_pixels")
        .insert({
          product_id: productId,
          pixel_id: data.pixel_id,
          fire_on_initiate_checkout: data.fire_on_initiate_checkout,
          fire_on_purchase: data.fire_on_purchase,
          fire_on_pix: data.fire_on_pix,
          fire_on_card: data.fire_on_card,
          fire_on_boleto: data.fire_on_boleto,
          custom_value_percent: data.custom_value_percent,
        });

      if (error) throw error;

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

      const { error } = await supabase
        .from("product_pixels")
        .delete()
        .eq("product_id", productId)
        .eq("pixel_id", pixelId);

      if (error) throw error;

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

      const { error } = await supabase
        .from("product_pixels")
        .update(data)
        .eq("product_id", productId)
        .eq("pixel_id", pixelId);

      if (error) throw error;

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
