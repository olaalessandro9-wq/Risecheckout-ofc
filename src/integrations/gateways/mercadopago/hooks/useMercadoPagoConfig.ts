/**
 * useMercadoPagoConfig - Hook para carregar configuração do Mercado Pago
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MercadoPagoIntegration } from "../types";
import { createLogger } from "@/lib/logger";

const log = createLogger("UseMercadoPagoConfig");

interface MercadoPagoConfigResponse {
  success?: boolean;
  data?: MercadoPagoIntegration;
  error?: string;
}

/**
 * Hook para carregar a configuração do Mercado Pago de um vendedor
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da integração
 */
export function useMercadoPagoConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["mercadopago-config", vendorId],
    queryFn: async (): Promise<MercadoPagoIntegration | null> => {
      if (!vendorId) {
        log.warn("vendorId não fornecido para useMercadoPagoConfig");
        return null;
      }

      try {
        const { data, error } = await api.publicCall<MercadoPagoConfigResponse>("vendor-integrations", {
          action: "get-config",
          vendorId,
          integrationType: "MERCADOPAGO",
        });

        if (error) {
          log.error("Edge function error:", error);
          return null;
        }

        if (!data?.success || !data?.data) {
          log.debug("Integração não encontrada para vendor:", vendorId);
          return null;
        }

        log.info("Configuração carregada com sucesso para vendor:", vendorId);
        return data.data;
      } catch (error: unknown) {
        log.error("Erro inesperado ao carregar config:", error);
        return null;
      }
    },
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
