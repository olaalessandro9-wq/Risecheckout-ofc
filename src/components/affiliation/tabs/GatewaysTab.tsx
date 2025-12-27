/**
 * GatewaysTab - Seleção de gateways pelo afiliado
 * 
 * MVP: Afiliado DEVE escolher 1 gateway PIX e 1 gateway Cartão
 * para liberar os links de afiliação.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, QrCode, CreditCard, CheckCircle2, AlertCircle, ArrowRight, Save } from "lucide-react";
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

// Fallback padrão quando produtor não configurou
const DEFAULT_PIX_GATEWAYS = ["asaas", "mercadopago", "pushinpay"];
const DEFAULT_CARD_GATEWAYS = ["mercadopago", "stripe"];

interface GatewaysTabProps {
  affiliation: AffiliationDetails;
  onRefetch: () => Promise<void>;
}

interface AffiliateGatewaySettings {
  pix_allowed?: string[];
  credit_card_allowed?: string[];
}

export function GatewaysTab({ affiliation, onRefetch }: GatewaysTabProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userConnections, setUserConnections] = useState<Record<string, boolean>>({});
  const [pixAllowed, setPixAllowed] = useState<string[]>([]);
  const [cardAllowed, setCardAllowed] = useState<string[]>([]);
  
  // Seleções do usuário
  const [selectedPixGateway, setSelectedPixGateway] = useState<string>("");
  const [selectedCardGateway, setSelectedCardGateway] = useState<string>("");

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

      const settings = productData?.affiliate_gateway_settings as AffiliateGatewaySettings | null;
      
      // Aplicar fallback se não configurado
      const pixGateways = settings?.pix_allowed?.length ? settings.pix_allowed : DEFAULT_PIX_GATEWAYS;
      const cardGateways = settings?.credit_card_allowed?.length ? settings.credit_card_allowed : DEFAULT_CARD_GATEWAYS;
      
      setPixAllowed(pixGateways);
      setCardAllowed(cardGateways);

      // 2. Buscar conexões do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

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

    } catch (error) {
      console.error("Erro ao carregar dados de gateway:", error);
      toast.error("Erro ao carregar configurações de gateway");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

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

      // Atualizar afiliado
      const { error } = await supabase
        .from("affiliates")
        .update({
          pix_gateway: selectedPixGateway,
          credit_card_gateway: selectedCardGateway,
          gateway_credentials: credentials,
          updated_at: new Date().toISOString(),
        })
        .eq("id", affiliation.id);

      if (error) throw error;

      toast.success("Gateways configurados com sucesso!");
      await onRefetch();

    } catch (error) {
      console.error("Erro ao salvar gateways:", error);
      toast.error("Erro ao salvar configuração de gateways");
    } finally {
      setSaving(false);
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

  // Verificar se tem gateways conectados
  const connectedPixGateways = pixAllowed.filter(g => userConnections[g]);
  const connectedCardGateways = cardAllowed.filter(g => userConnections[g]);
  const hasAnyConnectedGateway = connectedPixGateways.length > 0 || connectedCardGateways.length > 0;
  
  // Validação para salvar
  const canSave = selectedPixGateway && 
                  selectedCardGateway && 
                  userConnections[selectedPixGateway] && 
                  userConnections[selectedCardGateway];

  // Status de configuração completa
  const isFullyConfigured = affiliation.pix_gateway && 
                            affiliation.credit_card_gateway &&
                            userConnections[affiliation.pix_gateway] &&
                            userConnections[affiliation.credit_card_gateway];

  // Se não tem nenhum gateway conectado
  if (!hasAnyConnectedGateway) {
    return (
      <div className="space-y-6">
        <Alert className="border-warning/30 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-foreground">
            Você ainda não conectou nenhum gateway de pagamento. Conecte seus gateways em <strong>Financeiro</strong> para poder vender como afiliado.
          </AlertDescription>
        </Alert>

        <div className="bg-card border rounded-lg p-8 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum gateway conectado</h3>
          <p className="text-muted-foreground mb-6">
            Para vender como afiliado, você precisa conectar pelo menos 1 gateway PIX e 1 gateway de Cartão.
          </p>
          <Button onClick={goToFinanceiro} size="lg" className="gap-2">
            Ir para Financeiro
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status geral */}
      {isFullyConfigured ? (
        <Alert className="border-success/30 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success-foreground">
            Gateways configurados! Seus links de afiliação estão liberados.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-warning/30 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-foreground">
            Selecione <strong>1 gateway PIX</strong> e <strong>1 gateway de Cartão</strong> para liberar seus links.
          </AlertDescription>
        </Alert>
      )}

      {/* Seleção PIX */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Selecione seu Gateway PIX</CardTitle>
          </div>
          <CardDescription>
            Escolha qual gateway será usado para pagamentos via PIX
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedPixGateway}
            onValueChange={setSelectedPixGateway}
            className="space-y-3"
          >
            {pixAllowed.map((gatewayId) => {
              const info = GATEWAY_INFO[gatewayId];
              if (!info) return null;

              const isConnected = userConnections[gatewayId];

              return (
                <div
                  key={gatewayId}
                  className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                    selectedPixGateway === gatewayId
                      ? "border-primary bg-primary/5"
                      : isConnected
                      ? "border-border hover:border-primary/50"
                      : "border-border bg-muted/30 opacity-60"
                  }`}
                >
                  <RadioGroupItem
                    value={gatewayId}
                    id={`pix-${gatewayId}`}
                    disabled={!isConnected}
                  />
                  <Label
                    htmlFor={`pix-${gatewayId}`}
                    className={`flex-1 flex items-center justify-between cursor-pointer ${
                      !isConnected ? "cursor-not-allowed" : ""
                    }`}
                  >
                    <span className="font-medium">{info.name}</span>
                    {isConnected ? (
                      <Badge variant="outline" className="bg-success/20 text-success-foreground border-success/40">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Conectado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Não conectado
                      </Badge>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
          
          {connectedPixGateways.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              Nenhum gateway PIX conectado. <button onClick={goToFinanceiro} className="text-primary hover:underline">Conecte no Financeiro</button>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Seleção Cartão */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Selecione seu Gateway de Cartão</CardTitle>
          </div>
          <CardDescription>
            Escolha qual gateway será usado para pagamentos com cartão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedCardGateway}
            onValueChange={setSelectedCardGateway}
            className="space-y-3"
          >
            {cardAllowed.map((gatewayId) => {
              const info = GATEWAY_INFO[gatewayId];
              if (!info) return null;

              const isConnected = userConnections[gatewayId];

              return (
                <div
                  key={gatewayId}
                  className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                    selectedCardGateway === gatewayId
                      ? "border-primary bg-primary/5"
                      : isConnected
                      ? "border-border hover:border-primary/50"
                      : "border-border bg-muted/30 opacity-60"
                  }`}
                >
                  <RadioGroupItem
                    value={gatewayId}
                    id={`card-${gatewayId}`}
                    disabled={!isConnected}
                  />
                  <Label
                    htmlFor={`card-${gatewayId}`}
                    className={`flex-1 flex items-center justify-between cursor-pointer ${
                      !isConnected ? "cursor-not-allowed" : ""
                    }`}
                  >
                    <span className="font-medium">{info.name}</span>
                    {isConnected ? (
                      <Badge variant="outline" className="bg-success/20 text-success-foreground border-success/40">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Conectado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Não conectado
                      </Badge>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
          
          {connectedCardGateways.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              Nenhum gateway de cartão conectado. <button onClick={goToFinanceiro} className="text-primary hover:underline">Conecte no Financeiro</button>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={!canSave || saving}
          size="lg"
          className="gap-2 w-full sm:w-auto"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Configuração
        </Button>
        
        {!canSave && (
          <p className="text-sm text-muted-foreground text-center">
            Selecione 1 gateway PIX e 1 gateway de Cartão conectados para salvar
          </p>
        )}
      </div>

      {/* Link para Financeiro */}
      {(connectedPixGateways.length === 0 || connectedCardGateways.length === 0) && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={goToFinanceiro} className="gap-2">
            Conectar mais gateways
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
