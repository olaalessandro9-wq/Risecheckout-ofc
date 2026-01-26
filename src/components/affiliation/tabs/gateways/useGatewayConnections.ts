/**
 * useGatewayConnections Hook
 * 
 * Gerencia o estado de conexões de gateway do usuário e configurações do produto.
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
 */

import { useState, useEffect, useCallback } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DEFAULT_PIX_GATEWAYS, DEFAULT_CARD_GATEWAYS, GATEWAY_INFO } from "./gateway-constants";
import type { AffiliationDetails } from "@/hooks/useAffiliationDetails";
import { createLogger } from "@/lib/logger";

const log = createLogger("UseGatewayConnections");

interface GatewayConnectionsResponse {
  connections?: Record<string, boolean>;
  credentials?: Record<string, string>;
  productSettings?: AffiliateGatewaySettings | null;
  error?: string;
}

interface AffiliateGatewaySettings {
  pix_allowed?: string[];
  credit_card_allowed?: string[];
}

interface UseGatewayConnectionsOptions {
  affiliation: AffiliationDetails;
  onRefetch: () => Promise<void>;
}

export function useGatewayConnections({ affiliation, onRefetch }: UseGatewayConnectionsOptions) {
  const { user } = useUnifiedAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userConnections, setUserConnections] = useState<Record<string, boolean>>({});
  const [pixAllowed, setPixAllowed] = useState<string[]>([]);
  const [cardAllowed, setCardAllowed] = useState<string[]>([]);
  
  // Seleções do usuário
  const [selectedPixGateway, setSelectedPixGateway] = useState<string>("");
  const [selectedCardGateway, setSelectedCardGateway] = useState<string>("");

  /**
   * Load gateway connections via Edge Function
   * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
   */
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await api.call<GatewayConnectionsResponse>("admin-data", {
        action: "gateway-connections",
        affiliationProductId: affiliation.product?.id,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const settings = data?.productSettings as AffiliateGatewaySettings | null;
      
      // Aplicar fallback se não configurado
      const pixGateways = settings?.pix_allowed?.length ? settings.pix_allowed : DEFAULT_PIX_GATEWAYS;
      const cardGateways = settings?.credit_card_allowed?.length ? settings.credit_card_allowed : DEFAULT_CARD_GATEWAYS;
      
      setPixAllowed(pixGateways);
      setCardAllowed(cardGateways);
      setUserConnections(data?.connections || {});

      // Carregar seleções atuais do afiliado
      if (affiliation.pix_gateway) {
        setSelectedPixGateway(affiliation.pix_gateway);
      }
      if (affiliation.credit_card_gateway) {
        setSelectedCardGateway(affiliation.credit_card_gateway);
      }

    } catch (error: unknown) {
      log.error("Erro ao carregar dados de gateway:", error);
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
      // RISE V3 Solution D: gateway_credentials REMOVED
      // Affiliates inherit credentials from their own profile (Settings > Integrações)
      // We only update which gateways the affiliate selected

      // Atualizar afiliado via Edge Function (PROTOCOLO: Zero bypass direto)
      const { data, error } = await api.call<{ success: boolean; error?: string }>("update-affiliate-settings", {
        action: "update_gateways",
        affiliate_id: affiliation.id,
        pix_gateway: selectedPixGateway,
        credit_card_gateway: selectedCardGateway,
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Erro ao atualizar gateways");

      toast.success("Gateways configurados com sucesso!");
      await onRefetch();

    } catch (error: unknown) {
      log.error("Erro ao salvar gateways:", error);
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
