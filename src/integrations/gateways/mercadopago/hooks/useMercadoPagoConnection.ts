/**
 * useMercadoPagoConnection Hook
 * 
 * @version 2.1.0 - RISE Protocol V2 Compliant
 * 
 * Gerencia toda a lógica de conexão OAuth do Mercado Pago.
 * Usa integration-management Edge Function como single source of truth.
 * Inclui: init OAuth, popup management, postMessage listener com debounce.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ConnectionMode, IntegrationData } from '../types';

const MERCADOPAGO_CLIENT_ID = import.meta.env.VITE_MERCADOPAGO_CLIENT_ID || '2354396684039370';
const MERCADOPAGO_REDIRECT_URI = 
  import.meta.env.VITE_MERCADOPAGO_REDIRECT_URI || 
  'https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-oauth-callback';

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
      const { getProducerSessionToken } = await import('@/hooks/useProducerAuth');
      const sessionToken = getProducerSessionToken();

      const { data: result, error } = await supabase.functions.invoke<IntegrationStatusResponse>('integration-management', {
        body: {
          action: 'status',
          integrationType: 'MERCADOPAGO',
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) {
        console.error('[useMercadoPagoConnection] Erro ao buscar status:', error);
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
        console.log('[useMercadoPagoConnection] Status carregado via Edge Function:', mode);
      } else {
        setCurrentMode('none');
        setIntegration(null);
        console.log('[useMercadoPagoConnection] Nenhuma integração encontrada');
      }

      onConnectionChange?.();
    } catch (error) {
      console.error('[useMercadoPagoConnection] Erro ao carregar:', error);
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

  // OAuth success/error listener com debounce para evitar processar mensagens duplicadas (retry do popup)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Aceitar mensagens de qualquer origin (popup envia com '*' para garantir entrega)
      // Segurança: validamos o tipo da mensagem e o timestamp
      
      console.log('[useMercadoPagoConnection] postMessage recebido:', {
        origin: event.origin,
        type: event.data?.type,
        attempt: event.data?.attempt,
        timestamp: event.data?.timestamp
      });
      
      // Handle success
      const messageType = event.data?.type;
      const isSuccess = 
        messageType === 'mercadopago_oauth_success' ||
        messageType === 'mercadopago-connected' ||
        messageType === 'oauth_success';
      
      if (isSuccess) {
        // DEBOUNCE: ignorar mensagens duplicadas dentro de 3 segundos
        const messageTimestamp = event.data?.timestamp || Date.now();
        const timeSinceLastProcessed = messageTimestamp - lastProcessedTimestamp.current;
        
        if (timeSinceLastProcessed < 3000 && lastProcessedTimestamp.current > 0) {
          console.log('[useMercadoPagoConnection] Mensagem duplicada ignorada (debounce):', {
            timeSinceLastProcessed,
            attempt: event.data?.attempt
          });
          return;
        }
        
        // Marcar como processado
        lastProcessedTimestamp.current = messageTimestamp;
        
        console.log('[useMercadoPagoConnection] OAuth success processado!');
        setConnectingOAuth(false);
        toast.success('Conta do Mercado Pago conectada com sucesso!');
        
        // Delay to ensure database has been updated
        setTimeout(() => {
          console.log('[useMercadoPagoConnection] Recarregando integração via Edge Function...');
          loadIntegration();
        }, 800);
        return;
      }
      
      // Handle error
      if (messageType === 'mercadopago_oauth_error') {
        console.error('[useMercadoPagoConnection] OAuth error:', event.data?.reason);
        setConnectingOAuth(false);
        toast.error('Erro ao conectar Mercado Pago. Tente novamente.');
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('[useMercadoPagoConnection] postMessage listener registrado');
    
    return () => {
      window.removeEventListener('message', handleMessage);
      console.log('[useMercadoPagoConnection] postMessage listener removido');
    };
  }, [loadIntegration]);

  const handleConnectOAuth = useCallback(async () => {
    if (!userId) {
      toast.error('Usuário não autenticado');
      return;
    }

    setConnectingOAuth(true);

    try {
      const nonce = generateSecureNonce();
      const { getProducerSessionToken } = await import('@/hooks/useProducerAuth');
      const sessionToken = getProducerSessionToken();

      const { data: oauthResult, error: oauthError } = await supabase.functions.invoke('integration-management', {
        body: {
          action: 'init-oauth',
          integrationType: 'MERCADOPAGO',
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (oauthError || !oauthResult?.success) {
        console.error('[useMercadoPagoConnection] Erro ao salvar state:', oauthResult?.error || oauthError);
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
          setTimeout(() => {
            console.log('[useMercadoPagoConnection] Popup fechado, recarregando...');
            loadIntegration();
          }, 500);
        } else if (popupCheckCount >= maxChecks) {
          clearInterval(checkPopup);
          setConnectingOAuth(false);
          toast.info('Se você completou o OAuth, clique em "Atualizar Status"');
        }
      }, 500);
    } catch (error) {
      console.error('[useMercadoPagoConnection] Erro OAuth:', error);
      toast.error('Erro ao iniciar autenticação');
      setConnectingOAuth(false);
    }
  }, [userId, loadIntegration]);

  const handleDisconnect = useCallback(async () => {
    try {
      if (!integration?.id) return;

      const { getProducerSessionToken } = await import('@/hooks/useProducerAuth');
      const sessionToken = getProducerSessionToken();

      const { data: result, error } = await supabase.functions.invoke('integration-management', {
        body: {
          action: 'disconnect',
          integrationId: integration.id,
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error || !result?.success) {
        throw new Error(result?.error || error?.message || 'Erro ao desconectar');
      }

      toast.success('Integração desconectada');
      setCurrentMode('none');
      setIntegration(null);
      onConnectionChange?.();
    } catch (error) {
      console.error('[useMercadoPagoConnection] Erro ao desconectar:', error);
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
