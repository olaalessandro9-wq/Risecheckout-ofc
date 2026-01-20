/**
 * Stripe Connection Status Component
 * 
 * @module integrations/gateways/stripe/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Exibe o status de conexão do Stripe com informações da conta.
 */

import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StripeConnectionStatus as StripeStatus } from "../types";

interface ConnectionStatusProps {
  status: StripeStatus | null;
  isLoading: boolean;
  isDisconnecting: boolean;
  onDisconnect: () => void;
}

export function ConnectionStatus({
  status,
  isLoading,
  isDisconnecting,
  onDisconnect,
}: ConnectionStatusProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Verificando conexão...</span>
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <XCircle className="h-5 w-5" />
        <span>Não conectado</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <span className="font-medium text-green-600">Conectado</span>
        <Badge variant={status.livemode ? "default" : "secondary"}>
          {status.livemode ? "Produção" : "Teste"}
        </Badge>
      </div>

      <div className="text-sm text-muted-foreground space-y-1">
        <p>
          <strong>Conta:</strong> {status.account_id}
        </p>
        {status.email ? (
          <p>
            <strong>Email:</strong> {status.email}
          </p>
        ) : (
          <p>
            <strong>Email:</strong>{" "}
            <span className="text-muted-foreground/60 italic">
              Não disponível na conta Stripe
            </span>
          </p>
        )}
        {status.connected_at && (
          <p>
            <strong>Conectado em:</strong>{" "}
            {new Date(status.connected_at).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={onDisconnect}
        disabled={isDisconnecting}
      >
        {isDisconnecting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <XCircle className="h-4 w-4 mr-2" />
        )}
        Desconectar
      </Button>
    </div>
  );
}
