/**
 * Asaas Gateway Hooks
 * 
 * React hooks para integração com o Asaas.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getAsaasSettings,
  saveAsaasSettings,
  validateAsaasCredentials,
  disconnectAsaas,
  isAsaasConnected,
} from './api';
import type {
  AsaasEnvironment,
  AsaasConfig,
  AsaasValidationResult,
  AsaasIntegrationConfig,
} from './types';

// ============================================
// useAsaasConfig
// ============================================

interface UseAsaasConfigReturn {
  config: AsaasConfig | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar a configuração atual do Asaas
 */
export function useAsaasConfig(): UseAsaasConfigReturn {
  const { user } = useAuth();
  const [config, setConfig] = useState<AsaasConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!user?.id) {
      setConfig(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const settings = await getAsaasSettings(user.id);
      
      if (settings) {
        setConfig({
          apiKey: settings.api_key,
          environment: settings.environment,
          isConfigured: true,
          walletId: settings.wallet_id,
          accountName: settings.account_name,
        });
      } else {
        setConfig({
          apiKey: '',
          environment: 'sandbox',
          isConfigured: false,
        });
      }
    } catch (err) {
      console.error('[useAsaasConfig] Error:', err);
      setError('Erro ao carregar configuração');
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    isLoading,
    error,
    refetch: fetchConfig,
  };
}

// ============================================
// useAsaasValidation
// ============================================

interface UseAsaasValidationReturn {
  validate: (apiKey: string, environment: AsaasEnvironment) => Promise<AsaasValidationResult>;
  isValidating: boolean;
  lastResult: AsaasValidationResult | null;
}

/**
 * Hook para validar credenciais do Asaas
 */
export function useAsaasValidation(): UseAsaasValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState<AsaasValidationResult | null>(null);

  const validate = useCallback(async (
    apiKey: string,
    environment: AsaasEnvironment
  ): Promise<AsaasValidationResult> => {
    setIsValidating(true);

    try {
      const result = await validateAsaasCredentials(apiKey, environment);
      setLastResult(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validate,
    isValidating,
    lastResult,
  };
}

// ============================================
// useAsaasSaveConfig
// ============================================

interface UseAsaasSaveConfigReturn {
  save: (config: AsaasIntegrationConfig) => Promise<{ success: boolean; error?: string }>;
  isSaving: boolean;
}

/**
 * Hook para salvar configuração do Asaas
 */
export function useAsaasSaveConfig(): UseAsaasSaveConfigReturn {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(async (
    config: AsaasIntegrationConfig
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsSaving(true);

    try {
      return await saveAsaasSettings(user.id, config);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  return {
    save,
    isSaving,
  };
}

// ============================================
// useAsaasDisconnect
// ============================================

interface UseAsaasDisconnectReturn {
  disconnect: () => Promise<{ success: boolean; error?: string }>;
  isDisconnecting: boolean;
}

/**
 * Hook para desconectar o Asaas
 */
export function useAsaasDisconnect(): UseAsaasDisconnectReturn {
  const { user } = useAuth();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const disconnect = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsDisconnecting(true);

    try {
      return await disconnectAsaas(user.id);
    } finally {
      setIsDisconnecting(false);
    }
  }, [user?.id]);

  return {
    disconnect,
    isDisconnecting,
  };
}

// ============================================
// useAsaasConnectionStatus
// ============================================

interface UseAsaasConnectionStatusReturn {
  isConnected: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook para verificar status de conexão do Asaas
 */
export function useAsaasConnectionStatus(): UseAsaasConnectionStatusReturn {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkConnection = useCallback(async () => {
    if (!user?.id) {
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const connected = await isAsaasConnected(user.id);
      setIsConnected(connected);
    } catch (err) {
      console.error('[useAsaasConnectionStatus] Error:', err);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    isLoading,
    refetch: checkConnection,
  };
}
