/**
 * Hooks para o TikTok Pixel
 * 
 * MIGRATED: Uses vendor-integrations Edge Function
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TikTokIntegration } from "./types";

/**
 * Hook para carregar a configuração do TikTok Pixel de um vendedor
 */
export function useTikTokConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["tiktok-config", vendorId],
    queryFn: async (): Promise<TikTokIntegration | null> => {
      if (!vendorId) {
        console.warn("[TikTok] vendorId não fornecido para useTikTokConfig");
        return null;
      }

      try {
        const { data, error } = await supabase.functions.invoke("vendor-integrations", {
          body: {
            action: "get-config",
            vendorId,
            integrationType: "TIKTOK_PIXEL",
          },
        });

        if (error) {
          console.error("[TikTok] Edge function error:", error);
          return null;
        }

        if (!data?.success || !data?.data) {
          console.log("[TikTok] Integração não encontrada para vendor:", vendorId);
          return null;
        }

        console.log("[TikTok] Configuração carregada com sucesso para vendor:", vendorId);
        return data.data as unknown as TikTokIntegration;
      } catch (error: unknown) {
        console.error("[TikTok] Erro inesperado ao carregar config:", error);
        return null;
      }
    },
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

/**
 * Helper para verificar se o TikTok Pixel deve ser executado para um produto específico
 */
export function shouldRunTikTok(
  integration: TikTokIntegration | null | undefined,
  productId?: string
): boolean {
  if (!integration || !integration.active) {
    return false;
  }

  if (!productId) {
    return false;
  }

  const selectedProducts = integration.config?.selected_products || [];
  if (selectedProducts.length === 0) {
    return true;
  }

  const shouldRun = selectedProducts.includes(productId);

  if (!shouldRun) {
    console.log(
      `[TikTok] TikTok Pixel não vai rodar para produto ${productId}. Produtos selecionados:`,
      selectedProducts
    );
  }

  return shouldRun;
}

/**
 * Hook para verificar se o TikTok Pixel deve rodar para um produto específico
 */
export function useTikTokForProduct(vendorId?: string, productId?: string): boolean {
  const { data: tiktokIntegration } = useTikTokConfig(vendorId);
  return shouldRunTikTok(tiktokIntegration, productId);
}
