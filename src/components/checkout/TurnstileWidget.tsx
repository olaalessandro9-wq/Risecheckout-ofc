/**
 * Componente: TurnstileWidget
 * 
 * Widget do Cloudflare Turnstile (CAPTCHA invisível/managed)
 * Renderiza o widget e gerencia o token de verificação
 */

import React, { useEffect, useRef, useCallback } from 'react';

// Site Key do Turnstile (pública - pode ficar no código)
const TURNSTILE_SITE_KEY = '0x4AAAAAACLZrBR0ZDwzXbEG';

// URL do script do Turnstile
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: (error: string) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) {
      return;
    }

    // Remove widget anterior se existir
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (e) {
        console.warn('[TurnstileWidget] Erro ao remover widget anterior:', e);
      }
    }

    // Renderiza novo widget
    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          console.log('[TurnstileWidget] Token recebido');
          onVerify(token);
        },
        'error-callback': (error: string) => {
          console.error('[TurnstileWidget] Erro:', error);
          onError?.(error);
        },
        'expired-callback': () => {
          console.warn('[TurnstileWidget] Token expirado');
          onExpire?.();
        },
        theme,
        size,
      });

      console.log('[TurnstileWidget] Widget renderizado:', widgetIdRef.current);
    } catch (error) {
      console.error('[TurnstileWidget] Erro ao renderizar:', error);
      onError?.('Erro ao carregar captcha');
    }
  }, [onVerify, onError, onExpire, theme, size]);

  useEffect(() => {
    // Verifica se o script já está carregado
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Verifica se o script já está no DOM
    const existingScript = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
    
    if (existingScript) {
      // Script existe, aguarda carregar
      if (!scriptLoadedRef.current) {
        window.onTurnstileLoad = () => {
          scriptLoadedRef.current = true;
          renderWidget();
        };
      }
      return;
    }

    // Carrega o script
    const script = document.createElement('script');
    script.src = `${TURNSTILE_SCRIPT_URL}?onload=onTurnstileLoad`;
    script.async = true;
    script.defer = true;

    window.onTurnstileLoad = () => {
      scriptLoadedRef.current = true;
      renderWidget();
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignora erros de cleanup
        }
      }
    };
  }, [renderWidget]);

  return (
    <div 
      ref={containerRef} 
      className={`turnstile-container flex justify-center ${className}`}
      data-testid="turnstile-widget"
    />
  );
};

/**
 * Hook para gerenciar o estado do Turnstile
 */
export const useTurnstile = () => {
  const [token, setToken] = React.useState<string | null>(null);
  const [isVerified, setIsVerified] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleVerify = useCallback((newToken: string) => {
    setToken(newToken);
    setIsVerified(true);
    setError(null);
  }, []);

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setIsVerified(false);
    setToken(null);
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
    setIsVerified(false);
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setIsVerified(false);
    setError(null);
  }, []);

  return {
    token,
    isVerified,
    error,
    handleVerify,
    handleError,
    handleExpire,
    reset,
  };
};

export default TurnstileWidget;
