/**
 * Hooks para o Kwai Pixel
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { KwaiIntegration } from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("Kwai");

interface KwaiConfigResponse {
  integration?: KwaiIntegration;
  error?: string;
}

export function useKwaiConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["kwai-config", vendorId],
    queryFn: async (): Promise<KwaiIntegration | null> => {
      if (!vendorId) {
        log.warn("vendorId não fornecido para useKwaiConfig");
        return null;
      }
      try {
        const { data, error } = await api.publicCall<KwaiConfigResponse>("vendor-integrations", { action: "get", vendorId, integrationType: "KWAI_PIXEL" });
        if (error) { log.error("Erro ao carregar configuração", error); return null; }
        if (!data?.integration || !data.integration.active) { log.debug("Integração não encontrada ou desativada", { vendorId }); return null; }
        log.info("Configuração carregada com sucesso", { vendorId });
        return data.integration;
      } catch (error: unknown) { log.error("Erro inesperado ao carregar config", error); return null; }
    },
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function shouldRunKwai(integration: KwaiIntegration | null | undefined, productId?: string): boolean {
  if (!integration || !integration.active) return false;
  if (!productId) return false;
  const selectedProducts = integration.config?.selected_products || [];
  if (selectedProducts.length === 0) return true;
  const shouldRun = selectedProducts.includes(productId);
  if (!shouldRun) log.debug(`Pixel não vai rodar para produto ${productId}`, { selected_products: selectedProducts });
  return shouldRun;
}

export function useKwaiForProduct(vendorId?: string, productId?: string): boolean {
  const { data: kwaiIntegration } = useKwaiConfig(vendorId);
  return shouldRunKwai(kwaiIntegration, productId);
}
