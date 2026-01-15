/**
 * Asaas ConfigForm Component (Refatorado)
 * 
 * Orquestrador que compõe os sub-componentes do formulário.
 * Mantém a lógica de estado e delega UI para componentes filhos.
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useAsaasConfig,
  useAsaasValidation,
  useAsaasSaveConfig,
  useAsaasDisconnect,
} from '../hooks';
import type { AsaasEnvironment } from '../types';

import { InfoHeader } from './InfoHeader';
import { ConnectionStatus } from './ConnectionStatus';
import { EnvironmentSelector } from './EnvironmentSelector';
import { ApiKeyInput } from './ApiKeyInput';
import { WalletIdInput } from './WalletIdInput';
import { ValidationResult } from './ValidationResult';
import { ActionButtons } from './ActionButtons';

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
  
  const isAdmin = role === 'admin';

  // Form state
  const [apiKey, setApiKey] = useState('');
  const [environment, setEnvironment] = useState<AsaasEnvironment>('production');
  const [isValidated, setIsValidated] = useState(false);
  const [walletId, setWalletId] = useState<string | undefined>();
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing config
  useEffect(() => {
    if (config) {
      setApiKey(config.apiKey || '');
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
      const changed = 
        apiKey !== config.apiKey || 
        environment !== config.environment ||
        (walletId || '') !== (config.walletId || '');
      setHasChanges(changed);
      if (apiKey !== config.apiKey || environment !== config.environment) {
        setIsValidated(false);
      }
    }
  }, [apiKey, environment, walletId, config]);

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
      if (result.walletId) {
        setWalletId(result.walletId);
      }
      toast({
        title: 'Credenciais válidas',
        description: result.accountName
          ? `Conta: ${result.accountName}`
          : 'API Key validada com sucesso',
      });
    } else {
      setIsValidated(false);
      toast({
        title: 'Credenciais inválidas',
        description: result.message || 'Verifique sua API Key e tente novamente',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!isValidated) {
      toast({
        title: 'Validação necessária',
        description: 'Valide suas credenciais antes de salvar',
        variant: 'destructive',
      });
      return;
    }

    const walletIdToSave = walletId?.trim() || lastResult?.walletId;

    const result = await save({
      api_key: apiKey,
      environment,
      wallet_id: walletIdToSave,
      validated_at: new Date().toISOString(),
      account_name: lastResult?.accountName,
    });

    if (result.success) {
      toast({
        title: 'Configuração salva',
        description: walletIdToSave 
          ? `Asaas configurado com Wallet ID: ${walletIdToSave}`
          : 'Asaas configurado com sucesso',
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
      <InfoHeader />
      
      <ConnectionStatus isConnected={isConnected} />

      <EnvironmentSelector
        environment={environment}
        onEnvironmentChange={setEnvironment}
        isAdmin={isAdmin}
      />

      <ApiKeyInput
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        isValidated={isValidated}
        hasChanges={hasChanges}
      />

      <WalletIdInput
        walletId={walletId}
        onWalletIdChange={setWalletId}
        isValidated={isValidated}
      />

      <ValidationResult lastResult={lastResult} hasChanges={hasChanges} />

      <ActionButtons
        onValidate={handleValidate}
        onSave={handleSave}
        onDisconnect={handleDisconnect}
        isValidating={isValidating}
        isSaving={isSaving}
        isDisconnecting={isDisconnecting}
        isConnected={isConnected}
        apiKey={apiKey}
        isValidated={isValidated}
      />
    </div>
  );
}
