/**
 * Asaas ConfigForm Component
 * 
 * Formulário de configuração do gateway Asaas.
 * Permite configurar API Key e ambiente (Sandbox/Produção).
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAsaasConfig,
  useAsaasValidation,
  useAsaasSaveConfig,
  useAsaasDisconnect,
} from '../hooks';
import type { AsaasEnvironment } from '../types';
import { usePermissions } from '@/hooks/usePermissions';

interface ConfigFormProps {
  onConnectionChange?: () => void;
}

export function ConfigForm({ onConnectionChange }: ConfigFormProps) {
  const { toast } = useToast();
  const { config, isLoading: isLoadingConfig, refetch } = useAsaasConfig();
  const { validate, isValidating, lastResult } = useAsaasValidation();
  const { save, isSaving } = useAsaasSaveConfig();
  const { disconnect, isDisconnecting } = useAsaasDisconnect();
  const { role } = usePermissions();
  
  // Apenas admin pode usar sandbox
  const isAdmin = role === 'admin';

  // Form state
  const [apiKey, setApiKey] = useState('');
  const [environment, setEnvironment] = useState<AsaasEnvironment>('production');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [walletId, setWalletId] = useState<string | undefined>();
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing config
  useEffect(() => {
    if (config) {
      setApiKey(config.apiKey || '');
      // Se não for admin, forçar produção
      const configEnv = config.environment || 'production';
      setEnvironment(isAdmin ? configEnv : 'production');
      setIsValidated(config.isConfigured);
      setWalletId(config.walletId);
    }
  }, [config, isAdmin]);

  // Forçar produção se não for admin
  useEffect(() => {
    if (!isAdmin && environment === 'sandbox') {
      setEnvironment('production');
    }
  }, [isAdmin, environment]);

  // Track changes
  useEffect(() => {
    if (config) {
      const changed = apiKey !== config.apiKey || environment !== config.environment;
      setHasChanges(changed);
      if (changed) {
        setIsValidated(false);
      }
    }
  }, [apiKey, environment, config]);

  // Handle validation
  const handleValidate = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe a API Key do Asaas',
        variant: 'destructive',
      });
      return;
    }

    const result = await validate(apiKey, environment);

    if (result.valid) {
      setIsValidated(true);
      setWalletId(result.walletId);
      toast({
        title: 'Credenciais válidas',
        description: result.accountName
          ? `Conta: ${result.accountName}`
          : 'API Key validada com sucesso',
      });
    } else {
      setIsValidated(false);
      setWalletId(undefined);
      toast({
        title: 'Credenciais inválidas',
        description: result.message || 'Verifique sua API Key e tente novamente',
        variant: 'destructive',
      });
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!isValidated) {
      toast({
        title: 'Validação necessária',
        description: 'Valide suas credenciais antes de salvar',
        variant: 'destructive',
      });
      return;
    }

    const result = await save({
      api_key: apiKey,
      environment,
      wallet_id: walletId || lastResult?.walletId,
      validated_at: new Date().toISOString(),
      account_name: lastResult?.accountName,
    });

    if (result.success) {
      toast({
        title: 'Configuração salva',
        description: 'Asaas configurado com sucesso',
      });
      setHasChanges(false);
      onConnectionChange?.();
      refetch();
    } else {
      toast({
        title: 'Erro ao salvar',
        description: result.error || 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    const result = await disconnect();

    if (result.success) {
      toast({
        title: 'Desconectado',
        description: 'Asaas foi desconectado',
      });
      setApiKey('');
      setEnvironment('sandbox');
      setIsValidated(false);
      onConnectionChange?.();
      refetch();
    } else {
      toast({
        title: 'Erro ao desconectar',
        description: result.error || 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isConnected = config?.isConfigured && !hasChanges;

  return (
    <div className="space-y-6">
      {/* Header info */}
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
              <strong>Métodos suportados:</strong> PIX e Cartão de Crédito
            </p>
          </div>
        </div>
      </div>

      {/* Status badge */}
      {isConnected && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>Asaas conectado e ativo</span>
        </div>
      )}

      {/* Environment selector - apenas para admin */}
      {isAdmin && (
        <div className="space-y-2">
          <Label htmlFor="environment">Ambiente</Label>
          <Select
            value={environment}
            onValueChange={(value: AsaasEnvironment) => setEnvironment(value)}
          >
            <SelectTrigger id="environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  Sandbox (Testes)
                </div>
              </SelectItem>
              <SelectItem value="production">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Produção
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {environment === 'sandbox'
              ? 'Ambiente de testes. Nenhuma transação real será processada.'
              : 'Ambiente de produção. Transações reais serão processadas.'}
          </p>
        </div>
      )}

      {/* API Key input */}
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <div className="relative">
          <Input
            id="apiKey"
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="$aact_..."
            className={cn(
              'pr-20',
              isValidated && !hasChanges && 'border-green-500 focus-visible:ring-green-500'
            )}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            {isValidated && !hasChanges && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
      </div>

      {/* Wallet ID display (read-only after validation) */}
      {walletId && isValidated && !hasChanges && (
        <div className="space-y-2">
          <Label htmlFor="walletId">Wallet ID (Account ID)</Label>
          <Input
            id="walletId"
            type="text"
            value={walletId}
            readOnly
            disabled
            className="bg-muted/50 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            ID da sua conta no Asaas. Usado para identificação em splits.
          </p>
        </div>
      )}

      {/* Validation result */}
      {lastResult && hasChanges && (
        <div
          className={cn(
            'flex items-center gap-2 text-sm',
            lastResult.valid
              ? 'text-green-600 dark:text-green-400'
              : 'text-destructive'
          )}
        >
          {lastResult.valid ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Credenciais válidas</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              <span>{lastResult.message || 'Credenciais inválidas'}</span>
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Validate button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleValidate}
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
          onClick={handleSave}
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
          onClick={handleDisconnect}
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
