/**
 * Hooks para o Facebook Pixel
 * Módulo: src/integrations/tracking/facebook
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FacebookPixelConfig } from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("Facebook");

interface FacebookConfigResponse {
  config?: {
    pixel_id?: string;
    access_token?: string;
    active?: boolean;
    selected_products?: string[];
    fire_purchase_on_pix?: boolean;
  };
  error?: string;
}

/**
 * Hook para carregar a configuração do Facebook Pixel de um vendedor
 * 
 * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da configuração
 */
export function useFacebookConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["facebook-pixel-config", vendorId],
    queryFn: async (): Promise<FacebookPixelConfig | null> => {
      // Validação: se não tem vendorId, retorna null
      if (!vendorId) {
        log.warn("vendorId não fornecido para useFacebookConfig");
        return null;
      }

      try {
        // MIGRATED: Uses api.publicCall() for public vendor config
        const { data, error } = await api.publicCall<FacebookConfigResponse>('vendor-integrations', { 
          action: 'get-config',
          vendorId,
          integrationType: 'FACEBOOK_PIXEL'
        });

        if (error) {
          log.error("Erro ao chamar Edge Function", error);
          return null;
        }

        if (data?.error || !data?.config) {
          log.debug("Integração não encontrada ou desativada", { vendorId });
          return null;
        }

        const config = data.config;

        // Validação: pixel_id obrigatório
        if (!config?.pixel_id) {
          log.warn("pixel_id não encontrado na configuração");
          return null;
        }

        // Retornar config estruturada
        const facebookConfig: FacebookPixelConfig = {
          pixel_id: config.pixel_id,
          access_token: config.access_token,
          enabled: config.active ?? true,
          selected_products: config.selected_products || [],
          fire_purchase_on_pix: config.fire_purchase_on_pix ?? true,
        };

        log.info("Configuração carregada com sucesso", {
          pixel_id: facebookConfig.pixel_id,
          enabled: facebookConfig.enabled,
          selected_products: facebookConfig.selected_products?.length || "todos",
        });

        return facebookConfig;
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
 * Helper para verificar se o pixel deve ser executado para um produto específico
 * 
 * Lógica:
 * - Se config é null/undefined ou desativada → false
 * - Se não tem productId específico → true (executar em página genérica)
 * - Se selected_products está vazio → true (executar em todos os produtos)
 * - Se selected_products tem items → verificar se productId está na lista
 * 
 * @param config - Configuração do Facebook Pixel
 * @param productId - ID do produto (opcional)
 * @returns true se o pixel deve rodar, false caso contrário
 */
export function shouldRunPixel(
  config: FacebookPixelConfig | null | undefined,
  productId?: string
): boolean {
  // Validação: config inválida ou desativada
  if (!config || !config.enabled || !config.pixel_id) {
    return false;
  }

  // Se não tem productId específico, assume que deve rodar
  // (ex: página genérica, landing page)
  if (!productId) {
    return true;
  }

  // Se a lista de produtos selecionados está vazia, roda em TODOS
  if (!config.selected_products || config.selected_products.length === 0) {
    return true;
  }

  // Se tem lista, verifica se o productId está nela
  const shouldRun = config.selected_products.includes(productId);

  if (!shouldRun) {
    log.debug(`Pixel não vai rodar para produto ${productId}`, {
      selected_products: config.selected_products,
    });
  }

  return shouldRun;
}

/**
 * Hook para verificar se o pixel deve rodar para um produto específico
 * Combina useFacebookConfig + shouldRunPixel
 * 
 * @param vendorId - ID do vendedor
 * @param productId - ID do produto
 * @returns true se o pixel deve rodar
 */
export function usePixelForProduct(vendorId?: string, productId?: string): boolean {
  const { data: fbConfig } = useFacebookConfig(vendorId);
  return shouldRunPixel(fbConfig, productId);
}
