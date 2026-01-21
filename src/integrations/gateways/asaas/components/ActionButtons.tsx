/**
 * ActionButtons - Botões de ação do formulário Asaas
 * Botão único "Conectar Asaas" que valida + salva em uma ação
 */

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isConnected: boolean;
  apiKeyEmpty: boolean;
}

export function ActionButtons({
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
  isConnected,
  apiKeyEmpty,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Botão único de conexão */}
      <Button
        type="button"
        onClick={onConnect}
        disabled={isConnecting || apiKeyEmpty}
        className="w-full"
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Conectando...
          </>
        ) : isConnected ? (
          'Atualizar Conexão'
        ) : (
          'Conectar Asaas'
        )}
      </Button>

      {/* Botão de desconexão (só se conectado) */}
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
    </div>
  );
}
