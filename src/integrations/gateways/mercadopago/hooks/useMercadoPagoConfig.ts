/**
 * useMercadoPagoConfig - Hook para carregar configuração do Mercado Pago
 * 
 * MIGRATED: Uses vendor-integrations Edge Function
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MercadoPagoIntegration } from "../types";

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
        console.warn("[MercadoPago] vendorId não fornecido para useMercadoPagoConfig");
        return null;
      }

      try {
        const { data, error } = await supabase.functions.invoke("vendor-integrations", {
          body: {
            action: "get-config",
            vendorId,
            integrationType: "MERCADOPAGO",
          },
        });

        if (error) {
          console.error("[MercadoPago] Edge function error:", error);
          return null;
        }

        if (!data?.success || !data?.data) {
          console.log("[MercadoPago] Integração não encontrada para vendor:", vendorId);
          return null;
        }

        console.log("[MercadoPago] Configuração carregada com sucesso para vendor:", vendorId);
        return data.data as unknown as MercadoPagoIntegration;
      } catch (error: unknown) {
        console.error("[MercadoPago] Erro inesperado ao carregar config:", error);
        return null;
      }
    },
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
