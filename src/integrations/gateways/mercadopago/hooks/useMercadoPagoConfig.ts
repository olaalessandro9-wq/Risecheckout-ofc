/**
 * useMercadoPagoConfig - Hook para carregar configuração do Mercado Pago
 * 
 * Responsabilidade única: Buscar configuração do vendedor no banco de dados
 * Limite: < 80 linhas
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MercadoPagoIntegration } from "../types";

/**
 * Hook para carregar a configuração do Mercado Pago de um vendedor
 * 
 * Busca no banco de dados (vendor_integrations) a configuração do Mercado Pago
 * específica para o vendedor. Inclui cache de 5 minutos.
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da integração
 * 
 * @example
 * const { data: mpIntegration, isLoading, error } = useMercadoPagoConfig(vendorId);
 * 
 * if (isLoading) return <div>Carregando...</div>;
 * if (error) return <div>Erro ao carregar config</div>;
 * if (!mpIntegration) return null;
 * 
 * return <div>Mercado Pago ativado</div>;
 */
export function useMercadoPagoConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["mercadopago-config", vendorId],
    queryFn: async (): Promise<MercadoPagoIntegration | null> => {
      // Validação: se não tem vendorId, retorna null
      if (!vendorId) {
        console.warn("[MercadoPago] vendorId não fornecido para useMercadoPagoConfig");
        return null;
      }

      try {
        // Query ao banco de dados
        const { data, error } = await supabase
          .from("vendor_integrations")
          .select("*")
          .eq("vendor_id", vendorId)
          .eq("integration_type", "MERCADOPAGO")
          .eq("active", true)
          .maybeSingle();

        // Tratamento de erro
        if (error) {
          // PGRST116 = nenhuma linha encontrada (não é erro crítico)
          if (error.code === "PGRST116") {
            console.log("[MercadoPago] Integração não encontrada para vendor:", vendorId);
            return null;
          }
          console.error("[MercadoPago] Erro ao carregar configuração:", error);
          return null;
        }

        // Validação: dados vazios ou integração inativa
        if (!data || !data.active) {
          console.log("[MercadoPago] Integração não encontrada ou desativada para vendor:", vendorId);
          return null;
        }

        console.log("[MercadoPago] Configuração carregada com sucesso para vendor:", vendorId);

        return data as unknown as MercadoPagoIntegration;
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
