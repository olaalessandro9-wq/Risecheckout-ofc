/**
 * Hooks para o TikTok Pixel
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 * MIGRATED: Uses api.call() with vendor-integrations Edge Function
 * @see RISE Protocol V3 - Unified API Client
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TikTokIntegration } from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("TikTok");

interface TikTokConfigResponse {
  success: boolean;
  data?: TikTokIntegration;
  error?: string;
}

/**
 * Hook para carregar a configuração do TikTok Pixel de um vendedor
 */
export function useTikTokConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["tiktok-config", vendorId],
    queryFn: async (): Promise<TikTokIntegration | null> => {
      if (!vendorId) {
        log.warn("vendorId não fornecido para useTikTokConfig");
        return null;
      }

      try {
        const { data, error } = await api.call<TikTokConfigResponse>("vendor-integrations", {
          action: "get-config",
          vendorId,
          integrationType: "TIKTOK_PIXEL",
        });

        if (error) {
          log.error("Edge function error", error);
          return null;
        }

        if (!data?.success || !data?.data) {
          log.debug("Integração não encontrada", { vendorId });
          return null;
        }

        log.info("Configuração carregada com sucesso", { vendorId });
        return data.data;
      } catch (error: unknown) {
        log.error("Erro inesperado ao carregar config", error);
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
    log.debug(`Pixel não vai rodar para produto ${productId}`, {
      selected_products: selectedProducts,
    });
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
