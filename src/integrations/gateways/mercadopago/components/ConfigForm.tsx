/**
 * ConfigForm - Formulário de Configuração do Mercado Pago
 * 
 * @version 4.0.0 - RISE Protocol V3 - SSOT Architecture
 * 
 * SSOT (Single Source of Truth):
 * - O estado de conexão vem do FinanceiroContext via prop connectionStatus
 * - Este componente NÃO faz fetch de dados - apenas renderiza
 * - Os hooks são usados APENAS para ações (connect, disconnect)
 * 
 * Resultado: Zero piscadas, UI estável
 */

import { CreditCard, Info, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import type { GatewayConfigFormProps, GatewayConnectionStatus } from '@/config/gateways/types';

// Hooks - apenas para AÇÕES
import { useMercadoPagoConnection } from '../hooks/useMercadoPagoConnection';
import { useMercadoPagoSandbox } from '../hooks/useMercadoPagoSandbox';

// Components
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { ActiveModeCard } from './ActiveModeCard';
import { ProductionModeCard } from './ProductionModeCard';
import { SandboxModeCard } from './SandboxModeCard';
import { FeedbackMessage } from './FeedbackMessage';

// Types
import type { ConnectionMode, IntegrationData } from '../types';

// ============================================================================
// HELPER: Deriva currentMode e integration do connectionStatus (SSOT)
// ============================================================================

function deriveStateFromConnectionStatus(
  connectionStatus: GatewayConnectionStatus | null | undefined
): { currentMode: ConnectionMode; integration: IntegrationData | null } {
  if (!connectionStatus?.connected) {
    return { currentMode: 'none', integration: null };
  }

  const mode: ConnectionMode = connectionStatus.mode === 'sandbox' ? 'sandbox' : 'production';
  
  return {
    currentMode: mode,
    integration: {
      id: connectionStatus.id,
      mode,
      isTest: connectionStatus.mode === 'sandbox',
    },
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConfigForm({ onConnectionChange, connectionStatus }: GatewayConfigFormProps) {
  const { user } = useAuth();
  const { role } = usePermissions();
  const isAdmin = role === 'admin';

  // Deriva estado do connectionStatus (SSOT do FinanceiroContext)
  const { currentMode, integration } = deriveStateFromConnectionStatus(connectionStatus);

  // Hook de conexão - APENAS para ações, sem estado local
  const {
    connectingOAuth,
    handleConnectOAuth,
    handleDisconnect,
  } = useMercadoPagoConnection({
    userId: user?.id,
    onConnectionChange,
  });

  // Sandbox hook - apenas para ações de sandbox
  const sandbox = useMercadoPagoSandbox({
    userId: user?.id,
    onSuccess: () => {
      onConnectionChange?.();
    },
  });

  // Handler de disconnect que passa o integrationId
  const onDisconnect = async () => {
    await handleDisconnect(integration?.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-cyan-500/20 rounded-xl p-3">
                <CreditCard className="h-8 w-8 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                  Integração Mercado Pago
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--subtext)' }}>
                  PIX, Cartão de Crédito e Boleto
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Refresh button - dispara BACKGROUND_REFRESH via Context */}
              <button
                onClick={() => {
                  toast.info('Atualizando status...');
                  onConnectionChange?.();
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Atualizar status"
              >
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
              </button>
              <ConnectionStatusBadge mode={currentMode} />
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Active mode card */}
          <ActiveModeCard
            mode={currentMode}
            integration={integration}
            onDisconnect={onDisconnect}
          />

          {/* Exclusivity message */}
          {currentMode !== 'none' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed" style={{ color: 'var(--subtext)' }}>
                <strong>Apenas um modo pode estar ativo por vez.</strong> Para trocar de modo,
                desconecte a integração atual primeiro.
              </p>
            </div>
          )}

          {/* Option cards */}
          <div className="grid gap-4">
            <ProductionModeCard
              currentMode={currentMode}
              connectingOAuth={connectingOAuth}
              onConnect={handleConnectOAuth}
            />

            {isAdmin && (
              <SandboxModeCard
                currentMode={currentMode}
                accessToken={sandbox.accessToken}
                setAccessToken={sandbox.setAccessToken}
                publicKey={sandbox.publicKey}
                setPublicKey={sandbox.setPublicKey}
                showToken={sandbox.showToken}
                setShowToken={sandbox.setShowToken}
                showPublicKey={sandbox.showPublicKey}
                setShowPublicKey={sandbox.setShowPublicKey}
                savingSandbox={sandbox.savingSandbox}
                onSave={sandbox.handleSaveSandbox}
              />
            )}
          </div>

          {/* Feedback message */}
          <FeedbackMessage message={sandbox.message} />
        </div>
      </div>
    </div>
  );
}
