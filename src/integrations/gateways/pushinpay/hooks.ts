/**
 * Hooks para o PushinPay Gateway
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PushinPayIntegration } from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("PushinPay");

interface PushinPayConfigResponse {
  success?: boolean;
  data?: PushinPayIntegration;
  error?: string;
}

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
        log.warn("vendorId não fornecido para usePushinPayConfig");
        return null;
      }

      try {
        const { data, error } = await api.publicCall<PushinPayConfigResponse>("vendor-integrations", {
          action: "get-config",
          vendorId,
          integrationType: "PUSHINPAY",
        });

        if (error) {
          log.error("Edge function error", error);
          return null;
        }

        if (!data?.success || !data?.data) {
          log.debug("Integração não encontrada para vendor", { vendorId });
          return null;
        }

        log.info("Configuração carregada com sucesso", { vendorId });
        return data.data;
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
