/**
 * Asaas Gateway API
 * 
 * Funções para comunicação com as Edge Functions do Asaas.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
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
// SETTINGS (vendor_integrations)
// ============================================

/**
 * Busca as configurações do Asaas para um vendor
 */
export async function getAsaasSettings(
  vendorId: string
): Promise<AsaasIntegrationConfig | null> {
  try {
    const { data, error } = await supabase
      .from('vendor_integrations')
      .select('config, active')
      .eq('vendor_id', vendorId)
      .eq('integration_type', INTEGRATION_TYPE)
      .maybeSingle();

    if (error) {
      console.error('[Asaas] Get settings error:', error);
      return null;
    }

    if (!data || !data.active) {
      return null;
    }

    const config = data.config as Record<string, unknown>;
    return {
      api_key: (config?.api_key as string) || '',
      environment: (config?.environment as AsaasEnvironment) || 'sandbox',
      wallet_id: config?.wallet_id as string | undefined,
      validated_at: config?.validated_at as string | undefined,
      account_name: config?.account_name as string | undefined,
    };
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
    const { data: result, error } = await supabase.functions.invoke('integration-management/save-credentials', {
      body: {
        integrationType: INTEGRATION_TYPE,
        config: {
          api_key: config.api_key,
          environment: config.environment,
          wallet_id: config.wallet_id,
          validated_at: config.validated_at,
          account_name: config.account_name,
        },
        sessionToken,
      }
    });

    if (error || !result?.success) {
      console.error('[Asaas] Save settings error:', result?.error || error);
      return { success: false, error: result?.error || error?.message || 'Erro ao salvar configurações' };
    }

    // Salvar wallet_id no profile via Edge Function
    if (config.wallet_id) {
      const { data: walletResult, error: walletError } = await supabase.functions.invoke('integration-management/save-profile-wallet', {
        body: {
          walletId: config.wallet_id,
          sessionToken,
        }
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
    const { data: result, error } = await supabase.functions.invoke('integration-management/disconnect', {
      body: {
        integrationType: INTEGRATION_TYPE,
        sessionToken,
      }
    });

    if (error || !result?.success) {
      console.error('[Asaas] Disconnect error:', result?.error || error);
      return { success: false, error: result?.error || error?.message };
    }

    // Limpar wallet_id no profile
    await supabase.functions.invoke('integration-management/clear-profile-wallet', {
      body: { sessionToken }
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
  return settings !== null && !!settings.api_key;
}
