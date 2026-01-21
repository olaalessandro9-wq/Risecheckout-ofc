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
  // Validação de formato UUID em tempo real
  const isValidFormat = !walletId || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(walletId);

  return (
    <div className="space-y-2">
      <Label htmlFor="walletId">
        Wallet ID (Account ID)
        <span className="text-destructive ml-1">*</span>
      </Label>
      <Input
        id="walletId"
        type="text"
        value={walletId || ''}
        onChange={(e) => onWalletIdChange(e.target.value)}
        placeholder="Ex: 12345678-abcd-1234-efgh-123456789012"
        className={`font-mono text-sm ${walletId && !isValidFormat ? 'border-destructive' : ''}`}
      />
      <p className="text-xs text-muted-foreground">
        Detectado automaticamente ao validar a API Key. Se não for detectado, encontre em{' '}
        <a
          href="https://www.asaas.com/myAccount"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Minha Conta
        </a>
        {' '}→ Dados da conta → Identificador.
      </p>
      {walletId && !isValidFormat && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Formato inválido. Use o formato UUID.
        </p>
      )}
      {!walletId && isValidated && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Wallet ID não detectado automaticamente. Insira manualmente.
        </p>
      )}
    </div>
  );
}
