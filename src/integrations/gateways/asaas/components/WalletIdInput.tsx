/**
 * WalletIdInput - Campo de input para Wallet ID do Asaas
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface WalletIdInputProps {
  walletId: string | undefined;
  onWalletIdChange: (value: string) => void;
  isValidated: boolean;
}

export function WalletIdInput({
  walletId,
  onWalletIdChange,
  isValidated,
}: WalletIdInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="walletId">
        Wallet ID (Account ID)
        <span className="text-muted-foreground ml-1 text-xs">(necessário para split)</span>
      </Label>
      <Input
        id="walletId"
        type="text"
        value={walletId || ''}
        onChange={(e) => onWalletIdChange(e.target.value)}
        placeholder="Ex: 12345678-abcd-1234-efgh-123456789012"
        className="font-mono text-sm"
      />
      <p className="text-xs text-muted-foreground">
        ID da sua conta Asaas. Encontre em{' '}
        <a
          href="https://www.asaas.com/myAccount"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Minha Conta
        </a>
        {' '}→ seção "Dados da conta" → campo "Identificador da conta".
      </p>
      {!walletId && isValidated && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Wallet ID não detectado automaticamente. Insira manualmente para habilitar split.
        </p>
      )}
    </div>
  );
}
