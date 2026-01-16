/**
 * Hooks para o Google Ads
 * Módulo: src/integrations/tracking/google-ads
 * 
 * Este arquivo contém hooks React para carregar e gerenciar
 * a configuração do Google Ads do banco de dados.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GoogleAdsConfig, GoogleAdsIntegration } from "./types";

/**
 * Hook para carregar a configuração do Google Ads de um vendedor
 * 
 * Busca no banco de dados (vendor_integrations) a configuração do Google Ads
 * específica para o vendedor. Inclui cache de 5 minutos.
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da integração
 * 
 * @example
 * const { data: googleAdsIntegration, isLoading, error } = useGoogleAdsConfig(vendorId);
 * 
 * if (isLoading) return <div>Carregando...</div>;
 * if (error) return <div>Erro ao carregar config</div>;
 * if (!googleAdsIntegration) return null;
 * 
 * return <div>Google Ads ativado</div>;
 */
/**
 * Hook para carregar a configuração do Google Ads de um vendedor
 * 
 * MIGRATED: Uses vendor-integrations Edge Function
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da integração
 */
export function useGoogleAdsConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["google-ads-config", vendorId],
    queryFn: async (): Promise<GoogleAdsIntegration | null> => {
      // Validação: se não tem vendorId, retorna null
      if (!vendorId) {
        console.warn("[Google Ads] vendorId não fornecido para useGoogleAdsConfig");
        return null;
      }

      try {
        // Query via Edge Function (public)
        const { data, error } = await supabase.functions.invoke("vendor-integrations", {
          body: {
            action: "get",
            vendorId,
            integrationType: "GOOGLE_ADS",
          },
        });

        // Tratamento de erro
        if (error) {
          console.error("[Google Ads] Erro ao carregar configuração:", error);
          return null;
        }

        // Validação: dados vazios ou integração inativa
        if (!data?.integration || !data.integration.active) {
          console.log("[Google Ads] Integração não encontrada ou desativada para vendor:", vendorId);
          return null;
        }

        console.log("[Google Ads] Configuração carregada com sucesso para vendor:", vendorId);

        return data.integration as GoogleAdsIntegration;
      } catch (error: unknown) {
        console.error("[Google Ads] Erro inesperado ao carregar config:", error);
        return null;
      }
    },
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

/**
 * Helper para verificar se o Google Ads deve ser executado para um produto específico
 * 
 * Lógica:
 * - Se integração é null/undefined ou desativada → false
 * - Se não tem productId específico → false (Google Ads precisa de produto)
 * - Se selected_products está vazio → true (executar em todos os produtos)
 * - Se selected_products tem items → verificar se productId está na lista
 * 
 * @param integration - Integração do Google Ads
 * @param productId - ID do produto (obrigatório)
 * @returns true se o Google Ads deve rodar, false caso contrário
 * 
 * @example
 * const { data: googleAdsIntegration } = useGoogleAdsConfig(vendorId);
 * const shouldRun = shouldRunGoogleAds(googleAdsIntegration, productId);
 * 
 * if (shouldRun) {
 *   // Enviar conversão ao Google Ads
 * }
 */
export function shouldRunGoogleAds(
  integration: GoogleAdsIntegration | null | undefined,
  productId?: string
): boolean {
  // Validação: integração inválida ou desativada
  if (!integration || !integration.active) {
    return false;
  }

  // Google Ads requer um productId específico
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
      `[Google Ads] Google Ads não vai rodar para produto ${productId}. Produtos selecionados:`,
      selectedProducts
    );
  }

  return shouldRun;
}

/**
 * Hook para verificar se o Google Ads deve rodar para um produto específico
 * Combina useGoogleAdsConfig + shouldRunGoogleAds
 * 
 * @param vendorId - ID do vendedor
 * @param productId - ID do produto
 * @returns true se o Google Ads deve rodar
 * 
 * @example
 * const shouldRunGoogleAds = useGoogleAdsForProduct(vendorId, productId);
 * 
 * if (shouldRunGoogleAds) {
 *   // Enviar conversão ao Google Ads
 * }
 */
export function useGoogleAdsForProduct(vendorId?: string, productId?: string): boolean {
  const { data: googleAdsIntegration } = useGoogleAdsConfig(vendorId);
  return shouldRunGoogleAds(googleAdsIntegration, productId);
}

/**
 * Hook para verificar se um evento específico está habilitado
 * 
 * @param integration - Integração do Google Ads
 * @param eventType - Tipo de evento (ex: "purchase", "lead")
 * @returns true se o evento está habilitado
 * 
 * @example
 * const isEventEnabled = isEventEnabledForGoogleAds(googleAdsIntegration, "purchase");
 */
export function isEventEnabledForGoogleAds(
  integration: GoogleAdsIntegration | null | undefined,
  eventType: string
): boolean {
  if (!integration || !integration.active) {
    return false;
  }

  const eventLabels = integration.config?.event_labels || [];

  // Se a lista está vazia, todos os eventos estão habilitados
  if (eventLabels.length === 0) {
    return true;
  }

  // Procurar pelo evento na lista
  const eventLabel = eventLabels.find((el) => el.eventType === eventType);

  // Se encontrou e enabled não é false, está habilitado
  return eventLabel ? eventLabel.enabled !== false : false;
}

/**
 * Hook para obter o label de conversão para um evento específico
 * 
 * @param integration - Integração do Google Ads
 * @param eventType - Tipo de evento (ex: "purchase")
 * @returns Label de conversão ou undefined
 * 
 * @example
 * const label = useConversionLabel(googleAdsIntegration, "purchase");
 */
export function useConversionLabel(
  integration: GoogleAdsIntegration | null | undefined,
  eventType?: string
): string | undefined {
  if (!integration || !integration.active) {
    return undefined;
  }

  const config = integration.config;

  // Se tem event_labels e o eventType é especificado
  if (eventType && config?.event_labels?.length) {
    const eventLabel = config.event_labels.find(
      (el) => el.eventType === eventType && el.enabled !== false
    );
    if (eventLabel?.label) {
      return eventLabel.label;
    }
  }

  // Fallback para label global
  return config?.conversion_label;
}
