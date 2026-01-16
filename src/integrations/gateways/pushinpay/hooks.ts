/**
 * Hooks para o PushinPay Gateway
 * 
 * MIGRATED: Uses vendor-integrations Edge Function
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PushinPayIntegration } from "./types";

/**
 * Hook para carregar a configuração da PushinPay de um vendedor
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da integração
 */
export function usePushinPayConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["pushinpay-config", vendorId],
    queryFn: async (): Promise<PushinPayIntegration | null> => {
      if (!vendorId) {
        console.warn("[PushinPay] vendorId não fornecido para usePushinPayConfig");
        return null;
      }

      try {
        const { data, error } = await supabase.functions.invoke("vendor-integrations", {
          body: {
            action: "get-config",
            vendorId,
            integrationType: "PUSHINPAY",
          },
        });

        if (error) {
          console.error("[PushinPay] Edge function error:", error);
          return null;
        }

        if (!data?.success || !data?.data) {
          console.log("[PushinPay] Integração não encontrada para vendor:", vendorId);
          return null;
        }

        console.log("[PushinPay] Configuração carregada com sucesso para vendor:", vendorId);
        return data.data as PushinPayIntegration;
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
 */
export function usePushinPayAvailable(
  integration: PushinPayIntegration | null | undefined
): boolean {
  if (!integration || !integration.active) {
    return false;
  }

  // For public endpoint, we check has_token instead of actual token
  const config = integration.config as { has_token?: boolean; pushinpay_token?: string } | undefined;
  if (!config?.has_token && !config?.pushinpay_token) {
    return false;
  }

  return true;
}
