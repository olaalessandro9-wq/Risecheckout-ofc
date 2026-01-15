/**
 * Hooks para o UTMify
 * Módulo: src/integrations/tracking/utmify
 * 
 * Este arquivo contém hooks React para carregar e gerenciar
 * a configuração do UTMify do banco de dados.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UTMifyConfig, UTMifyIntegration } from "./types";

/**
 * Hook para carregar a configuração do UTMify de um vendedor
 * 
 * Busca no banco de dados (vendor_integrations) a configuração do UTMify
 * específica para o vendedor. Inclui cache de 5 minutos.
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da integração
 * 
 * @example
 * const { data: utmifyIntegration, isLoading, error } = useUTMifyConfig(vendorId);
 * 
 * if (isLoading) return <div>Carregando...</div>;
 * if (error) return <div>Erro ao carregar config</div>;
 * if (!utmifyIntegration) return null;
 * 
 * return <div>UTMify ativado</div>;
 */
export function useUTMifyConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["utmify-config", vendorId],
    queryFn: async (): Promise<UTMifyIntegration | null> => {
      // Validação: se não tem vendorId, retorna null
      if (!vendorId) {
        console.warn("[UTMify] vendorId não fornecido para useUTMifyConfig");
        return null;
      }

      try {
        // Query ao banco de dados
        const { data, error } = await supabase
          .from("vendor_integrations")
          .select("*")
          .eq("vendor_id", vendorId)
          .eq("integration_type", "UTMIFY")
          .eq("active", true)
          .maybeSingle();

        // Tratamento de erro
        if (error) {
          // PGRST116 = nenhuma linha encontrada (não é erro crítico)
          if (error.code === "PGRST116") {
            console.log("[UTMify] Integração não encontrada para vendor:", vendorId);
            return null;
          }
          console.error("[UTMify] Erro ao carregar configuração:", error);
          return null;
        }

        // Validação: dados vazios ou integração inativa
        if (!data || !data.active) {
          console.log("[UTMify] Integração não encontrada ou desativada para vendor:", vendorId);
          return null;
        }

        console.log("[UTMify] Configuração carregada com sucesso para vendor:", vendorId);

        return data as unknown as UTMifyIntegration;
      } catch (error: unknown) {
        console.error("[UTMify] Erro inesperado ao carregar config:", error);
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
 * 
 * @example
 * const { data: utmifyIntegration } = useUTMifyConfig(vendorId);
 * const shouldRun = shouldRunUTMify(utmifyIntegration, productId);
 * 
 * if (shouldRun) {
 *   // Enviar conversão ao UTMify
 * }
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
    console.log(
      `[UTMify] UTMify não vai rodar para produto ${productId}. Produtos selecionados:`,
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
 * 
 * @example
 * const shouldRunUTMify = useUTMifyForProduct(vendorId, productId);
 * 
 * if (shouldRunUTMify) {
 *   // Enviar conversão ao UTMify
 * }
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
 * 
 * @example
 * const isEventEnabled = isEventEnabledForUTMify(utmifyIntegration, "purchase");
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
