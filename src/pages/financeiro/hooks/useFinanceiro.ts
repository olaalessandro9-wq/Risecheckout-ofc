/**
 * useFinanceiro Hook
 * 
 * Centralizes all state management and business logic for Financeiro page.
 * RISE Protocol V2 Compliant - Clean Architecture
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
 * 
 * @version 1.0.0
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { useAuth } from "@/hooks/useAuth";
import { getPushinPaySettings, savePushinPaySettings } from "@/integrations/gateways/pushinpay/api";
import type { PushinPayEnvironment } from "@/integrations/gateways/pushinpay/types";
import type { PaymentGateway, FinanceiroState, FinanceiroActions } from "../types";

const log = createLogger("UseFinanceiro");

interface UseFinanceiroReturn {
  state: FinanceiroState;
  actions: FinanceiroActions;
}

interface IntegrationStatusResponse {
  success: boolean;
  integrations?: Array<{ integration_type: string; active: boolean }>;
  error?: string;
}

export function useFinanceiro(): UseFinanceiroReturn {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [apiToken, setApiToken] = useState("");
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [environment, setEnvironment] = useState<PushinPayEnvironment>("sandbox");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<FinanceiroState["message"]>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>(null);
  const [pushinPayConnected, setPushinPayConnected] = useState(false);
  const [mercadoPagoConnected, setMercadoPagoConnected] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [asaasConnected, setAsaasConnected] = useState(false);

  // Debounce refs
  const lastOAuthProcessed = useRef<number>(0);
  const lastLoadAllIntegrations = useRef<number>(0);

  // Load all integrations
  const loadAllIntegrations = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Load PushinPay
      const settings = await getPushinPaySettings(user.id);
      if (settings) {
        if (settings.pushinpay_token === "••••••••") {
          setHasExistingToken(true);
          setApiToken("");
        } else {
          setApiToken(settings.pushinpay_token ?? "");
        }
        setEnvironment(settings.environment ?? "sandbox");
      }

      // Load all gateways via Edge Function
      const { data: result, error } = await api.call<IntegrationStatusResponse>('integration-management', {
        action: 'status',
      });

      if (error) {
        log.error('Erro ao buscar status de integrações:', error);
        return;
      }

      if (result?.success && result.integrations) {
        const integrations = result.integrations;
        // Fonte única de verdade para TODOS os gateways - via vendor_integrations
        setPushinPayConnected(integrations.some(i => i.integration_type === 'PUSHINPAY' && i.active));
        setMercadoPagoConnected(integrations.some(i => i.integration_type === 'MERCADOPAGO' && i.active));
        setStripeConnected(integrations.some(i => i.integration_type === 'STRIPE' && i.active));
        setAsaasConnected(integrations.some(i => i.integration_type === 'ASAAS' && i.active));
      } else {
        setPushinPayConnected(false);
        setMercadoPagoConnected(false);
        setStripeConnected(false);
        setAsaasConnected(false);
      }
    } catch (error: unknown) {
      log.error("Erro ao carregar dados:", error);
    } finally {
      setLoadingData(false);
    }
  }, [user?.id]);

  // Debounced version
  const loadAllIntegrationsDebounced = useCallback(async () => {
    const now = Date.now();
    if (now - lastLoadAllIntegrations.current < 2000) {
      return;
    }
    lastLoadAllIntegrations.current = now;
    await loadAllIntegrations();
  }, [loadAllIntegrations]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadAllIntegrations();
    }
  }, [user?.id, loadAllIntegrations]);

  // OAuth listener
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const messageType = event.data?.type;
      const isOAuthSuccess = 
        messageType === 'mercadopago_oauth_success' ||
        messageType === 'stripe_oauth_success' ||
        messageType === 'asaas_oauth_success' ||
        messageType === 'oauth_success';
      
      if (isOAuthSuccess) {
        const now = Date.now();
        if (now - lastOAuthProcessed.current < 5000) return;
        lastOAuthProcessed.current = now;
        
        setTimeout(() => loadAllIntegrationsDebounced(), 800);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [loadAllIntegrationsDebounced]);

  // Auto-open modal from query param
  useEffect(() => {
    if (!loadingData) {
      const gatewayParam = searchParams.get("gateway");
      const validGateways = ["pushinpay", "mercadopago", "stripe", "asaas"];
      
      if (gatewayParam && validGateways.includes(gatewayParam)) {
        setSelectedGateway(gatewayParam as PaymentGateway);
        setSearchParams({}, { replace: true });
      }
    }
  }, [loadingData, searchParams, setSearchParams]);

  // Auto-hide success message
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Save PushinPay settings
  const onSave = useCallback(async () => {
    if (!hasExistingToken && !apiToken.trim()) {
      setMessage({ type: "error", text: "Por favor, informe o API Token" });
      return;
    }
    if (hasExistingToken && !apiToken.trim()) {
      setMessage({ type: "error", text: "Para atualizar, informe um novo token" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await savePushinPaySettings(user!.id, {
        pushinpay_token: apiToken,
        environment,
      });

      if (result.ok) {
        setMessage({ type: "success", text: "Integração PushinPay salva!" });
        toast.success("Integração PushinPay salva!");
        setHasExistingToken(true);
        setApiToken("");
      } else {
        setMessage({ type: "error", text: `Erro: ${result.error}` });
        toast.error(`Erro: ${result.error}`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      setMessage({ type: "error", text: `Erro: ${msg}` });
      toast.error(`Erro: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [apiToken, environment, hasExistingToken, user]);

  return {
    state: {
      apiToken,
      hasExistingToken,
      environment,
      loading,
      loadingData,
      message,
      selectedGateway,
      pushinPayConnected,
      mercadoPagoConnected,
      stripeConnected,
      asaasConnected,
    },
    actions: {
      setApiToken,
      setEnvironment,
      setSelectedGateway,
      setMessage,
      onSave,
      loadAllIntegrationsDebounced,
    },
  };
}
