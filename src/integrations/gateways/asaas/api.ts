/**
 * Asaas Gateway API
 * 
 * MIGRATED: Uses Edge Functions for all operations
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  AsaasEnvironment,
  AsaasPaymentRequest,
  AsaasPaymentResponse,
  AsaasValidationResult,
  AsaasIntegrationConfig,
} from "./types";

// ============================================
// CONSTANTS
// ============================================

const INTEGRATION_TYPE = 'ASAAS';

// ============================================
// VALIDATION
// ============================================

/**
 * Valida as credenciais do Asaas chamando a Edge Function
 */
export async function validateAsaasCredentials(
  apiKey: string,
  environment: AsaasEnvironment
): Promise<AsaasValidationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('asaas-validate-credentials', {
      body: {
        apiKey,
        environment,
      },
    });

    if (error) {
      console.error('[Asaas] Validation error:', error);
      return {
        valid: false,
        message: error.message || 'Erro ao validar credenciais',
      };
    }

    return {
      valid: data?.valid ?? false,
      message: data?.message,
      accountName: data?.accountName,
      walletId: data?.walletId,
    };
  } catch (err) {
    console.error('[Asaas] Validation exception:', err);
    return {
      valid: false,
      message: 'Erro de conexão ao validar credenciais',
    };
  }
}

// ============================================
// PAYMENTS
// ============================================

/**
 * Cria um pagamento PIX via Asaas
 */
export async function createAsaasPixPayment(
  request: AsaasPaymentRequest
): Promise<AsaasPaymentResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('asaas-create-payment', {
      body: {
        ...request,
        paymentMethod: 'pix',
      },
    });

    if (error) {
      console.error('[Asaas] PIX payment error:', error);
      return {
        success: false,
        errorMessage: error.message || 'Erro ao criar pagamento PIX',
      };
    }

    return {
      success: data?.success ?? false,
      transactionId: data?.transactionId,
      status: data?.status,
      qrCode: data?.qrCode,
      qrCodeText: data?.qrCodeText,
      pixId: data?.pixId,
      errorMessage: data?.errorMessage,
    };
  } catch (err) {
    console.error('[Asaas] PIX payment exception:', err);
    return {
      success: false,
      errorMessage: 'Erro de conexão ao criar pagamento PIX',
    };
  }
}

/**
 * Cria um pagamento com Cartão de Crédito via Asaas
 */
export async function createAsaasCreditCardPayment(
  request: AsaasPaymentRequest
): Promise<AsaasPaymentResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('asaas-create-payment', {
      body: {
        ...request,
        paymentMethod: 'credit_card',
      },
    });

    if (error) {
      console.error('[Asaas] Credit card payment error:', error);
      return {
        success: false,
        errorMessage: error.message || 'Erro ao criar pagamento com cartão',
      };
    }

    return {
      success: data?.success ?? false,
      transactionId: data?.transactionId,
      status: data?.status,
      errorMessage: data?.errorMessage,
    };
  } catch (err) {
    console.error('[Asaas] Credit card payment exception:', err);
    return {
      success: false,
      errorMessage: 'Erro de conexão ao criar pagamento com cartão',
    };
  }
}

// ============================================
// SETTINGS (via Edge Functions)
// ============================================

/**
 * Busca as configurações do Asaas para um vendor via Edge Function
 */
export async function getAsaasSettings(
  vendorId: string
): Promise<AsaasIntegrationConfig | null> {
  try {
    const { data, error } = await supabase.functions.invoke('vendor-integrations', {
      body: {
        action: 'get-config',
        vendorId,
        integrationType: INTEGRATION_TYPE,
      },
    });

    if (error) {
      console.error('[Asaas] Get settings error:', error);
      return null;
    }

    if (!data?.success || !data?.data) {
      return null;
    }

    const config = data.data.config as Record<string, unknown>;
    return {
      api_key: '', // Not exposed via public endpoint
      environment: (config?.environment as AsaasEnvironment) || 'sandbox',
      wallet_id: undefined, // Not exposed
      validated_at: undefined,
      account_name: undefined,
      // For checking if connected, use has_api_key
      _has_api_key: config?.has_api_key as boolean,
    } as AsaasIntegrationConfig;
  } catch (err) {
    console.error('[Asaas] Get settings exception:', err);
    return null;
  }
}

/**
 * Salva as configurações do Asaas para um vendor via Edge Function
 */
export async function saveAsaasSettings(
  vendorId: string,
  config: AsaasIntegrationConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const { getProducerSessionToken } = await import("@/hooks/useProducerAuth");
    const sessionToken = getProducerSessionToken();

    // Salvar credenciais via integration-management
    const { data: result, error } = await supabase.functions.invoke('integration-management', {
      body: {
        action: 'save-credentials',
        integrationType: INTEGRATION_TYPE,
        config: {
          api_key: config.api_key,
          environment: config.environment,
          wallet_id: config.wallet_id,
          validated_at: config.validated_at,
          account_name: config.account_name,
        },
      },
      headers: { 'x-producer-session-token': sessionToken || '' },
    });

    if (error || !result?.success) {
      console.error('[Asaas] Save settings error:', result?.error || error);
      return { success: false, error: result?.error || error?.message || 'Erro ao salvar configurações' };
    }

    // Salvar wallet_id no profile via Edge Function
    if (config.wallet_id) {
      const { error: walletError } = await supabase.functions.invoke('integration-management', {
        body: {
          action: 'save-profile-wallet',
          walletId: config.wallet_id,
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (walletError) {
        console.warn('[Asaas] Erro ao atualizar profiles.asaas_wallet_id:', walletError);
      } else {
        console.log('[Asaas] profiles.asaas_wallet_id atualizado:', config.wallet_id);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('[Asaas] Save settings exception:', err);
    return {
      success: false,
      error: 'Erro ao salvar configurações',
    };
  }
}

/**
 * Desconecta o Asaas via Edge Function
 */
export async function disconnectAsaas(
  vendorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { getProducerSessionToken } = await import("@/hooks/useProducerAuth");
    const sessionToken = getProducerSessionToken();

    // Disconnect via Edge Function
    const { data: result, error } = await supabase.functions.invoke('integration-management', {
      body: {
        action: 'disconnect',
        integrationType: INTEGRATION_TYPE,
      },
      headers: { 'x-producer-session-token': sessionToken || '' },
    });

    if (error || !result?.success) {
      console.error('[Asaas] Disconnect error:', result?.error || error);
      return { success: false, error: result?.error || error?.message };
    }

    // Limpar wallet_id no profile
    await supabase.functions.invoke('integration-management', {
      body: { action: 'clear-profile-wallet' },
      headers: { 'x-producer-session-token': sessionToken || '' },
    });

    console.log('[Asaas] Desconectado e wallet_id limpo para vendor:', vendorId);
    return { success: true };
  } catch (err) {
    console.error('[Asaas] Disconnect exception:', err);
    return {
      success: false,
      error: 'Erro ao desconectar',
    };
  }
}

/**
 * Verifica se o Asaas está conectado para um vendor
 */
export async function isAsaasConnected(vendorId: string): Promise<boolean> {
  const settings = await getAsaasSettings(vendorId);
  // Check the internal flag since api_key is not exposed
  return settings !== null && !!(settings as AsaasIntegrationConfig & { _has_api_key?: boolean })._has_api_key;
}
