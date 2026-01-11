/**
 * NoGatewaysConnected Component
 * 
 * Estado vazio quando o afiliado não tem gateways conectados.
 */

import { useNavigate } from "react-router-dom";
import { ExternalLink, Ban, ArrowRight, QrCode, CreditCard, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GATEWAY_INFO, ALL_PIX_GATEWAYS, ALL_CARD_GATEWAYS } from "./gateway-constants";

interface NoGatewaysConnectedProps {
  pixAllowed: string[];
  cardAllowed: string[];
}

export function NoGatewaysConnected({ pixAllowed, cardAllowed }: NoGatewaysConnectedProps) {
  const navigate = useNavigate();

  const goToFinanceiro = () => {
    navigate("/dashboard/financeiro");
  };

  return (
    <div className="space-y-6">
      {/* Mensagem de aviso */}
      <Alert className="border-warning/30 bg-warning/10">
        <AlertCircle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-warning-foreground">
          Você ainda não conectou nenhum gateway de pagamento. Conecte seus gateways em <strong>Financeiro</strong> para poder vender como afiliado.
        </AlertDescription>
      </Alert>

      {/* Card com gateways disponíveis */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gateways Disponíveis
          </CardTitle>
          <CardDescription>
            Para vender como afiliado, você precisa conectar pelo menos 1 gateway PIX e 1 gateway de Cartão.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Seção PIX */}
          <GatewaySection
            title="Gateways PIX"
            icon={<QrCode className="h-4 w-4 text-primary" />}
            gateways={ALL_PIX_GATEWAYS}
            allowedGateways={pixAllowed}
            onConnect={(gateway) => navigate(`/dashboard/financeiro?gateway=${gateway}`)}
          />

          {/* Seção Cartão */}
          <GatewaySection
            title="Gateways de Cartão"
            icon={<CreditCard className="h-4 w-4 text-primary" />}
            gateways={ALL_CARD_GATEWAYS}
            allowedGateways={cardAllowed}
            onConnect={(gateway) => navigate(`/dashboard/financeiro?gateway=${gateway}`)}
          />

          {/* Botão */}
          <div className="flex justify-center pt-4">
            <Button onClick={goToFinanceiro} size="lg" className="gap-2">
              Ir para Financeiro
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface GatewaySectionProps {
  title: string;
  icon: React.ReactNode;
  gateways: readonly string[];
  allowedGateways: string[];
  onConnect: (gateway: string) => void;
}

function GatewaySection({ title, icon, gateways, allowedGateways, onConnect }: GatewaySectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        <span>{title}</span>
      </div>
      <div className="grid gap-2">
        {gateways.map((gatewayId) => {
          const isAllowedByProducer = allowedGateways.includes(gatewayId);
          
          return (
            <div 
              key={gatewayId} 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isAllowedByProducer ? "bg-muted/30" : "bg-muted/10 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${isAllowedByProducer ? "bg-primary" : "bg-muted-foreground"}`} />
                <span className="text-sm font-medium">{GATEWAY_INFO[gatewayId]?.name || gatewayId}</span>
              </div>
              {isAllowedByProducer ? (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onConnect(gatewayId)}
                  className="gap-1"
                >
                  Conectar
                  <ExternalLink className="h-3 w-3" />
                </Button>
              ) : (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                  <Ban className="h-3 w-3 mr-1" />
                  Desabilitado pelo produtor
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
