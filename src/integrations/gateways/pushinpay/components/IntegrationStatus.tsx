/**
 * IntegrationStatus - Badge de status de integração ativa
 */

import { CheckCircle2, User } from 'lucide-react';

interface IntegrationStatusProps {
  isActive: boolean;
  accountId: string | null;
}

export function IntegrationStatus({ isActive, accountId }: IntegrationStatusProps) {
  if (!isActive) return null;

  return (
    <div className="rounded-xl border-2 border-green-500/50 bg-green-500/10 p-5">
      <div className="flex items-start gap-4">
        <div className="bg-green-500/20 rounded-lg p-2">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>
            Integração Ativa
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--subtext)' }}>
            Seu checkout está conectado e processando pagamentos PIX via PushinPay.
          </p>
          {accountId && (
            <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
              <User className="h-3.5 w-3.5" />
              <span>ID da Conta: {accountId.substring(0, 8)}...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
