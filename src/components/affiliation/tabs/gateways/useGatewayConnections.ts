/**
 * useGatewayConnections Hook
 * 
 * Gerencia o estado de conexões de gateway do usuário e configurações do produto.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/api-client";
import { toast } from "sonner";
import { DEFAULT_PIX_GATEWAYS, DEFAULT_CARD_GATEWAYS, GATEWAY_INFO } from "./gateway-constants";
import type { AffiliationDetails } from "@/hooks/useAffiliationDetails";

interface AffiliateGatewaySettings {
  pix_allowed?: string[];
  credit_card_allowed?: string[];
}

interface UseGatewayConnectionsOptions {
  affiliation: AffiliationDetails;
  onRefetch: () => Promise<void>;
}

export function useGatewayConnections({ affiliation, onRefetch }: UseGatewayConnectionsOptions) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userConnections, setUserConnections] = useState<Record<string, boolean>>({});
  const [pixAllowed, setPixAllowed] = useState<string[]>([]);
  const [cardAllowed, setCardAllowed] = useState<string[]>([]);
  
  // Seleções do usuário
  const [selectedPixGateway, setSelectedPixGateway] = useState<string>("");
  const [selectedCardGateway, setSelectedCardGateway] = useState<string>("");

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // 1. Buscar configurações de gateway do produto
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("affiliate_gateway_settings")
        .eq("id", affiliation.product?.id)
        .single();

      if (productError) throw productError;

      const settings = productData?.affiliate_gateway_settings as AffiliateGatewaySettings | null;
      
      // Aplicar fallback se não configurado
      const pixGateways = settings?.pix_allowed?.length ? settings.pix_allowed : DEFAULT_PIX_GATEWAYS;
      const cardGateways = settings?.credit_card_allowed?.length ? settings.credit_card_allowed : DEFAULT_CARD_GATEWAYS;
      
      setPixAllowed(pixGateways);
      setCardAllowed(cardGateways);

      // 2. Buscar conexões do usuário
      const { data: profileData } = await supabase
        .from("profiles")
        .select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
        .eq("id", user.id)
        .single();

      const { data: pushinpayData } = await supabase
        .from("payment_gateway_settings")
        .select("pushinpay_account_id, pushinpay_token")
        .eq("user_id", user.id)
        .single();

      const connections: Record<string, boolean> = {
        asaas: !!profileData?.asaas_wallet_id,
        mercadopago: !!profileData?.mercadopago_collector_id,
        stripe: !!profileData?.stripe_account_id,
        pushinpay: !!(pushinpayData?.pushinpay_token && pushinpayData?.pushinpay_account_id),
      };
      setUserConnections(connections);

      // 3. Carregar seleções atuais do afiliado
      if (affiliation.pix_gateway) {
        setSelectedPixGateway(affiliation.pix_gateway);
      }
      if (affiliation.credit_card_gateway) {
        setSelectedCardGateway(affiliation.credit_card_gateway);
      }

    } catch (error: unknown) {
      console.error("Erro ao carregar dados de gateway:", error);
      toast.error("Erro ao carregar configurações de gateway");
    } finally {
      setLoading(false);
    }
  }, [user?.id, affiliation.id, affiliation.product?.id, affiliation.pix_gateway, affiliation.credit_card_gateway]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, loadData]);

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    if (!selectedPixGateway || !selectedCardGateway) {
      toast.error("Selecione 1 gateway PIX e 1 gateway de Cartão");
      return;
    }

    if (!userConnections[selectedPixGateway]) {
      toast.error(`O gateway ${GATEWAY_INFO[selectedPixGateway]?.name || selectedPixGateway} não está conectado`);
      return;
    }

    if (!userConnections[selectedCardGateway]) {
      toast.error(`O gateway ${GATEWAY_INFO[selectedCardGateway]?.name || selectedCardGateway} não está conectado`);
      return;
    }

    setSaving(true);
    try {
      // Buscar credenciais
      const { data: profileData } = await supabase
        .from("profiles")
        .select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
        .eq("id", user.id)
        .single();

      const { data: pushinpayData } = await supabase
        .from("payment_gateway_settings")
        .select("pushinpay_account_id")
        .eq("user_id", user.id)
        .single();

      // Montar credenciais
      const credentials: Record<string, string> = {};
      
      if (selectedPixGateway === "asaas" && profileData?.asaas_wallet_id) {
        credentials.asaas_wallet_id = profileData.asaas_wallet_id;
      }
      if ((selectedPixGateway === "mercadopago" || selectedCardGateway === "mercadopago") && profileData?.mercadopago_collector_id) {
        credentials.mercadopago_collector_id = profileData.mercadopago_collector_id;
      }
      if (selectedPixGateway === "pushinpay" && pushinpayData?.pushinpay_account_id) {
        credentials.pushinpay_account_id = pushinpayData.pushinpay_account_id;
      }
      if (selectedCardGateway === "stripe" && profileData?.stripe_account_id) {
        credentials.stripe_account_id = profileData.stripe_account_id;
      }

      // Atualizar afiliado via Edge Function (PROTOCOLO: Zero bypass direto)
      const { data, error } = await invokeEdgeFunction<{ success: boolean; error?: string }>("update-affiliate-settings", {
        action: "update_gateways",
        affiliate_id: affiliation.id,
        pix_gateway: selectedPixGateway,
        credit_card_gateway: selectedCardGateway,
        gateway_credentials: credentials,
      });

      if (error) throw new Error(error);
      if (!data?.success) throw new Error(data?.error || "Erro ao atualizar gateways");

      toast.success("Gateways configurados com sucesso!");
      await onRefetch();

    } catch (error: unknown) {
      console.error("Erro ao salvar gateways:", error);
      toast.error("Erro ao salvar configuração de gateways");
    } finally {
      setSaving(false);
    }
  };

  // Computed values
  const connectedPixGateways = pixAllowed.filter(g => userConnections[g]);
  const connectedCardGateways = cardAllowed.filter(g => userConnections[g]);
  const hasAnyConnectedGateway = connectedPixGateways.length > 0 || connectedCardGateways.length > 0;
  
  const canSave = selectedPixGateway && 
                  selectedCardGateway && 
                  userConnections[selectedPixGateway] && 
                  userConnections[selectedCardGateway];

  const isFullyConfigured = affiliation.pix_gateway && 
                            affiliation.credit_card_gateway &&
                            userConnections[affiliation.pix_gateway] &&
                            userConnections[affiliation.credit_card_gateway];

  return {
    loading,
    saving,
    userConnections,
    pixAllowed,
    cardAllowed,
    selectedPixGateway,
    setSelectedPixGateway,
    selectedCardGateway,
    setSelectedCardGateway,
    handleSave,
    connectedPixGateways,
    connectedCardGateways,
    hasAnyConnectedGateway,
    canSave,
    isFullyConfigured,
  };
}
