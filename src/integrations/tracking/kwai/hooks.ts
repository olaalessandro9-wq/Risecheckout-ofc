/**
 * Hooks para o Kwai Pixel
 * Módulo: src/integrations/tracking/kwai
 * 
 * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
 * 
 * Este arquivo contém hooks React para carregar e gerenciar
 * a configuração do Kwai Pixel do banco de dados.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { KwaiConfig, KwaiIntegration } from "./types";

interface KwaiConfigResponse {
  integration?: KwaiIntegration;
  error?: string;
}

/**
 * Hook para carregar a configuração do Kwai Pixel de um vendedor
 * 
 * Busca no banco de dados (vendor_integrations) a configuração do Kwai Pixel
 * específica para o vendedor. Inclui cache de 5 minutos.
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da integração
 * 
 * @example
 * const { data: kwaiIntegration, isLoading, error } = useKwaiConfig(vendorId);
 * 
 * if (isLoading) return <div>Carregando...</div>;
 * if (error) return <div>Erro ao carregar config</div>;
 * if (!kwaiIntegration) return null;
 * 
 * return <div>Kwai Pixel ativado</div>;
 */
export function useKwaiConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["kwai-config", vendorId],
    queryFn: async (): Promise<KwaiIntegration | null> => {
      if (!vendorId) {
        console.warn("[Kwai] vendorId não fornecido para useKwaiConfig");
        return null;
      }

      try {
        const { data, error } = await api.publicCall<KwaiConfigResponse>("vendor-integrations", {
          action: "get",
          vendorId,
          integrationType: "KWAI_PIXEL",
        });

        if (error) {
          console.error("[Kwai] Erro ao carregar configuração:", error);
          return null;
        }

        if (!data?.integration || !data.integration.active) {
          console.log("[Kwai] Integração não encontrada ou desativada para vendor:", vendorId);
          return null;
        }

        console.log("[Kwai] Configuração carregada com sucesso para vendor:", vendorId);
        return data.integration;
      } catch (error: unknown) {
        console.error("[Kwai] Erro inesperado ao carregar config:", error);
        return null;
      }
    },
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

/**
 * Helper para verificar se o Kwai Pixel deve ser executado para um produto específico
 * 
 * Lógica:
 * - Se integração é null/undefined ou desativada → false
 * - Se não tem productId específico → false (Kwai precisa de produto)
 * - Se selected_products está vazio → true (executar em todos os produtos)
 * - Se selected_products tem items → verificar se productId está na lista
 * 
 * @param integration - Integração do Kwai Pixel
 * @param productId - ID do produto (obrigatório)
 * @returns true se o Kwai Pixel deve rodar, false caso contrário
 * 
 * @example
 * const { data: kwaiIntegration } = useKwaiConfig(vendorId);
 * const shouldRun = shouldRunKwai(kwaiIntegration, productId);
 * 
 * if (shouldRun) {
 *   // Enviar conversão ao Kwai
 * }
 */
export function shouldRunKwai(
  integration: KwaiIntegration | null | undefined,
  productId?: string
): boolean {
  // Validação: integração inválida ou desativada
  if (!integration || !integration.active) {
    return false;
  }

  // Kwai requer um productId específico
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
    console.log(
      `[Kwai] Kwai Pixel não vai rodar para produto ${productId}. Produtos selecionados:`,
      selectedProducts
    );
  }

  return shouldRun;
}

/**
 * Hook para verificar se o Kwai Pixel deve rodar para um produto específico
 * Combina useKwaiConfig + shouldRunKwai
 * 
 * @param vendorId - ID do vendedor
 * @param productId - ID do produto
 * @returns true se o Kwai Pixel deve rodar
 * 
 * @example
 * const shouldRunKwai = useKwaiForProduct(vendorId, productId);
 * 
 * if (shouldRunKwai) {
 *   // Enviar conversão ao Kwai
 * }
 */
export function useKwaiForProduct(vendorId?: string, productId?: string): boolean {
  const { data: kwaiIntegration } = useKwaiConfig(vendorId);
  return shouldRunKwai(kwaiIntegration, productId);
}
