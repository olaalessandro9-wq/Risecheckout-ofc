/**
 * ActionButtons - Botões de ação do formulário Asaas
 */

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  onValidate: () => void;
  onSave: () => void;
  onDisconnect: () => void;
  isValidating: boolean;
  isSaving: boolean;
  isDisconnecting: boolean;
  isConnected: boolean;
  apiKey: string;
  isValidated: boolean;
}

export function ActionButtons({
  onValidate,
  onSave,
  onDisconnect,
  isValidating,
  isSaving,
  isDisconnecting,
  isConnected,
  apiKey,
  isValidated,
}: ActionButtonsProps) {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Validate button */}
        <Button
          type="button"
          variant="outline"
          onClick={onValidate}
          disabled={isValidating || !apiKey.trim()}
          className="flex-1"
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validando...
            </>
          ) : (
            'Validar Credenciais'
          )}
        </Button>

        {/* Save button */}
        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving || !isValidated}
          className="flex-1"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configuração'
          )}
        </Button>
      </div>

      {/* Disconnect button (only if connected) */}
      {isConnected && (
        <Button
          type="button"
          variant="destructive"
          onClick={onDisconnect}
          disabled={isDisconnecting}
          className="w-full"
        >
          {isDisconnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Desconectando...
            </>
          ) : (
            'Desconectar Asaas'
          )}
        </Button>
      )}
    </>
  );
}
