/**
 * ProductionModeCard Component
 * 
 * Card para conectar via OAuth (modo produção).
 */

import { Loader2, ExternalLink, Rocket } from 'lucide-react';
import type { ConnectionMode } from '../types';

interface ProductionModeCardProps {
  currentMode: ConnectionMode;
  connectingOAuth: boolean;
  onConnect: () => void;
}

export function ProductionModeCard({
  currentMode,
  connectingOAuth,
  onConnect,
}: ProductionModeCardProps) {
  const isDisabled = currentMode === 'sandbox';
  const isActive = currentMode === 'production';

  return (
    <div
      className={`rounded-xl border-2 p-5 transition-all ${
        currentMode === 'none'
          ? 'border-border hover:border-green-500/50 cursor-pointer'
          : isActive
          ? 'border-green-500/50 bg-green-500/5'
          : 'border-border opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="bg-green-500/20 rounded-lg p-2">
          <Rocket className="h-6 w-6 text-green-500" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
            🚀 Produção (OAuth)
          </h4>
          <p className="text-sm mb-4" style={{ color: 'var(--subtext)' }}>
            Conecte sua conta real do Mercado Pago via login seguro. Recomendado para
            receber pagamentos reais.
          </p>

          {currentMode === 'none' && (
            <button
              onClick={onConnect}
              disabled={connectingOAuth}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
            >
              {connectingOAuth ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  <span>Conectar com Mercado Pago</span>
                </>
              )}
            </button>
          )}

          {isDisabled && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ Desconecte o Sandbox para usar Produção
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
