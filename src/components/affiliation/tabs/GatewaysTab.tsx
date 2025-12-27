/**
 * GatewaysTab - Aba de configuração de gateways para afiliados
 * 
 * Permite ao afiliado escolher qual gateway usar para PIX e Cartão
 * dentre os permitidos pelo Owner do produto.
 */

import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, CreditCard, CheckCircle2, AlertCircle, Link2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AffiliationDetails } from "@/hooks/useAffiliationDetails";

// Definições de gateways
const GATEWAY_INFO: Record<string, { name: string; description: string; connectUrl?: string }> = {
  asaas: { 
    name: "Asaas", 
    description: "Split automático para afiliados",
    connectUrl: "/dashboard/financeiro" 
  },
  mercadopago: { 
    name: "Mercado Pago", 
    description: "Gateway popular no Brasil",
    connectUrl: "/dashboard/financeiro" 
  },
  pushinpay: { 
    name: "PushinPay", 
    description: "Gateway especializado em PIX",
    connectUrl: "/dashboard/financeiro"
  },
  stripe: { 
    name: "Stripe", 
    description: "Padrão internacional",
    connectUrl: "/dashboard/financeiro" 
  },
};

interface GatewaysTabProps {
  affiliation: AffiliationDetails;
  onRefetch: () => Promise<void>;
}

interface AffiliateGatewaySettings {
  pix_allowed?: string[];
  credit_card_allowed?: string[];
  require_gateway_connection?: boolean;
}

interface AffiliateGatewayCredentials {
  asaas_wallet_id?: string;
  mercadopago_collector_id?: string;
  stripe_account_id?: string;
}

