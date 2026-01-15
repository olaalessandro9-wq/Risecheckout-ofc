/**
 * ConnectionStatus - Badge de status de conexão do Asaas
 */

import { CheckCircle2 } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  if (!isConnected) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
      <CheckCircle2 className="h-4 w-4" />
      <span>Asaas conectado e ativo</span>
    </div>
  );
}
