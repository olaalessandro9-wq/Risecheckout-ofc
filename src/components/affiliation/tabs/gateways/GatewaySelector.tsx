/**
 * GatewaySelector Component
 * 
 * Componente reutilizável para seleção de gateway (PIX ou Cartão).
 */

import { Ban, CheckCircle2, AlertCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GATEWAY_INFO } from "./gateway-constants";

interface GatewaySelectorProps {
  type: "pix" | "card";
  gateways: readonly string[];
  allowedGateways: string[];
  userConnections: Record<string, boolean>;
  selectedGateway: string;
  onSelect: (gateway: string) => void;
}

export function GatewaySelector({
  type,
  gateways,
  allowedGateways,
  userConnections,
  selectedGateway,
  onSelect,
}: GatewaySelectorProps) {
  const prefix = type === "pix" ? "pix" : "card";

  return (
    <RadioGroup
      value={selectedGateway}
      onValueChange={onSelect}
      className="space-y-3"
    >
      {gateways.map((gatewayId) => {
        const info = GATEWAY_INFO[gatewayId];
        if (!info) return null;

        const isConnected = userConnections[gatewayId];
        const isAllowedByProducer = allowedGateways.includes(gatewayId);
        const isDisabled = !isAllowedByProducer || !isConnected;

        return (
          <div
            key={gatewayId}
            className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
              !isAllowedByProducer
                ? "border-destructive/20 bg-destructive/5 opacity-60"
                : selectedGateway === gatewayId
                ? "border-primary bg-primary/5"
                : isConnected
                ? "border-border hover:border-primary/50"
                : "border-border bg-muted/30 opacity-60"
            }`}
          >
            <RadioGroupItem
              value={gatewayId}
              id={`${prefix}-${gatewayId}`}
              disabled={isDisabled}
            />
            <Label
              htmlFor={`${prefix}-${gatewayId}`}
              className={`flex-1 flex items-center justify-between cursor-pointer ${
                isDisabled ? "cursor-not-allowed" : ""
              }`}
            >
              <span className="font-medium">{info.name}</span>
              <GatewayStatusBadge
                isAllowedByProducer={isAllowedByProducer}
                isConnected={isConnected}
              />
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}

interface GatewayStatusBadgeProps {
  isAllowedByProducer: boolean;
  isConnected: boolean;
}

function GatewayStatusBadge({ isAllowedByProducer, isConnected }: GatewayStatusBadgeProps) {
  if (!isAllowedByProducer) {
    return (
      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
        <Ban className="h-3 w-3 mr-1" />
        Desabilitado pelo produtor
      </Badge>
    );
  }

  if (isConnected) {
    return (
      <Badge variant="outline" className="bg-success/20 text-success-foreground border-success/40">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Conectado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
      <AlertCircle className="h-3 w-3 mr-1" />
      Não conectado
    </Badge>
  );
}
