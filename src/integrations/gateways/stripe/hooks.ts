/**
 * Stripe Gateway Hooks
 * 
 * @module integrations/gateways/stripe
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * React hooks para integração com Stripe Connect.
 * Seguem o mesmo padrão dos hooks de Asaas, MercadoPago e PushinPay.
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { createLogger } from "@/lib/logger";
import {
  getStripeConnectionStatus,
  startStripeConnect,
  disconnectStripe,
  getStripeConfig,
} from "./api";
import type { StripeConnectionStatus, StripeConfig } from "./types";

const log = createLogger("StripeHooks");

// ============================================
// useStripeConfig
// ============================================

interface UseStripeConfigReturn {
  config: StripeConfig | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar e gerenciar a configuração do Stripe
 */
export function useStripeConfig(): UseStripeConfigReturn {
  const { user } = useUnifiedAuth();
  const [config, setConfig] = useState<StripeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await getStripeConfig();
      setConfig(result);
    } catch (err) {
      log.error("Error fetching config:", err);
      setError("Erro ao carregar configuração do Stripe");
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
// useStripeConnectionStatus
// ============================================

interface UseStripeConnectionStatusReturn {
  status: StripeConnectionStatus | null;
  isConnected: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook para verificar o status de conexão do Stripe
 */
export function useStripeConnectionStatus(): UseStripeConnectionStatusReturn {
  const { user } = useUnifiedAuth();
  const [status, setStatus] = useState<StripeConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await getStripeConnectionStatus();
      setStatus(result);
    } catch (err) {
      log.error("Error fetching status:", err);
      setStatus({
        connected: false,
        account_id: null,
        email: null,
        livemode: null,
        connected_at: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    isConnected: status?.connected ?? false,
    isLoading,
    refetch: fetchStatus,
  };
}

// ============================================
// useStripeConnect
// ============================================

interface UseStripeConnectReturn {
  connect: () => Promise<void>;
  isConnecting: boolean;
}

/**
 * Hook para iniciar conexão com Stripe Connect
 */
export function useStripeConnect(): UseStripeConnectReturn {
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      const result = await startStripeConnect();

      if (result.success && result.url) {
        // Redirecionar para OAuth do Stripe
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Erro ao iniciar conexão com Stripe");
        setIsConnecting(false);
      }
    } catch (err) {
      log.error("Connect error:", err);
      toast.error("Erro ao conectar com Stripe");
      setIsConnecting(false);
    }
  }, []);

  return {
    connect,
    isConnecting,
  };
}

// ============================================
// useStripeDisconnect
// ============================================

interface UseStripeDisconnectReturn {
  disconnect: () => Promise<{ success: boolean; error?: string }>;
  isDisconnecting: boolean;
}

/**
 * Hook para desconectar do Stripe
 */
export function useStripeDisconnect(): UseStripeDisconnectReturn {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const disconnect = useCallback(async () => {
    try {
      setIsDisconnecting(true);
      const result = await disconnectStripe();

      if (result.success) {
        toast.success("Stripe desconectado com sucesso");
      } else {
        toast.error(result.error || "Erro ao desconectar Stripe");
      }

      return result;
    } catch (err) {
      log.error("Disconnect error:", err);
      const errorMsg = "Erro ao desconectar Stripe";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsDisconnecting(false);
    }
  }, []);

  return {
    disconnect,
    isDisconnecting,
  };
}

// ============================================
// useStripeOAuthCallback
// ============================================

interface UseStripeOAuthCallbackReturn {
  handleCallback: () => void;
}

/**
 * Hook para processar callbacks OAuth do Stripe
 */
export function useStripeOAuthCallback(
  onSuccess?: () => void,
  onError?: (error: string) => void
): UseStripeOAuthCallbackReturn {
  const handleCallback = useCallback(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('stripe_success') === 'true') {
      toast.success("Stripe conectado com sucesso!");
      onSuccess?.();
      // Limpar URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    const stripeError = params.get('stripe_error');
    if (stripeError) {
      toast.error(`Erro ao conectar Stripe: ${stripeError}`);
      onError?.(stripeError);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [onSuccess, onError]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  return { handleCallback };
}
