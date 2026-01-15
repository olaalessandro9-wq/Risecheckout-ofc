/**
 * AccountInfoCard - Card com informações da conta validada
 */

import { User } from 'lucide-react';
import type { PushinPayAccountInfo } from '../types';

interface AccountInfoCardProps {
  accountInfo: PushinPayAccountInfo | null;
}

export function AccountInfoCard({ accountInfo }: AccountInfoCardProps) {
  if (!accountInfo) return null;

  return (
    <div className="rounded-xl border-2 border-blue-500/50 bg-blue-500/10 p-5">
      <div className="flex items-start gap-4">
        <div className="bg-blue-500/20 rounded-lg p-2">
          <User className="h-6 w-6 text-blue-500" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
            {accountInfo.name}
          </h4>
          <p className="text-sm" style={{ color: 'var(--subtext)' }}>
            {accountInfo.email}
          </p>
          <p className="text-xs opacity-60 mt-1">
            ID: {accountInfo.id}
          </p>
        </div>
      </div>
    </div>
  );
}
