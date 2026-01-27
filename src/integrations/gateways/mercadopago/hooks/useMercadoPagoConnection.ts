/**
 * useMercadoPagoConnection Hook
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant - SSOT Architecture
 * 
 * Hook APENAS para AÇÕES (connect, disconnect).
 * O ESTADO vem do FinanceiroContext (Single Source of Truth).
 * Eliminadas chamadas duplicadas e re-renders desnecessários.
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { MERCADOPAGO_CLIENT_ID, MERCADOPAGO_REDIRECT_URI } from '@/config/mercadopago';

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
  connectingOAuth: boolean;
  handleConnectOAuth: () => Promise<void>;
  handleDisconnect: () => Promise<void>;
}

export function useMercadoPagoConnection({
  userId,
  onConnectionChange,
}: UseMercadoPagoConnectionProps): UseMercadoPagoConnectionReturn {
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  
  // Ref para debounce - evita processar popup.closed se sucesso já foi recebido
  const lastSuccessTimestamp = useRef<number>(0);

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

      // Listener temporário para postMessage de sucesso/erro
      const handleOAuthMessage = (event: MessageEvent) => {
        const isSuccess = 
          event.data?.type === 'mercadopago_oauth_success' ||
          event.data?.type === 'mercadopago-connected' ||
          event.data?.type === 'oauth_success';
        
        if (isSuccess) {
          lastSuccessTimestamp.current = Date.now();
          setConnectingOAuth(false);
          // O FinanceiroContext escuta postMessage e faz BACKGROUND_REFRESH
          // Não precisamos fazer nada aqui além de atualizar UI local
        }

        if (event.data?.type === 'mercadopago_oauth_error') {
          log.error('OAuth error:', event.data?.reason);
          setConnectingOAuth(false);
          toast.error('Erro ao conectar Mercado Pago. Tente novamente.');
        }
      };

      window.addEventListener('message', handleOAuthMessage);

      // Checker de popup fechado (fallback se postMessage não funcionar)
      let popupCheckCount = 0;
      const maxChecks = 120;

      const checkPopup = setInterval(() => {
        popupCheckCount++;

        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleOAuthMessage);
          setConnectingOAuth(false);
          
          // Só notifica mudança se NÃO recebemos sucesso via postMessage recentemente
          const timeSinceLastSuccess = Date.now() - lastSuccessTimestamp.current;
          if (timeSinceLastSuccess > 10000 || lastSuccessTimestamp.current === 0) {
            log.debug('Popup fechado sem sucesso detectado, notificando mudança...');
            // Dispara refresh como fallback
            onConnectionChange?.();
          } else {
            log.debug('Popup fechado, sucesso já processado via postMessage');
          }
        } else if (popupCheckCount >= maxChecks) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleOAuthMessage);
          setConnectingOAuth(false);
          toast.info('Se você completou o OAuth, aguarde a atualização automática');
        }
      }, 500);
    } catch (error) {
      log.error('Erro OAuth:', error);
      toast.error('Erro ao iniciar autenticação');
      setConnectingOAuth(false);
    }
  }, [userId, onConnectionChange]);

  const handleDisconnect = useCallback(async () => {
    try {
      const { data: result, error } = await api.call<{ success?: boolean; error?: string }>('integration-management', {
        action: 'disconnect',
        integrationType: 'MERCADOPAGO',
      });

      if (error || !result?.success) {
        throw new Error(result?.error || error?.message || 'Erro ao desconectar');
      }

      toast.success('Integração desconectada');
      onConnectionChange?.();
    } catch (error) {
      log.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar');
    }
  }, [onConnectionChange]);

  return {
    connectingOAuth,
    handleConnectOAuth,
    handleDisconnect,
  };
}
