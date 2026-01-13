/**
 * Hooks para o Facebook Pixel
 * Módulo: src/integrations/tracking/facebook
 * 
 * Este arquivo contém hooks React para carregar e gerenciar
 * a configuração do Facebook Pixel do banco de dados.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FacebookPixelConfig } from "./types";

/**
 * Hook para carregar a configuração do Facebook Pixel de um vendedor
 * 
 * Busca no banco de dados (vendor_integrations) a configuração do pixel
 * específica para o vendedor. Inclui cache de 5 minutos.
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da configuração
 * 
 * @example
 * const { data: fbConfig, isLoading, error } = useFacebookConfig(vendorId);
 * 
 * if (isLoading) return <div>Carregando...</div>;
 * if (error) return <div>Erro ao carregar config</div>;
 * if (!fbConfig) return null;
 * 
 * return <Pixel config={fbConfig} />;
 */
export function useFacebookConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["facebook-pixel-config", vendorId],
    queryFn: async (): Promise<FacebookPixelConfig | null> => {
      // Validação: se não tem vendorId, retorna null
      if (!vendorId) {
        console.warn("[Facebook] vendorId não fornecido para useFacebookConfig");
        return null;
      }

      try {
        // Query ao banco de dados
        const { data, error } = await supabase
          .from("vendor_integrations")
          .select("config, active")
          .eq("vendor_id", vendorId)
          .eq("integration_type", "FACEBOOK_PIXEL")
          .maybeSingle();

        // Tratamento de erro
        if (error) {
          console.error("[Facebook] Erro ao carregar configuração:", error);
          return null;
        }

        // Validação: dados vazios ou integração inativa
        if (!data || !data.active) {
          console.log("[Facebook] Integração não encontrada ou desativada para vendor:", vendorId);
          return null;
        }

        // Extrair config (tipo parcial do Facebook Pixel)
        interface RawFacebookConfig {
          pixel_id?: string;
          access_token?: string;
          selected_products?: string[];
          fire_purchase_on_pix?: boolean;
        }
        const config = data.config as RawFacebookConfig | null;

        // Validação: pixel_id obrigatório
        if (!config?.pixel_id) {
          console.warn("[Facebook] pixel_id não encontrado na configuração");
          return null;
        }

        // Retornar config estruturada
        const facebookConfig: FacebookPixelConfig = {
          pixel_id: config.pixel_id,
          access_token: config.access_token,
          enabled: data.active,
          selected_products: config.selected_products || [], // Vazio = todos os produtos
          fire_purchase_on_pix: config.fire_purchase_on_pix ?? true, // Padrão: true
        };

        console.log("[Facebook] Configuração carregada com sucesso:", {
          pixel_id: facebookConfig.pixel_id,
          enabled: facebookConfig.enabled,
          selected_products: facebookConfig.selected_products?.length || "todos",
        });

        return facebookConfig;
      } catch (error) {
        console.error("[Facebook] Erro inesperado ao carregar config:", error);
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
 * 
 * @example
 * const { data: fbConfig } = useFacebookConfig(vendorId);
 * const shouldRun = shouldRunPixel(fbConfig, productId);
 * 
 * if (shouldRun) {
 *   return <Pixel config={fbConfig} />;
 * }
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
    console.log(
      `[Facebook] Pixel não vai rodar para produto ${productId}. Produtos selecionados:`,
      config.selected_products
    );
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
 * 
 * @example
 * const shouldRunPixel = usePixelForProduct(vendorId, productId);
 * 
 * if (shouldRunPixel) {
 *   return <Pixel config={fbConfig} />;
 * }
 */
export function usePixelForProduct(vendorId?: string, productId?: string): boolean {
  const { data: fbConfig } = useFacebookConfig(vendorId);
  return shouldRunPixel(fbConfig, productId);
}
