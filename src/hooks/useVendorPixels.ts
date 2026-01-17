/**
 * Hook: useVendorPixels
 * Gerencia CRUD de pixels do vendedor (biblioteca)
 * 
 * @version 3.0.0 - Migrado para api.call() - Unified API Client
 * @security Todas as operações via backend com validação de ownership
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { VendorPixel, PixelFormData, PixelPlatform } from "@/components/pixels/types";

interface PixelsResponse {
  pixels?: VendorPixel[];
  error?: string;
}

interface PixelActionResponse {
  error?: string;
}

interface UseVendorPixelsReturn {
  pixels: VendorPixel[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPixel: (data: PixelFormData) => Promise<boolean>;
  updatePixel: (id: string, data: PixelFormData) => Promise<boolean>;
  deletePixel: (id: string) => Promise<boolean>;
}

export function useVendorPixels(): UseVendorPixelsReturn {
  const [pixels, setPixels] = useState<VendorPixel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPixels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fnError } = await api.call<PixelsResponse>("pixel-management", {
        action: "list",
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // Cast para tipagem correta
      const enrichedPixels: VendorPixel[] = (data?.pixels || []).map((pixel: VendorPixel) => ({
        ...pixel,
        platform: pixel.platform as PixelPlatform,
      }));

      setPixels(enrichedPixels);
    } catch (err) {
      console.error("[useVendorPixels] Fetch error:", err);
      setError("Erro ao carregar pixels");
      toast.error("Erro ao carregar pixels");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPixels();
  }, [fetchPixels]);

  const createPixel = useCallback(async (data: PixelFormData): Promise<boolean> => {
    try {
      setIsSaving(true);

      const { data: result, error: fnError } = await api.call<PixelActionResponse>("pixel-management", {
        action: "create",
        data: {
          platform: data.platform,
          name: data.name,
          pixel_id: data.pixel_id,
          access_token: data.access_token || null,
          conversion_label: data.conversion_label || null,
          domain: data.domain || null,
          is_active: data.is_active,
        },
      });

      if (fnError) throw fnError;
      if (result?.error) {
        toast.error(result.error);
        return false;
      }

      toast.success("Pixel cadastrado com sucesso!");
      await fetchPixels();
      return true;
    } catch (err) {
      console.error("[useVendorPixels] Create error:", err);
      toast.error("Erro ao cadastrar pixel");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [fetchPixels]);

  const updatePixel = useCallback(async (id: string, data: PixelFormData): Promise<boolean> => {
    try {
      setIsSaving(true);

      const { data: result, error: fnError } = await api.call<PixelActionResponse>("pixel-management", {
        action: "update",
        pixelId: id,
        data: {
          name: data.name,
          pixel_id: data.pixel_id,
          access_token: data.access_token || null,
          conversion_label: data.conversion_label || null,
          domain: data.domain || null,
          is_active: data.is_active,
        },
      });

      if (fnError) throw fnError;
      if (result?.error) {
        toast.error(result.error);
        return false;
      }

      toast.success("Pixel atualizado com sucesso!");
      await fetchPixels();
      return true;
    } catch (err) {
      console.error("[useVendorPixels] Update error:", err);
      toast.error("Erro ao atualizar pixel");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [fetchPixels]);

  const deletePixel = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsSaving(true);

      const { data: result, error: fnError } = await api.call<PixelActionResponse>("pixel-management", {
        action: "delete",
        pixelId: id,
      });

      if (fnError) throw fnError;
      if (result?.error) {
        toast.error(result.error);
        return false;
      }

      toast.success("Pixel excluído com sucesso!");
      await fetchPixels();
      return true;
    } catch (err) {
      console.error("[useVendorPixels] Delete error:", err);
      toast.error("Erro ao excluir pixel");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [fetchPixels]);

  return {
    pixels,
    isLoading,
    isSaving,
    error,
    refetch: fetchPixels,
    createPixel,
    updatePixel,
    deletePixel,
  };
}
