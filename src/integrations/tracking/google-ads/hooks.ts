/**
 * Hooks para o Google Ads
 * Módulo: src/integrations/tracking/google-ads
 * 
 * Este arquivo contém hooks React para carregar e gerenciar
 * a configuração do Google Ads do banco de dados.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { createLogger } from "@/lib/logger";
import { GoogleAdsConfig, GoogleAdsIntegration } from "./types";

const log = createLogger('GoogleAds');

interface VendorIntegrationResponse {
  integration?: GoogleAdsIntegration;
}

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
        log.warn('vendorId não fornecido para useGoogleAdsConfig');
        return null;
      }

      try {
        // Query via Edge Function (public) using api.publicCall
        const { data, error } = await api.publicCall<VendorIntegrationResponse>("vendor-integrations", {
          action: "get",
          vendorId,
          integrationType: "GOOGLE_ADS",
        });

        // Tratamento de erro
        if (error) {
          log.error('Erro ao carregar configuração', error);
          return null;
        }

        // Validação: dados vazios ou integração inativa
        if (!data?.integration || !data.integration.active) {
          log.debug('Integração não encontrada ou desativada para vendor', vendorId);
          return null;
        }

        log.debug('Configuração carregada com sucesso para vendor', vendorId);

        return data.integration;
      } catch (error: unknown) {
        log.error('Erro inesperado ao carregar config', error);
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
    log.trace(`Google Ads não vai rodar para produto ${productId}. Produtos selecionados: ${selectedProducts.join(', ')}`);
  }

  return shouldRun;
}

/**
 * Hook para verificar se o Google Ads deve rodar para um produto específico
 * Combina useGoogleAdsConfig + shouldRunGoogleAds
 */
export function useGoogleAdsForProduct(vendorId?: string, productId?: string): boolean {
  const { data: googleAdsIntegration } = useGoogleAdsConfig(vendorId);
  return shouldRunGoogleAds(googleAdsIntegration, productId);
}

/**
 * Hook para verificar se um evento específico está habilitado
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
