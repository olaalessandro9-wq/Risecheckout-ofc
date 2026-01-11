/**
 * GatewaysTab - Seleção de gateways pelo afiliado (REFATORADO)
 * 
 * MVP: Afiliado DEVE escolher 1 gateway PIX e 1 gateway Cartão
 * para liberar os links de afiliação.
 * 
 * Arquitetura modular:
 * - useGatewayConnections: Hook com lógica de conexões e salvamento
 * - GatewaySelector: Componente reutilizável para seleção
 * - NoGatewaysConnected: Estado vazio
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, QrCode, CreditCard, CheckCircle2, AlertCircle, ArrowRight, Save } from "lucide-react";
import type { AffiliationDetails } from "@/hooks/useAffiliationDetails";

import {
  useGatewayConnections,
  GatewaySelector,
  NoGatewaysConnected,
  ALL_PIX_GATEWAYS,
  ALL_CARD_GATEWAYS,
} from "./gateways";

interface GatewaysTabProps {
  affiliation: AffiliationDetails;
  onRefetch: () => Promise<void>;
}

export function GatewaysTab({ affiliation, onRefetch }: GatewaysTabProps) {
  const navigate = useNavigate();
  
  const {
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
  } = useGatewayConnections({ affiliation, onRefetch });

  const goToFinanceiro = () => navigate("/dashboard/financeiro");

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Se não tem nenhum gateway conectado
  if (!hasAnyConnectedGateway) {
    return <NoGatewaysConnected pixAllowed={pixAllowed} cardAllowed={cardAllowed} />;
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
          <GatewaySelector
            type="pix"
            gateways={ALL_PIX_GATEWAYS}
            allowedGateways={pixAllowed}
            userConnections={userConnections}
            selectedGateway={selectedPixGateway}
            onSelect={setSelectedPixGateway}
          />
          
          {connectedPixGateways.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              Nenhum gateway PIX conectado.{" "}
              <button onClick={goToFinanceiro} className="text-primary hover:underline">
                Conecte no Financeiro
              </button>
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
          <GatewaySelector
            type="card"
            gateways={ALL_CARD_GATEWAYS}
            allowedGateways={cardAllowed}
            userConnections={userConnections}
            selectedGateway={selectedCardGateway}
            onSelect={setSelectedCardGateway}
          />
          
          {connectedCardGateways.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              Nenhum gateway de cartão conectado.{" "}
              <button onClick={goToFinanceiro} className="text-primary hover:underline">
                Conecte no Financeiro
              </button>
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
