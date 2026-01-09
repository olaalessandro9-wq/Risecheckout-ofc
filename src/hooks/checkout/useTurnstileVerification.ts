/**
 * Hook: useTurnstileVerification
 * 
 * Gerencia a verificação do Cloudflare Turnstile no checkout
 * Valida o token com a Edge Function antes de processar pagamentos
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VerificationResult {
  success: boolean;
  error?: string;
}

export const useTurnstileVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Armazena o token quando o widget resolve
   */
  const onTokenReceived = useCallback((newToken: string) => {
    console.log('[useTurnstileVerification] Token recebido do widget');
    setToken(newToken);
    setError(null);
  }, []);

  /**
   * Trata erros do widget
   */
  const onWidgetError = useCallback((errorMsg: string) => {
    console.error('[useTurnstileVerification] Erro do widget:', errorMsg);
    setError(errorMsg);
    setToken(null);
    setIsVerified(false);
  }, []);

  /**
   * Trata expiração do token
   */
  const onTokenExpired = useCallback(() => {
    console.warn('[useTurnstileVerification] Token expirado');
    setToken(null);
    setIsVerified(false);
  }, []);

  /**
   * Verifica o token com o backend
   * Deve ser chamado antes de processar o pagamento
   */
  const verifyToken = useCallback(async (): Promise<VerificationResult> => {
    if (!token) {
      return { 
        success: false, 
        error: 'Complete a verificação de segurança antes de continuar' 
      };
    }

    setIsVerifying(true);
    setError(null);

    try {
      console.log('[useTurnstileVerification] Verificando token com backend...');

      const { data, error: invokeError } = await supabase.functions.invoke(
        'verify-turnstile',
        {
          body: { token },
        }
      );

      if (invokeError) {
        console.error('[useTurnstileVerification] Erro ao invocar função:', invokeError);
        setError('Erro ao verificar captcha. Tente novamente.');
        return { success: false, error: 'Erro ao verificar captcha' };
      }

      if (data?.success) {
        console.log('[useTurnstileVerification] Verificação bem-sucedida');
        setIsVerified(true);
        return { success: true };
      } else {
        const errorMsg = data?.error || 'Verificação de captcha falhou';
        console.warn('[useTurnstileVerification] Verificação falhou:', errorMsg);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('[useTurnstileVerification] Erro inesperado:', err);
      const errorMsg = 'Erro ao verificar captcha. Tente novamente.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsVerifying(false);
    }
  }, [token]);

  /**
   * Reseta o estado do hook
   */
  const reset = useCallback(() => {
    setToken(null);
    setIsVerified(false);
    setIsVerifying(false);
    setError(null);
  }, []);

  return {
    // Estado
    token,
    isVerifying,
    isVerified,
    error,
    hasToken: !!token,

    // Handlers para o widget
    onTokenReceived,
    onWidgetError,
    onTokenExpired,

    // Ações
    verifyToken,
    reset,
  };
};

export default useTurnstileVerification;
