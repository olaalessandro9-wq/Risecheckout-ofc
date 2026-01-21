/**
 * Stripe ConfigForm - Componente de Configuração
 * 
 * @module integrations/gateways/stripe/components
 * @version 3.0.0 - RISE Protocol V3 - SSOT Architecture
 * 
 * SSOT (Single Source of Truth):
 * - O estado de conexão vem do FinanceiroContext via prop connectionStatus
 * - Este componente NÃO faz fetch de dados - apenas renderiza
 * - Os hooks são usados APENAS para ações (connect, disconnect)
 * 
 * Resultado: Zero piscadas, UI estável
 */

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import {
  useStripeConnect,
  useStripeDisconnect,
  useStripeOAuthCallback,
} from "../hooks";
import { ConnectionStatus } from "./ConnectionStatus";
import { ConnectButton } from "./ConnectButton";
import { InfoCard } from "./InfoCard";
import type { GatewayConfigFormProps, GatewayConnectionStatus } from "@/config/gateways/types";
import type { StripeConnectionStatus } from "../types";

// ============================================================================
// HELPER: Deriva StripeConnectionStatus do GatewayConnectionStatus (SSOT)
// ============================================================================

function deriveStripeStatus(
  connectionStatus: GatewayConnectionStatus | null | undefined
): StripeConnectionStatus {
  if (!connectionStatus?.connected) {
    return {
      connected: false,
      account_id: null,
      email: null,
      livemode: null,
      connected_at: null,
    };
  }

  // Extrai detalhes do connectionStatus (vem do backend via vendor-integrations-status)
  const details = (connectionStatus as { details?: Record<string, unknown> }).details;
  
  return {
    connected: true,
    account_id: (details?.account_id as string) ?? null,
    email: (details?.email as string) ?? null,
    livemode: connectionStatus.mode === 'production',
    connected_at: connectionStatus.lastConnectedAt ?? null,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConfigForm({ onConnectionChange, connectionStatus }: GatewayConfigFormProps) {
  // Deriva estado do connectionStatus (SSOT do FinanceiroContext)
  const status = deriveStripeStatus(connectionStatus);

  // Hooks apenas para AÇÕES (connect, disconnect)
  const { connect, isConnecting } = useStripeConnect();
  const { disconnect, isDisconnecting } = useStripeDisconnect();

  // Handle OAuth callback
  useStripeOAuthCallback(
    () => {
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
      onConnectionChange?.();
    }
  };

  // Handle refresh - dispara BACKGROUND_REFRESH via Context
  const handleRefresh = () => {
    toast.info('Atualizando status...');
    onConnectionChange?.();
  };

  return (
    <div className="space-y-6 py-4">
      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Status da Conexão</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {status.connected ? (
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
