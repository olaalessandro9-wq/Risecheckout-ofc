/**
 * GatewaysTab - Aba de visualização de gateways para afiliados
 * 
 * Mostra quais gateways o afiliado tem conectados (via Financeiro)
 * vs quais são permitidos pelo produtor. Não permite seleção aqui.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, QrCode, CreditCard, CheckCircle2, AlertCircle, ExternalLink, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AffiliationDetails } from "@/hooks/useAffiliationDetails";

// Definições de gateways
const GATEWAY_INFO: Record<string, { name: string }> = {
  asaas: { name: "Asaas" },
  mercadopago: { name: "Mercado Pago" },
  pushinpay: { name: "PushinPay" },
  stripe: { name: "Stripe" },
};

interface GatewaysTabProps {
  affiliation: AffiliationDetails;
  onRefetch: () => Promise<void>;
}

interface AffiliateGatewaySettings {
  pix_allowed?: string[];
  credit_card_allowed?: string[];
}

interface GatewayConnection {
  id: string;
  connected: boolean;
  info: { name: string };
}

export function GatewaysTab({ affiliation, onRefetch }: GatewaysTabProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userConnections, setUserConnections] = useState<Record<string, boolean>>({});
  const [affiliateGatewaySettings, setAffiliateGatewaySettings] = useState<AffiliateGatewaySettings | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "error">("pending");

  // Buscar dados do produto (gateways permitidos) e conexões do usuário
  useEffect(() => {
    loadData();
  }, [affiliation.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Buscar configurações de gateway do produto
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("affiliate_gateway_settings")
        .eq("id", affiliation.product?.id)
        .single();

      if (productError) throw productError;

      const settings = (productData?.affiliate_gateway_settings as AffiliateGatewaySettings) || {
        pix_allowed: ["asaas"],
        credit_card_allowed: ["mercadopago", "stripe"],
      };
      setAffiliateGatewaySettings(settings);

      // 2. Buscar conexões do usuário (profiles e payment_gateway_settings)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar perfil
      const { data: profileData } = await supabase
        .from("profiles")
        .select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
        .eq("id", user.id)
        .single();

      // Buscar PushinPay
      const { data: pushinpayData } = await supabase
        .from("payment_gateway_settings")
        .select("pushinpay_account_id, pushinpay_token")
        .eq("user_id", user.id)
        .single();

      // Mapear conexões
      const connections: Record<string, boolean> = {
        asaas: !!profileData?.asaas_wallet_id,
        mercadopago: !!profileData?.mercadopago_collector_id,
        stripe: !!profileData?.stripe_account_id,
        pushinpay: !!(pushinpayData?.pushinpay_token && pushinpayData?.pushinpay_account_id),
      };
      setUserConnections(connections);

      // 3. Sincronizar gateways automaticamente
      await syncGateways(settings, connections, user.id);

    } catch (error) {
      console.error("Erro ao carregar dados de gateway:", error);
      toast.error("Erro ao carregar configurações de gateway");
      setSyncStatus("error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sincroniza automaticamente os gateways do afiliado
   * baseado na intersecção entre permitidos e conectados
   */
  const syncGateways = async (
    settings: AffiliateGatewaySettings, 
    connections: Record<string, boolean>,
    userId: string
  ) => {
    try {
      const pixAllowed = settings.pix_allowed || [];
      const cardAllowed = settings.credit_card_allowed || [];

      // Encontrar primeiro gateway PIX que está conectado E permitido
      const selectedPix = pixAllowed.find(g => connections[g]) || null;
      
      // Encontrar primeiro gateway de Cartão que está conectado E permitido
      const selectedCard = cardAllowed.find(g => connections[g]) || null;

      // Buscar profile para credenciais
      const { data: profileData } = await supabase
        .from("profiles")
        .select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
        .eq("id", userId)
        .single();

      // Buscar PushinPay account_id
      const { data: pushinpayData } = await supabase
        .from("payment_gateway_settings")
        .select("pushinpay_account_id")
        .eq("user_id", userId)
        .single();

      // Montar credenciais baseado nos gateways selecionados
      const credentials: Record<string, string> = {};
      
      if (selectedPix === "asaas" && profileData?.asaas_wallet_id) {
        credentials.asaas_wallet_id = profileData.asaas_wallet_id;
      }
      if ((selectedPix === "mercadopago" || selectedCard === "mercadopago") && profileData?.mercadopago_collector_id) {
        credentials.mercadopago_collector_id = profileData.mercadopago_collector_id;
      }
      if (selectedPix === "pushinpay" && pushinpayData?.pushinpay_account_id) {
        credentials.pushinpay_account_id = pushinpayData.pushinpay_account_id;
      }
      if (selectedCard === "stripe" && profileData?.stripe_account_id) {
        credentials.stripe_account_id = profileData.stripe_account_id;
      }

      // Atualizar afiliado com gateways e credenciais
      const { error } = await supabase
        .from("affiliates")
        .update({
          pix_gateway: selectedPix,
          credit_card_gateway: selectedCard,
          gateway_credentials: credentials,
          updated_at: new Date().toISOString(),
        })
        .eq("id", affiliation.id);

      if (error) throw error;
      
      setSyncStatus("synced");
    } catch (error) {
      console.error("Erro ao sincronizar gateways:", error);
      setSyncStatus("error");
    }
  };

  const goToFinanceiro = () => {
    navigate("/dashboard/financeiro");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pixAllowed = affiliateGatewaySettings?.pix_allowed || [];
  const cardAllowed = affiliateGatewaySettings?.credit_card_allowed || [];

  if (pixAllowed.length === 0 && cardAllowed.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Gateways não configurados</h3>
        <p className="text-muted-foreground">
          O produtor ainda não configurou os gateways disponíveis para afiliados.
        </p>
      </div>
    );
  }

  // Verificar se tem pelo menos um gateway conectado que seja permitido
  const hasConnectedPixGateway = pixAllowed.some(g => userConnections[g]);
  const hasConnectedCardGateway = cardAllowed.some(g => userConnections[g]);
  const isFullyConfigured = hasConnectedPixGateway && hasConnectedCardGateway;

  const renderGatewayList = (gateways: string[], type: "pix" | "card") => {
    return gateways.map((gatewayId) => {
      const info = GATEWAY_INFO[gatewayId];
      if (!info) return null;

      const isConnected = userConnections[gatewayId];

      return (
        <div
          key={gatewayId}
          className={`flex items-center justify-between rounded-lg border p-4 ${
            isConnected 
              ? "bg-green-100/80 border-green-300 dark:bg-green-900/40 dark:border-green-600" 
              : "bg-muted/50 border-border"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-muted-foreground/40"}`} />
            <p className="font-medium text-sm text-foreground">{info.name}</p>
          </div>
          
          {isConnected ? (
            <Badge variant="outline" className="bg-green-200 text-green-800 border-green-400 dark:bg-green-800/60 dark:text-green-200 dark:border-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-200 text-amber-800 border-amber-400 dark:bg-amber-800/60 dark:text-amber-200 dark:border-amber-500">
              <AlertCircle className="h-3 w-3 mr-1" />
              Não conectado
            </Badge>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Status geral */}
      {isFullyConfigured ? (
        <Alert className="border-green-300 bg-green-100/80 dark:border-green-600 dark:bg-green-900/40">
          <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-300" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Todos os gateways necessários estão conectados. Você está pronto para vender!
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-amber-300 bg-amber-100/80 dark:border-amber-600 dark:bg-amber-900/40">
          <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Você precisa conectar os gateways em <strong>Financeiro</strong> para poder vender como afiliado.
          </AlertDescription>
        </Alert>
      )}

      {/* PIX Gateways */}
      {pixAllowed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Gateways PIX Permitidos</CardTitle>
              </div>
              {hasConnectedPixGateway && (
                <Badge variant="outline" className="bg-green-200 text-green-800 border-green-400 dark:bg-green-800/60 dark:text-green-200 dark:border-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  OK
                </Badge>
              )}
            </div>
            <CardDescription>
              Gateways que o produtor permite para pagamentos PIX
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderGatewayList(pixAllowed, "pix")}
          </CardContent>
        </Card>
      )}

      {/* Credit Card Gateways */}
      {cardAllowed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Gateways de Cartão Permitidos</CardTitle>
              </div>
              {hasConnectedCardGateway && (
                <Badge variant="outline" className="bg-green-200 text-green-800 border-green-400 dark:bg-green-800/60 dark:text-green-200 dark:border-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  OK
                </Badge>
              )}
            </div>
            <CardDescription>
              Gateways que o produtor permite para pagamentos com cartão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderGatewayList(cardAllowed, "card")}
          </CardContent>
        </Card>
      )}

      {/* Botão para ir ao Financeiro */}
      {!isFullyConfigured && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={goToFinanceiro} 
            size="lg"
            className="gap-2"
          >
            Ir para Financeiro
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Info sobre sincronização */}
      <div className="text-center text-xs text-muted-foreground pt-2">
        {syncStatus === "synced" && (
          <span className="flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            Gateways sincronizados automaticamente
          </span>
        )}
        {syncStatus === "error" && (
          <span className="flex items-center justify-center gap-1 text-amber-600">
            <AlertCircle className="h-3 w-3" />
            Erro ao sincronizar - tente recarregar a página
          </span>
        )}
      </div>
    </div>
  );
}
