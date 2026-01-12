/**
 * Hook: useVendorPixels
 * Gerencia CRUD de pixels do vendedor (biblioteca)
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Usuário não autenticado");
        return;
      }

      // Buscar pixels do vendedor
      const { data: pixelsData, error: pixelsError } = await supabase
        .from("vendor_pixels")
        .select("*")
        .eq("vendor_id", user.id)
        .order("platform", { ascending: true })
        .order("name", { ascending: true });

      if (pixelsError) throw pixelsError;

      // Buscar contagem de produtos vinculados para cada pixel
      const pixelIds = pixelsData?.map(p => p.id) || [];
      
      let linkedCounts: Record<string, number> = {};
      if (pixelIds.length > 0) {
        const { data: linksData, error: linksError } = await supabase
          .from("product_pixels")
          .select("pixel_id")
          .in("pixel_id", pixelIds);

        if (!linksError && linksData) {
          linkedCounts = linksData.reduce((acc, link) => {
            acc[link.pixel_id] = (acc[link.pixel_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      // Adicionar contagem aos pixels
      const enrichedPixels: VendorPixel[] = (pixelsData || []).map(pixel => ({
        ...pixel,
        platform: pixel.platform as PixelPlatform,
        linked_products_count: linkedCounts[pixel.id] || 0,
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return false;
      }

      const { error } = await supabase
        .from("vendor_pixels")
        .insert({
          vendor_id: user.id,
          platform: data.platform,
          name: data.name,
          pixel_id: data.pixel_id,
          access_token: data.access_token || null,
          conversion_label: data.conversion_label || null,
          domain: data.domain || null,
          is_active: data.is_active,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Este Pixel ID já está cadastrado para esta plataforma");
        } else {
          throw error;
        }
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

      const { error } = await supabase
        .from("vendor_pixels")
        .update({
          name: data.name,
          pixel_id: data.pixel_id,
          access_token: data.access_token || null,
          conversion_label: data.conversion_label || null,
          domain: data.domain || null,
          is_active: data.is_active,
        })
        .eq("id", id);

      if (error) throw error;

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

      const { error } = await supabase
        .from("vendor_pixels")
        .delete()
        .eq("id", id);

      if (error) throw error;

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
