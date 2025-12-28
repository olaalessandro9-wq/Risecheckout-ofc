/**
 * useAffiliateGateway - Hook para gerenciar gateways de afiliados
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AffiliateGatewayData {
  pix_gateway: string | null;
  credit_card_gateway: string | null;
  gateway_credentials: Record<string, string>;
}

interface UseAffiliateGatewayReturn {
  loading: boolean;
  saving: boolean;
  saveGateways: (affiliateId: string, data: Partial<AffiliateGatewayData>) => Promise<boolean>;
  getAffiliateGateways: (affiliateId: string) => Promise<AffiliateGatewayData | null>;
  getProductGatewaySettings: (productId: string) => Promise<{
    pix_allowed: string[];
    credit_card_allowed: string[];
    require_gateway_connection: boolean;
  } | null>;
}

export function useAffiliateGateway(): UseAffiliateGatewayReturn {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveGateways = useCallback(async (
    affiliateId: string, 
    data: Partial<AffiliateGatewayData>
  ): Promise<boolean> => {
    setSaving(true);
    try {
      // Usar Edge Function segura (não UPDATE direto via RLS)
      const { data: result, error: invokeError } = await supabase.functions.invoke(
        'update-affiliate-settings',
        {
          body: {
            action: 'update_gateways',
            affiliate_id: affiliateId,
            pix_gateway: data.pix_gateway,
            credit_card_gateway: data.credit_card_gateway,
            gateway_credentials: data.gateway_credentials || {},
          }
        }
      );

      if (invokeError) throw invokeError;
      if (result?.error) throw new Error(result.error);
      
      toast.success("Gateways atualizados com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao salvar gateways:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao salvar configurações de gateway");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const getAffiliateGateways = useCallback(async (
    affiliateId: string
  ): Promise<AffiliateGatewayData | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("affiliates")
        .select("pix_gateway, credit_card_gateway, gateway_credentials")
        .eq("id", affiliateId)
        .single();

      if (error) throw error;

      return {
        pix_gateway: data.pix_gateway,
        credit_card_gateway: data.credit_card_gateway,
        gateway_credentials: (data.gateway_credentials as Record<string, string>) || {},
      };
    } catch (error) {
      console.error("Erro ao buscar gateways do afiliado:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductGatewaySettings = useCallback(async (
    productId: string
  ): Promise<{
    pix_allowed: string[];
    credit_card_allowed: string[];
    require_gateway_connection: boolean;
  } | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("affiliate_gateway_settings")
        .eq("id", productId)
        .single();

      if (error) throw error;

      const settings = data?.affiliate_gateway_settings as {
        pix_allowed?: string[];
        credit_card_allowed?: string[];
        require_gateway_connection?: boolean;
      } | null;

      return {
        pix_allowed: settings?.pix_allowed || ["asaas"],
        credit_card_allowed: settings?.credit_card_allowed || ["mercadopago", "stripe"],
        require_gateway_connection: settings?.require_gateway_connection ?? true,
      };
    } catch (error) {
      console.error("Erro ao buscar configurações de gateway do produto:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    saving,
    saveGateways,
    getAffiliateGateways,
    getProductGatewaySettings,
  };
}
