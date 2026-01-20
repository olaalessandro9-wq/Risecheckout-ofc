/**
 * Stripe ConfigForm - Componente de Configuração
 * 
 * @module integrations/gateways/stripe/components
 * @version 2.0.0 - RISE Protocol V3 Compliant
 * 
 * Orquestra os sub-componentes para configuração do Stripe Connect.
 * Refatorado de 240 linhas para ~100 linhas usando hooks e componentes modularizados.
 */

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useStripeConnectionStatus,
  useStripeConnect,
  useStripeDisconnect,
  useStripeOAuthCallback,
} from "../hooks";
import { ConnectionStatus } from "./ConnectionStatus";
import { ConnectButton } from "./ConnectButton";
import { InfoCard } from "./InfoCard";
import type { GatewayConfigFormProps } from "@/config/gateways";

export function ConfigForm({ onConnectionChange }: GatewayConfigFormProps) {
  // Hooks
  const { status, isLoading, refetch } = useStripeConnectionStatus();
  const { connect, isConnecting } = useStripeConnect();
  const { disconnect, isDisconnecting } = useStripeDisconnect();

  // Handle OAuth callback
  useStripeOAuthCallback(
    () => {
      refetch();
      onConnectionChange?.();
    },
    () => {
      // Error already handled by hook via toast
    }
  );

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar sua conta Stripe?")) {
      return;
    }

    const result = await disconnect();
    if (result.success) {
      refetch();
      onConnectionChange?.();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Status da Conexão</CardTitle>
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {status?.connected ? (
            <ConnectionStatus
              status={status}
              isLoading={false}
              isDisconnecting={isDisconnecting}
              onDisconnect={handleDisconnect}
            />
          ) : (
            <div className="space-y-4">
              <ConnectionStatus
                status={status}
                isLoading={false}
                isDisconnecting={false}
                onDisconnect={() => {}}
              />
              <ConnectButton isConnecting={isConnecting} onConnect={connect} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <InfoCard />
    </div>
  );
}

export default ConfigForm;