export function GatewaysTab({ affiliation, onRefetch }: GatewaysTabProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPixGateway, setSelectedPixGateway] = useState<string>("");
  const [selectedCardGateway, setSelectedCardGateway] = useState<string>("");
  const [userProfile, setUserProfile] = useState<{
    asaas_wallet_id?: string | null;
    mercadopago_collector_id?: string | null;
    stripe_account_id?: string | null;
  } | null>(null);
  const [affiliateGatewaySettings, setAffiliateGatewaySettings] = useState<AffiliateGatewaySettings | null>(null);
  const [currentCredentials, setCurrentCredentials] = useState<AffiliateGatewayCredentials>({});

  // Buscar dados do produto (gateways permitidos) e perfil do usuário
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
        require_gateway_connection: true,
      };
      setAffiliateGatewaySettings(settings);

      // 2. Buscar perfil do usuário (para ver conexões existentes)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
          .eq("id", user.id)
          .single();

        setUserProfile(profileData);
      }

      // 3. Buscar gateways escolhidos pelo afiliado
      const { data: affiliateData, error: affiliateError } = await supabase
        .from("affiliates")
        .select("pix_gateway, credit_card_gateway, gateway_credentials")
        .eq("id", affiliation.id)
        .single();

      if (!affiliateError && affiliateData) {
        setSelectedPixGateway(affiliateData.pix_gateway || "");
        setSelectedCardGateway(affiliateData.credit_card_gateway || "");
        setCurrentCredentials((affiliateData.gateway_credentials as AffiliateGatewayCredentials) || {});
      }

    } catch (error) {
      console.error("Erro ao carregar dados de gateway:", error);
      toast.error("Erro ao carregar configurações de gateway");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validar se tem pelo menos um gateway selecionado
    if (!selectedPixGateway && !selectedCardGateway) {
      toast.error("Selecione pelo menos um gateway para continuar");
      return;
    }

    // Validar conexões se necessário
    if (affiliateGatewaySettings?.require_gateway_connection) {
      const pixConnected = selectedPixGateway ? isGatewayConnected(selectedPixGateway) : true;
      const cardConnected = selectedCardGateway ? isGatewayConnected(selectedCardGateway) : true;

      if (selectedPixGateway && !pixConnected) {
        toast.error(`Conecte sua conta ${GATEWAY_INFO[selectedPixGateway]?.name} antes de salvar`);
        return;
      }
      if (selectedCardGateway && !cardConnected) {
        toast.error(`Conecte sua conta ${GATEWAY_INFO[selectedCardGateway]?.name} antes de salvar`);
        return;
      }
    }

    setSaving(true);
    try {
      // Preparar credenciais como Record<string, string> para compatibilidade com Json
      const credentials: Record<string, string> = {};
      if (selectedPixGateway === "asaas" && userProfile?.asaas_wallet_id) {
        credentials.asaas_wallet_id = userProfile.asaas_wallet_id;
      }
      if ((selectedPixGateway === "mercadopago" || selectedCardGateway === "mercadopago") && userProfile?.mercadopago_collector_id) {
        credentials.mercadopago_collector_id = userProfile.mercadopago_collector_id;
      }
      if (selectedCardGateway === "stripe" && userProfile?.stripe_account_id) {
        credentials.stripe_account_id = userProfile.stripe_account_id;
      }

      const { error } = await supabase
        .from("affiliates")
        .update({
          pix_gateway: selectedPixGateway || null,
          credit_card_gateway: selectedCardGateway || null,
          gateway_credentials: JSON.parse(JSON.stringify(credentials)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", affiliation.id);

      if (error) throw error;

      setCurrentCredentials(credentials);
      toast.success("Gateways salvos com sucesso!");
      await onRefetch();
    } catch (error) {
      console.error("Erro ao salvar gateways:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const isGatewayConnected = (gatewayId: string): boolean => {
    if (!userProfile) return false;
    switch (gatewayId) {
      case "asaas":
        return !!userProfile.asaas_wallet_id;
      case "mercadopago":
        return !!userProfile.mercadopago_collector_id;
      case "stripe":
        return !!userProfile.stripe_account_id;
      case "pushinpay":
        // PushinPay usa credenciais de plataforma, não precisa conexão individual
        return true;
      default:
        return false;
    }
  };

  const getConnectionStatus = (gatewayId: string) => {
    const connected = isGatewayConnected(gatewayId);
    return connected ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Conectado
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Não conectado
      </Badge>
    );
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

  return (
    <div className="space-y-6">
      {/* PIX Gateways */}
      {pixAllowed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Gateway PIX</CardTitle>
            </div>
            <CardDescription>
              Escolha qual gateway usar para pagamentos PIX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedPixGateway}
              onValueChange={setSelectedPixGateway}
              className="grid gap-3"
            >
              {pixAllowed.map((gatewayId) => {
                const info = GATEWAY_INFO[gatewayId];
                if (!info) return null;

                return (
                  <div
                    key={gatewayId}
                    className="flex items-center justify-between rounded-md border p-3 bg-background"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={gatewayId} id={`pix-${gatewayId}`} />
                      <div>
                        <Label htmlFor={`pix-${gatewayId}`} className="cursor-pointer font-medium">
                          {info.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getConnectionStatus(gatewayId)}
                      {!isGatewayConnected(gatewayId) && gatewayId !== "pushinpay" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(info.connectUrl, "_blank")}
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          Conectar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Credit Card Gateways */}
      {cardAllowed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Gateway de Cartão</CardTitle>
            </div>
            <CardDescription>
              Escolha qual gateway usar para pagamentos com cartão de crédito
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedCardGateway}
              onValueChange={setSelectedCardGateway}
              className="grid gap-3"
            >
              {cardAllowed.map((gatewayId) => {
                const info = GATEWAY_INFO[gatewayId];
                if (!info) return null;

                return (
                  <div
                    key={gatewayId}
                    className="flex items-center justify-between rounded-md border p-3 bg-background"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={gatewayId} id={`card-${gatewayId}`} />
                      <div>
                        <Label htmlFor={`card-${gatewayId}`} className="cursor-pointer font-medium">
                          {info.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getConnectionStatus(gatewayId)}
                      {!isGatewayConnected(gatewayId) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(info.connectUrl, "_blank")}
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          Conectar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Info about requirement */}
      {affiliateGatewaySettings?.require_gateway_connection && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            O produtor exige que você conecte os gateways antes de poder vender. 
            Acesse <strong>Financeiro</strong> para conectar suas contas.
          </AlertDescription>
        </Alert>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Gateways
        </Button>
      </div>
    </div>
  );
}
