/**
 * Hook: useProductPixels
 * Gerencia pixels vinculados a um produto específico
 * 
 * MIGRADO para Edge Function: pixel-management
 * Ações: list-product-links, link-to-product, unlink-from-product, update-product-link
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type { VendorPixel, ProductPixel, ProductPixelLinkData, PixelPlatform } from "@/components/pixels/types";

const log = createLogger("UseProductPixels");

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

      const { data, error } = await api.call<{
        success: boolean;
        error?: string;
        vendorPixels?: unknown[];
        linkedPixels?: unknown[];
      }>('pixel-management', {
        action: 'list-product-links',
        productId,
      });

      if (error) {
        log.error("Fetch error:", error);
        return;
      }

      if (!data?.success) {
        log.error("API error:", data?.error);
        return;
      }

      if (error) {
        log.error("Fetch error:", error);
        return;
      }

      if (!data.success) {
        log.error("API error:", data.error);
        return;
      }

      // Interface for raw pixel data from API
      interface RawVendorPixel {
        id: string;
        vendor_id: string;
        name: string;
        platform: string;
        pixel_id: string;
        access_token?: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }

      interface RawLinkedPixel extends RawVendorPixel {
        link?: ProductPixel;
      }

      // Map vendor pixels with proper typing
      const pixelsTyped: VendorPixel[] = ((data?.vendorPixels || []) as RawVendorPixel[]).map((p) => ({
        ...p,
        platform: p.platform as PixelPlatform,
      }));

      setVendorPixels(pixelsTyped);

      // Map linked pixels with link data
      const linked: LinkedPixel[] = ((data?.linkedPixels || []) as RawLinkedPixel[]).map((item) => ({
        ...item,
        platform: item.platform as PixelPlatform,
        link: item.link as ProductPixel,
      }));

      setLinkedPixels(linked);
    } catch (err) {
      log.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const linkPixel = useCallback(async (linkData: ProductPixelLinkData): Promise<boolean> => {
    try {
      setIsSaving(true);

      const { data: result, error } = await api.call<{ success: boolean; error?: string }>('pixel-management', {
        action: 'link-to-product',
        productId,
        pixelId: linkData.pixel_id,
        data: {
          fire_on_initiate_checkout: linkData.fire_on_initiate_checkout,
          fire_on_purchase: linkData.fire_on_purchase,
          fire_on_pix: linkData.fire_on_pix,
          fire_on_card: linkData.fire_on_card,
          fire_on_boleto: linkData.fire_on_boleto,
          custom_value_percent: linkData.custom_value_percent,
        },
      });

      if (error) {
        log.error("Link error:", error);
        return false;
      }

      if (!result.success) {
        log.error("API error:", result.error);
        return false;
      }

      await fetchData();
      return true;
    } catch (err) {
      log.error("Link error:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [productId, fetchData]);

  const unlinkPixel = useCallback(async (pixelId: string): Promise<boolean> => {
    try {
      setIsSaving(true);

      const { data: result, error } = await api.call<{ success: boolean; error?: string }>('pixel-management', {
        action: 'unlink-from-product',
        productId,
        pixelId,
      });

      if (error) {
        log.error("Unlink error:", error);
        return false;
      }

      if (!result.success) {
        log.error("API error:", result.error);
        return false;
      }

      await fetchData();
      return true;
    } catch (err) {
      log.error("Unlink error:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [productId, fetchData]);

  const updateLink = useCallback(async (pixelId: string, updateData: Partial<ProductPixelLinkData>): Promise<boolean> => {
    try {
      setIsSaving(true);

      const { data: result, error } = await api.call<{ success: boolean; error?: string }>('pixel-management', {
        action: 'update-product-link',
        productId,
        pixelId,
        data: {
          fire_on_initiate_checkout: updateData.fire_on_initiate_checkout,
          fire_on_purchase: updateData.fire_on_purchase,
          fire_on_pix: updateData.fire_on_pix,
          fire_on_card: updateData.fire_on_card,
          fire_on_boleto: updateData.fire_on_boleto,
          custom_value_percent: updateData.custom_value_percent,
        },
      });

      if (error) {
        log.error("Update link error:", error);
        return false;
      }

      if (!result.success) {
        log.error("API error:", result.error);
        return false;
      }

      await fetchData();
      return true;
    } catch (err) {
      log.error("Update link error:", err);
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
