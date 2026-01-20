/**
 * useMercadoPagoConnection Hook
 * 
 * @version 2.2.0 - RISE Protocol V3 Compliant - Zero console.log
 * 
 * Gerencia toda a lógica de conexão OAuth do Mercado Pago.
 * Usa integration-management Edge Function como single source of truth.
 * Inclui: init OAuth, popup management, postMessage listener com debounce.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { MERCADOPAGO_CLIENT_ID, MERCADOPAGO_REDIRECT_URI } from '@/config/mercadopago';
import type { ConnectionMode, IntegrationData } from '../types';

const log = createLogger("UseMercadoPagoConnection");

function generateSecureNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

interface UseMercadoPagoConnectionProps {
  userId: string | undefined;
  onConnectionChange?: () => void;
}

interface UseMercadoPagoConnectionReturn {
  currentMode: ConnectionMode;
  integration: IntegrationData | null;
  loading: boolean;
  connectingOAuth: boolean;
  loadIntegration: () => Promise<void>;
  handleConnectOAuth: () => Promise<void>;
  handleDisconnect: () => Promise<void>;
}

// Interface para resposta do integration-management/status
interface IntegrationStatusResponse {
  success: boolean;
  integrations?: Array<{
    id: string;
    integration_type: string;
    active: boolean;
    config?: {
      is_test?: boolean;
      email?: string;
      user_id?: string;
    };
  }>;
  error?: string;
}

export function useMercadoPagoConnection({
  userId,
  onConnectionChange,
}: UseMercadoPagoConnectionProps): UseMercadoPagoConnectionReturn {
  const [currentMode, setCurrentMode] = useState<ConnectionMode>('none');
  const [integration, setIntegration] = useState<IntegrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  
  // Ref para debounce de mensagens duplicadas (retry do popup)
  const lastProcessedTimestamp = useRef<number>(0);

  // Carrega status via Edge Function (single source of truth - RISE Protocol)
  const loadIntegration = useCallback(async () => {
    try {
      setLoading(true);
      if (!userId) return;

      // Usar Edge Function para buscar status (não depende de Supabase Auth)
      const { data: result, error } = await api.call<IntegrationStatusResponse>('integration-management', {
        action: 'status',
        integrationType: 'MERCADOPAGO',
      });

      if (error) {
        log.error('Erro ao buscar status:', error);
        throw error;
      }

      if (result?.success && result.integrations && result.integrations.length > 0) {
        const mpIntegration = result.integrations[0];
        const config = mpIntegration.config;
        const isTest = config?.is_test ?? false;
        const mode: ConnectionMode = isTest ? 'sandbox' : 'production';

        setCurrentMode(mode);
        setIntegration({
          id: mpIntegration.id,
          mode,
          isTest,
          email: config?.email,
          userId: config?.user_id,
        });
        log.info('Status carregado via Edge Function:', mode);
      } else {
        setCurrentMode('none');
        setIntegration(null);
        log.debug('Nenhuma integração encontrada');
      }
      // NOTA: Removido onConnectionChange?.() aqui para evitar chamadas duplicadas
      // O Financeiro.tsx já tem listener global que chama loadAllIntegrations()
    } catch (error) {
      log.error('Erro ao carregar:', error);
      // Em caso de erro, resetar para estado seguro
      setCurrentMode('none');
      setIntegration(null);
    } finally {
      setLoading(false);
    }
  }, [userId, onConnectionChange]);

  // Load on mount
  useEffect(() => {
    if (userId) {
      loadIntegration();
    }
  }, [userId, loadIntegration]);

  // OAuth success/error listener - apenas UI feedback local
  // O refresh de dados é gerenciado pelo FinanceiroContext (Single Source of Truth)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const messageType = event.data?.type;
      const isSuccess = 
        messageType === 'mercadopago_oauth_success' ||
        messageType === 'mercadopago-connected' ||
        messageType === 'oauth_success';
      
      if (isSuccess) {
        // DEBOUNCE: evitar processar mensagens duplicadas
        const now = Date.now();
        const timeSinceLastProcessed = now - lastProcessedTimestamp.current;
        
        if (timeSinceLastProcessed < 5000 && lastProcessedTimestamp.current > 0) {
          return;
        }
        
        lastProcessedTimestamp.current = now;
        setConnectingOAuth(false);
        
        // Atualiza estado local do hook
        setTimeout(() => loadIntegration(), 800);
        return;
      }
      
      if (messageType === 'mercadopago_oauth_error') {
        log.error('OAuth error:', event.data?.reason);
        setConnectingOAuth(false);
        toast.error('Erro ao conectar Mercado Pago. Tente novamente.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadIntegration]);

  const handleConnectOAuth = useCallback(async () => {
    if (!userId) {
      toast.error('Usuário não autenticado');
      return;
    }

    setConnectingOAuth(true);

    try {
      const nonce = generateSecureNonce();

      const { data: oauthResult, error: oauthError } = await api.call<{ success?: boolean; error?: string; state?: string }>('integration-management', {
        action: 'init-oauth',
        integrationType: 'MERCADOPAGO',
      });

      if (oauthError || !oauthResult?.success) {
        log.error('Erro ao salvar state:', oauthResult?.error || oauthError);
        toast.error('Erro ao iniciar autenticação. Tente novamente.');
        setConnectingOAuth(false);
        return;
      }

      const stateNonce = oauthResult.state || nonce;

      const authUrl = new URL('https://auth.mercadopago.com.br/authorization');
      authUrl.searchParams.set('client_id', MERCADOPAGO_CLIENT_ID);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('platform_id', 'mp');
      authUrl.searchParams.set('state', stateNonce);
      authUrl.searchParams.set('redirect_uri', MERCADOPAGO_REDIRECT_URI);

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl.toString(),
        'MercadoPago OAuth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
      );

      if (!popup) {
        toast.error('Popup bloqueado! Permita popups para este site.');
        setConnectingOAuth(false);
        return;
      }

      let popupCheckCount = 0;
      const maxChecks = 120;

      const checkPopup = setInterval(() => {
        popupCheckCount++;

        if (popup.closed) {
          clearInterval(checkPopup);
          setConnectingOAuth(false);
          
          // CORREÇÃO: Só recarrega se NÃO processamos sucesso via postMessage recentemente
          // Isso evita a "piscada extra" ~3s depois da conexão
          const timeSinceLastSuccess = Date.now() - lastProcessedTimestamp.current;
          if (timeSinceLastSuccess > 5000 || lastProcessedTimestamp.current === 0) {
            log.debug('Popup fechado sem sucesso detectado, recarregando...');
            setTimeout(() => loadIntegration(), 500);
          } else {
            log.debug('Popup fechado, mas sucesso já processado via postMessage - ignorando reload');
          }
        } else if (popupCheckCount >= maxChecks) {
          clearInterval(checkPopup);
          setConnectingOAuth(false);
          toast.info('Se você completou o OAuth, clique em "Atualizar Status"');
        }
      }, 500);
    } catch (error) {
      log.error('Erro OAuth:', error);
      toast.error('Erro ao iniciar autenticação');
      setConnectingOAuth(false);
    }
  }, [userId, loadIntegration]);

  const handleDisconnect = useCallback(async () => {
    try {
      if (!integration?.id) return;

      const { data: result, error } = await api.call<{ success?: boolean; error?: string }>('integration-management', {
        action: 'disconnect',
        integrationId: integration.id,
      });

      if (error || !result?.success) {
        throw new Error(result?.error || error?.message || 'Erro ao desconectar');
      }

      toast.success('Integração desconectada');
      setCurrentMode('none');
      setIntegration(null);
      onConnectionChange?.();
    } catch (error) {
      log.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar');
    }
  }, [integration, onConnectionChange]);

  return {
    currentMode,
    integration,
    loading,
    connectingOAuth,
    loadIntegration,
    handleConnectOAuth,
    handleDisconnect,
  };
}
