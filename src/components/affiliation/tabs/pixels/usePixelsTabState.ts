/**
 * usePixelsTabState - State management hook for PixelsTab
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 * @module affiliation/tabs/pixels/usePixelsTabState
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("UsePixelsTabState");
import type { AffiliatePixel } from "@/hooks/useAffiliationDetails";
import { 
  type Platform, 
  type PixelForm, 
  PLATFORMS, 
  DEFAULT_PIXEL_FORM, 
  MAX_PIXELS_PER_PLATFORM 
} from "./types";

interface UsePixelsTabStateProps {
  affiliationId: string;
  initialPixels: AffiliatePixel[];
  onRefetch: () => Promise<void>;
}

function initializePixelsByPlatform(initialPixels: AffiliatePixel[]): Record<Platform, PixelForm[]> {
  const initial: Record<Platform, PixelForm[]> = {
    facebook: [],
    google_ads: [],
    tiktok: [],
    kwai: [],
  };

  initialPixels.forEach((pixel) => {
    initial[pixel.platform].push({
      id: pixel.id,
      pixel_id: pixel.pixel_id,
      domain: pixel.domain || "",
      fire_on_pix: pixel.fire_on_pix,
      fire_on_boleto: pixel.fire_on_boleto,
      fire_on_card: pixel.fire_on_card,
      custom_value_pix: pixel.custom_value_pix,
      custom_value_boleto: pixel.custom_value_boleto,
      custom_value_card: pixel.custom_value_card,
      enabled: pixel.enabled,
    });
  });

  return initial;
}

export function usePixelsTabState({ 
  affiliationId, 
  initialPixels, 
  onRefetch 
}: UsePixelsTabStateProps) {
  const [activePlatform, setActivePlatform] = useState<Platform>("facebook");
  const [pixelsByPlatform, setPixelsByPlatform] = useState<Record<Platform, PixelForm[]>>(
    () => initializePixelsByPlatform(initialPixels)
  );
  const [isSaving, setIsSaving] = useState(false);

  const currentPixels = pixelsByPlatform[activePlatform];

  const addPixel = useCallback(() => {
    if (currentPixels.length >= MAX_PIXELS_PER_PLATFORM) {
      toast.error(`Limite máximo de ${MAX_PIXELS_PER_PLATFORM} pixels por plataforma`);
      return;
    }

    setPixelsByPlatform(prev => ({
      ...prev,
      [activePlatform]: [...prev[activePlatform], { ...DEFAULT_PIXEL_FORM }],
    }));
  }, [activePlatform, currentPixels.length]);

  const updatePixel = useCallback((
    index: number, 
    field: keyof PixelForm, 
    value: string | Platform | boolean | number
  ) => {
    setPixelsByPlatform(prev => ({
      ...prev,
      [activePlatform]: prev[activePlatform].map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  }, [activePlatform]);

  const removePixel = useCallback((index: number) => {
    setPixelsByPlatform(prev => ({
      ...prev,
      [activePlatform]: prev[activePlatform].filter((_, i) => i !== index),
    }));
  }, [activePlatform]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      // Build array of all pixels
      const allPixels: Array<{
        pixel_id: string;
        platform: string;
        domain: string | null;
        fire_on_pix: boolean;
        fire_on_boleto: boolean;
        fire_on_card: boolean;
        custom_value_pix: number;
        custom_value_boleto: number;
        custom_value_card: number;
        enabled: boolean;
      }> = [];

      for (const platform of PLATFORMS) {
        const pixels = pixelsByPlatform[platform.id];
        for (const pixel of pixels) {
          if (pixel.pixel_id.trim()) {
            allPixels.push({
              pixel_id: pixel.pixel_id.trim(),
              platform: platform.id,
              domain: pixel.domain.trim() || null,
              fire_on_pix: pixel.fire_on_pix,
              fire_on_boleto: pixel.fire_on_boleto,
              fire_on_card: pixel.fire_on_card,
              custom_value_pix: pixel.custom_value_pix,
              custom_value_boleto: pixel.custom_value_boleto,
              custom_value_card: pixel.custom_value_card,
              enabled: pixel.enabled,
            });
          }
        }
      }

      // Call Edge Function
      const { data, error } = await api.call<{ error?: string }>("affiliate-pixel-management", {
        action: "save-all",
        affiliate_id: affiliationId,
        pixels: allPixels,
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success("Pixels salvos com sucesso!");
      await onRefetch();
    } catch (err: unknown) {
      log.error("Erro ao salvar pixels:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao salvar pixels");
    } finally {
      setIsSaving(false);
    }
  }, [affiliationId, pixelsByPlatform, onRefetch]);

  return {
    activePlatform,
    setActivePlatform,
    pixelsByPlatform,
    currentPixels,
    isSaving,
    addPixel,
    updatePixel,
    removePixel,
    handleSave,
  };
}
