/**
 * ConfigForm - Formulário de Configuração do Mercado Pago (Refatorado)
 * 
 * Componente orquestrador que compõe os sub-componentes:
 * - ConnectionStatusBadge
 * - ActiveModeCard
 * - ProductionModeCard
 * - SandboxModeCard
 * - FeedbackMessage
 * 
 * Hooks:
 * - useMercadoPagoConnection
 * - useMercadoPagoSandbox
 * 
 * @version 3.0.0 - Refatorado para RISE Protocol (<300 linhas)
 */

import { Loader2, CreditCard, Info, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

// Hooks
import { useMercadoPagoConnection } from '../hooks/useMercadoPagoConnection';
import { useMercadoPagoSandbox } from '../hooks/useMercadoPagoSandbox';

// Components
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { ActiveModeCard } from './ActiveModeCard';
import { ProductionModeCard } from './ProductionModeCard';
import { SandboxModeCard } from './SandboxModeCard';
import { FeedbackMessage } from './FeedbackMessage';

interface ConfigFormProps {
  onConnectionChange?: () => void;
}

export function ConfigForm({ onConnectionChange }: ConfigFormProps) {
  const { user } = useAuth();
  const { role } = usePermissions();
  const isAdmin = role === 'admin';

  // Connection hook
  const {
    currentMode,
    integration,
    loading,
    connectingOAuth,
    loadIntegration,
    handleConnectOAuth,
    handleDisconnect,
  } = useMercadoPagoConnection({
    userId: user?.id,
    onConnectionChange,
  });

  // Sandbox hook
  const sandbox = useMercadoPagoSandbox({
    userId: user?.id,
    onSuccess: () => {
      loadIntegration();
      onConnectionChange?.();
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              {/* Refresh button */}
              <button
                onClick={() => {
                  toast.info('Atualizando status...');
                  loadIntegration();
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
            onDisconnect={handleDisconnect}
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
