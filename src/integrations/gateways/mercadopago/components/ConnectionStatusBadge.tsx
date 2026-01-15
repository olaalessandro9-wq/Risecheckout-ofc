/**
 * ConnectionStatusBadge Component
 * 
 * Exibe o badge de status da conexão (Produção/Sandbox).
 */

import { CheckCircle2 } from 'lucide-react';
import type { ConnectionMode } from '../types';

interface ConnectionStatusBadgeProps {
  mode: ConnectionMode;
}

export function ConnectionStatusBadge({ mode }: ConnectionStatusBadgeProps) {
  if (mode === 'none') return null;

  const isProduction = mode === 'production';

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
        isProduction
          ? 'bg-green-500/20 border-green-500/30'
          : 'bg-yellow-500/20 border-yellow-500/30'
      }`}
    >
      <CheckCircle2
        className={`h-4 w-4 ${isProduction ? 'text-green-500' : 'text-yellow-500'}`}
      />
      <span
        className={`text-sm font-semibold ${
          isProduction ? 'text-green-500' : 'text-yellow-500'
        }`}
      >
        {isProduction ? 'PRODUÇÃO' : 'SANDBOX'}
      </span>
    </div>
  );
}
