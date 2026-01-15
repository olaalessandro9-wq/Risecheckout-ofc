/**
 * Hooks para o PushinPay Gateway
 * Módulo: src/integrations/gateways/pushinpay
 * 
 * Este arquivo contém hooks React para carregar e gerenciar
 * a configuração da PushinPay do banco de dados.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PushinPayIntegration } from "./types";

/**
 * Hook para carregar a configuração da PushinPay de um vendedor
 * 
 * Busca no banco de dados (vendor_integrations) a configuração da PushinPay
 * específica para o vendedor. Inclui cache de 5 minutos.
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da integração
 * 
 * @example
 * const { data: pushinPayIntegration, isLoading, error } = usePushinPayConfig(vendorId);
 * 
 * if (isLoading) return <div>Carregando...</div>;
 * if (error) return <div>Erro ao carregar config</div>;
 * if (!pushinPayIntegration) return null;
 * 
 * return <div>PushinPay ativado</div>;
 */
export function usePushinPayConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["pushinpay-config", vendorId],
    queryFn: async (): Promise<PushinPayIntegration | null> => {
      // Validação: se não tem vendorId, retorna null
      if (!vendorId) {
        console.warn("[PushinPay] vendorId não fornecido para usePushinPayConfig");
        return null;
      }

      try {
        // Query ao banco de dados
        const { data, error } = await supabase
          .from("vendor_integrations")
          .select("*")
          .eq("vendor_id", vendorId)
          .eq("integration_type", "PUSHINPAY")
          .eq("active", true)
          .maybeSingle();

        // Tratamento de erro
        if (error) {
          // PGRST116 = nenhuma linha encontrada (não é erro crítico)
          if (error.code === "PGRST116") {
            console.log("[PushinPay] Integração não encontrada para vendor:", vendorId);
            return null;
          }
          console.error("[PushinPay] Erro ao carregar configuração:", error);
          return null;
        }

        // Validação: dados vazios ou integração inativa
        if (!data || !data.active) {
          console.log("[PushinPay] Integração não encontrada ou desativada para vendor:", vendorId);
          return null;
        }

        console.log("[PushinPay] Configuração carregada com sucesso para vendor:", vendorId);

        return data as PushinPayIntegration;
      } catch (error: unknown) {
        console.error("[PushinPay] Erro inesperado ao carregar config:", error);
        return null;
      }
    },
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

/**
 * Hook para verificar se a PushinPay está disponível
 * 
 * @param integration - Integração da PushinPay
 * @returns true se disponível e ativo
 * 
 * @example
 * const isAvailable = usePushinPayAvailable(integration);
 * 
 * if (isAvailable) {
 *   // Mostrar opção de pagamento PIX
 * }
 */
export function usePushinPayAvailable(
  integration: PushinPayIntegration | null | undefined
): boolean {
  // Validação: integração inválida ou desativada
  if (!integration || !integration.active) {
    return false;
  }

  // Validação: token configurado
  if (!integration.config?.pushinpay_token) {
    return false;
  }

  return true;
}
