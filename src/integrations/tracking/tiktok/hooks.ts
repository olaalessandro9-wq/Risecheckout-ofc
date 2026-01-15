/**
 * Hooks para o TikTok Pixel
 * Módulo: src/integrations/tracking/tiktok
 * 
 * Este arquivo contém hooks React para carregar e gerenciar
 * a configuração do TikTok Pixel do banco de dados.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TikTokConfig, TikTokIntegration } from "./types";

/**
 * Hook para carregar a configuração do TikTok Pixel de um vendedor
 * 
 * Busca no banco de dados (vendor_integrations) a configuração do TikTok Pixel
 * específica para o vendedor. Inclui cache de 5 minutos.
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da integração
 * 
 * @example
 * const { data: tiktokIntegration, isLoading, error } = useTikTokConfig(vendorId);
 * 
 * if (isLoading) return <div>Carregando...</div>;
 * if (error) return <div>Erro ao carregar config</div>;
 * if (!tiktokIntegration) return null;
 * 
 * return <div>TikTok Pixel ativado</div>;
 */
export function useTikTokConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["tiktok-config", vendorId],
    queryFn: async (): Promise<TikTokIntegration | null> => {
      // Validação: se não tem vendorId, retorna null
      if (!vendorId) {
        console.warn("[TikTok] vendorId não fornecido para useTikTokConfig");
        return null;
      }

      try {
        // Query ao banco de dados
        const { data, error } = await supabase
          .from("vendor_integrations")
          .select("*")
          .eq("vendor_id", vendorId)
          .eq("integration_type", "TIKTOK_PIXEL")
          .eq("active", true)
          .maybeSingle();

        // Tratamento de erro
        if (error) {
          // PGRST116 = nenhuma linha encontrada (não é erro crítico)
          if (error.code === "PGRST116") {
            console.log("[TikTok] Integração não encontrada para vendor:", vendorId);
            return null;
          }
          console.error("[TikTok] Erro ao carregar configuração:", error);
          return null;
        }

        // Validação: dados vazios ou integração inativa
        if (!data || !data.active) {
          console.log("[TikTok] Integração não encontrada ou desativada para vendor:", vendorId);
          return null;
        }

        console.log("[TikTok] Configuração carregada com sucesso para vendor:", vendorId);

        return data as unknown as TikTokIntegration;
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
 * 
 * Lógica:
 * - Se integração é null/undefined ou desativada → false
 * - Se não tem productId específico → false (TikTok precisa de produto)
 * - Se selected_products está vazio → true (executar em todos os produtos)
 * - Se selected_products tem items → verificar se productId está na lista
 * 
 * @param integration - Integração do TikTok Pixel
 * @param productId - ID do produto (obrigatório)
 * @returns true se o TikTok Pixel deve rodar, false caso contrário
 * 
 * @example
 * const { data: tiktokIntegration } = useTikTokConfig(vendorId);
 * const shouldRun = shouldRunTikTok(tiktokIntegration, productId);
 * 
 * if (shouldRun) {
 *   // Enviar conversão ao TikTok
 * }
 */
export function shouldRunTikTok(
  integration: TikTokIntegration | null | undefined,
  productId?: string
): boolean {
  // Validação: integração inválida ou desativada
  if (!integration || !integration.active) {
    return false;
  }

  // TikTok requer um productId específico
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
      `[TikTok] TikTok Pixel não vai rodar para produto ${productId}. Produtos selecionados:`,
      selectedProducts
    );
  }

  return shouldRun;
}

/**
 * Hook para verificar se o TikTok Pixel deve rodar para um produto específico
 * Combina useTikTokConfig + shouldRunTikTok
 * 
 * @param vendorId - ID do vendedor
 * @param productId - ID do produto
 * @returns true se o TikTok Pixel deve rodar
 * 
 * @example
 * const shouldRunTikTok = useTikTokForProduct(vendorId, productId);
 * 
 * if (shouldRunTikTok) {
 *   // Enviar conversão ao TikTok
 * }
 */
export function useTikTokForProduct(vendorId?: string, productId?: string): boolean {
  const { data: tiktokIntegration } = useTikTokConfig(vendorId);
  return shouldRunTikTok(tiktokIntegration, productId);
}
