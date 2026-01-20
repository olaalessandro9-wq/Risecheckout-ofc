/**
 * Stripe Gateway API
 * 
 * @module integrations/gateways/stripe
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Funções de API para integração com Stripe Connect.
 * Todas as operações são realizadas via Edge Functions.
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type {
  StripeConnectAction,
  StripeConnectResponse,
  StripeConnectionStatus,
  StripeConfig,
} from "./types";

const log = createLogger("StripeAPI");

// ============================================
// CONSTANTS
// ============================================

const INTEGRATION_TYPE = 'STRIPE';

// ============================================
// CONNECTION MANAGEMENT
// ============================================

/**
 * Verifica o status de conexão do Stripe Connect
 */
export async function getStripeConnectionStatus(): Promise<StripeConnectionStatus> {
  try {
    const { data, error } = await api.call<StripeConnectResponse>('stripe-connect-oauth', {
      action: 'status' as StripeConnectAction,
    });

    if (error) {
      log.error("Error checking status:", error);
      return {
        connected: false,
        account_id: null,
        email: null,
        livemode: null,
        connected_at: null,
      };
    }

    return {
      connected: data?.connected ?? false,
      account_id: data?.account_id ?? null,
      email: data?.email ?? null,
      livemode: data?.livemode ?? null,
      connected_at: data?.connected_at ?? null,
    };
  } catch (err) {
    log.error("Status check exception:", err);
    return {
      connected: false,
      account_id: null,
      email: null,
      livemode: null,
      connected_at: null,
    };
  }
}

/**
 * Inicia o fluxo OAuth do Stripe Connect
 * Retorna a URL para redirecionamento
 */
export async function startStripeConnect(): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await api.call<StripeConnectResponse>('stripe-connect-oauth', {
      action: 'start' as StripeConnectAction,
    });

    if (error) {
      log.error("Error starting connect:", error);
      return { success: false, error: error.message || 'Erro ao iniciar conexão' };
    }

    if (data?.url) {
      return { success: true, url: data.url };
    }

    return { success: false, error: data?.error || 'Erro ao iniciar conexão' };
  } catch (err) {
    log.error("Start connect exception:", err);
    return { success: false, error: 'Erro de conexão' };
  }
}

/**
 * Desconecta a conta Stripe Connect
 */
export async function disconnectStripe(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await api.call<StripeConnectResponse>('stripe-connect-oauth', {
      action: 'disconnect' as StripeConnectAction,
    });

    if (error) {
      log.error("Error disconnecting:", error);
      return { success: false, error: error.message || 'Erro ao desconectar' };
    }

    if (data?.success) {
      return { success: true };
    }

    return { success: false, error: data?.error || 'Erro ao desconectar' };
  } catch (err) {
    log.error("Disconnect exception:", err);
    return { success: false, error: 'Erro de conexão' };
  }
}

/**
 * Verifica se o Stripe está conectado
 */
export async function isStripeConnected(): Promise<boolean> {
  const status = await getStripeConnectionStatus();
  return status.connected;
}

/**
 * Retorna a configuração formatada do Stripe
 */
export async function getStripeConfig(): Promise<StripeConfig | null> {
  const status = await getStripeConnectionStatus();
  
  if (!status.connected || !status.account_id) {
    return null;
  }

  return {
    accountId: status.account_id,
    email: status.email,
    livemode: status.livemode ?? false,
    connectedAt: status.connected_at,
    isConfigured: true,
  };
}
