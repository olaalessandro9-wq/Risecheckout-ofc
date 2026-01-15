/**
 * InfoHeader - Cabeçalho informativo do Asaas
 * Exibe instruções para obter API Key e Wallet ID
 */

import { AlertCircle } from 'lucide-react';

export function InfoHeader() {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p>
            Para obter sua API Key, acesse o painel do Asaas em{' '}
            <a
              href="https://www.asaas.com/customerApiKeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Configurações → Integrações → API
            </a>
          </p>
          <p className="mt-1">
            <strong>Wallet ID:</strong> Encontre em{' '}
            <a
              href="https://www.asaas.com/myAccount"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Minha Conta → Dados da conta
            </a>
          </p>
          <p className="mt-1">
            <strong>Métodos suportados:</strong> PIX e Cartão de Crédito
          </p>
        </div>
      </div>
    </div>
  );
}
