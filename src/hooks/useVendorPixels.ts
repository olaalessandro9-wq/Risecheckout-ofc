/**
 * Hook: useVendorPixels
 * Gerencia CRUD de pixels do vendedor (biblioteca)
 * 
 * @version 2.0.0 - Migrado para Edge Function pixel-management
 * @security Todas as operações via backend com validação de ownership
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";
import type { VendorPixel, PixelFormData, PixelPlatform } from "@/components/pixels/types";

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

      const sessionToken = getProducerSessionToken();
      if (!sessionToken) {
        setError("Usuário não autenticado");
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke("pixel-management", {
        body: { action: "list" },
        headers: { "x-producer-session-token": sessionToken },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // Cast para tipagem correta
      const enrichedPixels: VendorPixel[] = (data.pixels || []).map((pixel: VendorPixel) => ({
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

      const sessionToken = getProducerSessionToken();
      if (!sessionToken) {
        toast.error("Usuário não autenticado");
        return false;
      }

      const { data: result, error: fnError } = await supabase.functions.invoke("pixel-management", {
        body: {
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
        },
        headers: { "x-producer-session-token": sessionToken },
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

      const sessionToken = getProducerSessionToken();
      if (!sessionToken) {
        toast.error("Usuário não autenticado");
        return false;
      }

      const { data: result, error: fnError } = await supabase.functions.invoke("pixel-management", {
        body: {
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
        },
        headers: { "x-producer-session-token": sessionToken },
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

      const sessionToken = getProducerSessionToken();
      if (!sessionToken) {
        toast.error("Usuário não autenticado");
        return false;
      }

      const { data: result, error: fnError } = await supabase.functions.invoke("pixel-management", {
        body: {
          action: "delete",
          pixelId: id,
        },
        headers: { "x-producer-session-token": sessionToken },
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
