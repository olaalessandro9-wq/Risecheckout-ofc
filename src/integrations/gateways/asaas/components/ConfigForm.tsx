/**
 * Asaas ConfigForm Component (Refatorado)
 * 
 * Orquestrador que compõe os sub-componentes do formulário.
 * Usa ação unificada: Conectar = Validar + Salvar em um só clique.
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
import { ActionButtons } from './ActionButtons';

import type { GatewayConfigFormProps } from "@/config/gateways/types";

export function ConfigForm({ onConnectionChange }: GatewayConfigFormProps) {
  const { toast } = useToast();
  const { config, isLoading: isLoadingConfig, refetch } = useAsaasConfig();
  const { validate, isValidating } = useAsaasValidation();
  const { save, isSaving } = useAsaasSaveConfig();
  const { disconnect, isDisconnecting } = useAsaasDisconnect();
  const { role } = usePermissions();
  
  const isAdmin = role === 'admin';

  // Form state
  const [apiKey, setApiKey] = useState('');
  const [environment, setEnvironment] = useState<AsaasEnvironment>('production');
  const [walletId, setWalletId] = useState<string | undefined>();
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing config
  useEffect(() => {
    if (config) {
      setApiKey(config.apiKey || '');
      const configEnv = config.environment || 'production';
      setEnvironment(isAdmin ? configEnv : 'production');
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
    }
  }, [apiKey, environment, walletId, config]);

  /**
   * Valida formato UUID
   */
  const isValidUUID = (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  };

  /**
   * Handler unificado: Valida + Salva em uma ação
   * Wallet ID é OBRIGATÓRIO (auto-detectado ou manual)
   */
  const handleConnect = async () => {
    // Validação 1: API Key obrigatória
    if (!apiKey.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe a API Key do Asaas',
        variant: 'destructive',
      });
      return;
    }

    // Passo 1: Validar API Key (pode retornar walletId automaticamente)
    const validationResult = await validate(apiKey, environment);

    if (!validationResult.valid) {
      toast({
        title: 'Credenciais inválidas',
        description: validationResult.message || 'Verifique sua API Key e tente novamente',
        variant: 'destructive',
      });
      return;
    }

    // Passo 2: Determinar walletId final
    // PRIORIDADE: API detectou > Usuário preencheu > Erro
    const detectedWalletId = validationResult.walletId;
    const manualWalletId = walletId?.trim();
    const finalWalletId = detectedWalletId || manualWalletId;

    // Validação 2: Wallet ID obrigatório
    if (!finalWalletId) {
      toast({
        title: 'Wallet ID obrigatório',
        description: 'O Wallet ID não foi detectado automaticamente. Por favor, insira manualmente.',
        variant: 'destructive',
      });
      return;
    }

    // Validação 3: Formato UUID (apenas se foi preenchido manualmente)
    if (!detectedWalletId && manualWalletId && !isValidUUID(manualWalletId)) {
      toast({
        title: 'Formato inválido',
        description: 'Wallet ID deve estar no formato UUID (ex: 12345678-abcd-1234-efgh-123456789012)',
        variant: 'destructive',
      });
      return;
    }

    // Passo 3: Salvar configuração
    const saveResult = await save({
      api_key: apiKey,
      environment,
      wallet_id: finalWalletId,
      validated_at: new Date().toISOString(),
      account_name: validationResult.accountName,
    });

    if (saveResult.success) {
      toast({
        title: 'Asaas conectado!',
        description: validationResult.accountName
          ? `Conta: ${validationResult.accountName}`
          : 'Configuração salva com sucesso',
      });
      setHasChanges(false);
      setWalletId(finalWalletId);
      onConnectionChange?.();
      refetch();
    } else {
      toast({
        title: 'Erro ao salvar',
        description: saveResult.error || 'Tente novamente',
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
      setEnvironment('production');
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
  const isConnecting = isValidating || isSaving;

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
        isValidated={isConnected}
        hasChanges={hasChanges}
      />

      <WalletIdInput
        walletId={walletId}
        onWalletIdChange={setWalletId}
        isValidated={isConnected}
      />

      <ActionButtons
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnecting={isConnecting}
        isDisconnecting={isDisconnecting}
        isConnected={isConnected}
        apiKeyEmpty={!apiKey.trim()}
      />
    </div>
  );
}
