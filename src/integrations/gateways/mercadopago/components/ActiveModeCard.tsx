/**
 * ActiveModeCard Component
 * 
 * Exibe o card do modo atualmente ativo (Produção ou Sandbox).
 */

import { Rocket, FlaskConical } from 'lucide-react';
import type { ConnectionMode, IntegrationData } from '../types';

interface ActiveModeCardProps {
  mode: ConnectionMode;
  integration: IntegrationData | null;
  onDisconnect: () => void;
}

export function ActiveModeCard({ mode, integration, onDisconnect }: ActiveModeCardProps) {
  if (mode === 'none') return null;

  const isProduction = mode === 'production';
  const Icon = isProduction ? Rocket : FlaskConical;
  const colorClass = isProduction ? 'green' : 'yellow';

  return (
    <div
      className={`rounded-xl border-2 p-5 mb-6 border-${colorClass}-500/50 bg-${colorClass}-500/10`}
      style={{
        borderColor: isProduction ? 'rgba(34, 197, 94, 0.5)' : 'rgba(234, 179, 8, 0.5)',
        backgroundColor: isProduction ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="rounded-lg p-2"
          style={{
            backgroundColor: isProduction ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
          }}
        >
          <Icon className={`h-6 w-6 ${isProduction ? 'text-green-500' : 'text-yellow-500'}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>
            {isProduction ? 'Modo Produção Ativo' : 'Modo Sandbox Ativo'}
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--subtext)' }}>
            {isProduction
              ? 'Seu checkout está conectado via OAuth e processando pagamentos reais.'
              : 'Seu checkout está usando credenciais de teste. Pagamentos não são reais.'}
          </p>
          {integration?.email && (
            <p className="text-sm mt-2" style={{ color: 'var(--subtext)' }}>
              <strong>Email:</strong> {integration.email}
            </p>
          )}
        </div>
        <button
          onClick={onDisconnect}
          className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          Desconectar
        </button>
      </div>
    </div>
  );
}
