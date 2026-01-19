/**
 * Hooks para o UTMify
 * Módulo: src/integrations/tracking/utmify
 * 
 * MIGRATED: Uses Edge Function instead of direct database access
 * @see RISE Protocol V3 - Zero console.log
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { UTMifyIntegration } from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("UTMifyHooks");

interface VendorIntegrationResponse {
  integration?: UTMifyIntegration;
}

/**
 * Hook para carregar a configuração do UTMify de um vendedor
 * MIGRATED: Uses Edge Function (vendor-integrations)
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da integração
 */
export function useUTMifyConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["utmify-config", vendorId],
    queryFn: async (): Promise<UTMifyIntegration | null> => {
      // Validação: se não tem vendorId, retorna null
      if (!vendorId) {
        log.warn("vendorId não fornecido para useUTMifyConfig");
        return null;
      }

      try {
        // Query via Edge Function using api.publicCall (vendor-integrations is public)
        const { data, error } = await api.publicCall<VendorIntegrationResponse>("vendor-integrations", {
          action: "get",
          vendorId,
          integrationType: "UTMIFY",
        });

        // Tratamento de erro
        if (error) {
          log.error("Erro ao carregar configuração:", error);
          return null;
        }

        // Validação: dados vazios ou integração inativa
        if (!data?.integration || !data.integration.active) {
          log.debug("Integração não encontrada ou desativada para vendor:", vendorId);
          return null;
        }

        log.info("Configuração carregada com sucesso para vendor:", vendorId);

        return data.integration;
      } catch (error: unknown) {
        log.error("Erro inesperado ao carregar config:", error);
        return null;
      }
    },
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

/**
 * Helper para verificar se o UTMify deve ser executado para um produto específico
 * 
 * Lógica:
 * - Se integração é null/undefined ou desativada → false
 * - Se não tem productId específico → false (UTMify precisa de produto)
 * - Se selected_products está vazio → true (executar em todos os produtos)
 * - Se selected_products tem items → verificar se productId está na lista
 * 
 * @param integration - Integração do UTMify
 * @param productId - ID do produto (obrigatório)
 * @returns true se o UTMify deve rodar, false caso contrário
 */
export function shouldRunUTMify(
  integration: UTMifyIntegration | null | undefined,
  productId?: string
): boolean {
  // Validação: integração inválida ou desativada
  if (!integration || !integration.active) {
    return false;
  }

  // UTMify requer um productId específico
  if (!productId) {
    return false;
  }

  // Se a lista de produtos selecionados está vazia, roda em TODOS
  const selectedProducts = integration.config?.selected_products || [];
  if (selectedProducts.length === 0) {
    return true;
  }

  // Se tem lista, verifica se o productId está nela
  const shouldRun = selectedProducts.includes(productId);

  if (!shouldRun) {
    log.debug(
      `UTMify não vai rodar para produto ${productId}. Produtos selecionados:`,
      selectedProducts
    );
  }

  return shouldRun;
}

/**
 * Hook para verificar se o UTMify deve rodar para um produto específico
 * Combina useUTMifyConfig + shouldRunUTMify
 * 
 * @param vendorId - ID do vendedor
 * @param productId - ID do produto
 * @returns true se o UTMify deve rodar
 */
export function useUTMifyForProduct(vendorId?: string, productId?: string): boolean {
  const { data: utmifyIntegration } = useUTMifyConfig(vendorId);
  return shouldRunUTMify(utmifyIntegration, productId);
}

/**
 * Hook para verificar se um evento específico está habilitado
 * 
 * @param integration - Integração do UTMify
 * @param eventType - Tipo de evento (ex: "purchase", "pageview")
 * @returns true se o evento está habilitado
 */
export function isEventEnabledForUTMify(
  integration: UTMifyIntegration | null | undefined,
  eventType: string
): boolean {
  if (!integration || !integration.active) {
    return false;
  }

  const selectedEvents = integration.config?.selected_events || [];

  // Se a lista está vazia, todos os eventos estão habilitados
  if (selectedEvents.length === 0) {
    return true;
  }

  return selectedEvents.includes(eventType);
}
