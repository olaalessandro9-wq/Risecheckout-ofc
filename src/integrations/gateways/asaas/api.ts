/**
 * Asaas Gateway API
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 * MIGRATED: Uses Edge Functions for all operations
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type {
  AsaasEnvironment,
  AsaasPaymentRequest,
  AsaasPaymentResponse,
  AsaasValidationResult,
  AsaasIntegrationConfig,
} from "./types";

const log = createLogger("Asaas");

interface AsaasValidationApiResponse {
  valid?: boolean;
  message?: string;
  accountName?: string;
  walletId?: string;
}

interface AsaasPaymentApiResponse {
  success?: boolean;
  transactionId?: string;
  status?: string;
  qrCode?: string;
  qrCodeText?: string;
  pixId?: string;
  errorMessage?: string;
}

interface AsaasConfigResponse {
  success?: boolean;
  data?: {
    config?: {
      environment?: AsaasEnvironment;
      has_api_key?: boolean;
    };
  };
}

interface IntegrationManagementResponse {
  success?: boolean;
  error?: string;
}

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
    const { data, error } = await api.publicCall<AsaasValidationApiResponse>('asaas-validate-credentials', {
      apiKey,
      environment,
    });

    if (error) {
      log.error("Validation error", error);
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
    log.error("Validation exception", err);
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
    const { data, error } = await api.publicCall<AsaasPaymentApiResponse>('asaas-create-payment', {
      ...request,
      paymentMethod: 'pix',
    });

    if (error) {
      log.error("PIX payment error", error);
      return {
        success: false,
        errorMessage: error.message || 'Erro ao criar pagamento PIX',
      };
    }

    return {
      success: data?.success ?? false,
      transactionId: data?.transactionId,
      status: data?.status as AsaasPaymentResponse['status'],
      qrCode: data?.qrCode,
      qrCodeText: data?.qrCodeText,
      pixId: data?.pixId,
      errorMessage: data?.errorMessage,
    };
  } catch (err) {
    log.error("PIX payment exception", err);
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
    const { data, error } = await api.publicCall<AsaasPaymentApiResponse>('asaas-create-payment', {
      ...request,
      paymentMethod: 'credit_card',
    });

    if (error) {
      log.error("Credit card payment error", error);
      return {
        success: false,
        errorMessage: error.message || 'Erro ao criar pagamento com cartão',
      };
    }

    return {
      success: data?.success ?? false,
      transactionId: data?.transactionId,
      status: data?.status as AsaasPaymentResponse['status'],
      errorMessage: data?.errorMessage,
    };
  } catch (err) {
    log.error("Credit card payment exception", err);
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
    const { data, error } = await api.publicCall<AsaasConfigResponse>('vendor-integrations', {
      action: 'get-config',
      vendorId,
      integrationType: INTEGRATION_TYPE,
    });

    if (error) {
      log.error("Get settings error", error);
      return null;
    }

    if (!data?.success || !data?.data) {
      return null;
    }

    const config = data.data.config;
    return {
      api_key: '', // Not exposed via public endpoint
      environment: config?.environment || 'sandbox',
      wallet_id: undefined, // Not exposed
      validated_at: undefined,
      account_name: undefined,
      // For checking if connected, use has_api_key
      _has_api_key: config?.has_api_key,
    } as AsaasIntegrationConfig;
  } catch (err) {
    log.error("Get settings exception", err);
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
    // Salvar credenciais via integration-management
    const { data: result, error } = await api.call<IntegrationManagementResponse>('integration-management', {
      action: 'save-credentials',
      integrationType: INTEGRATION_TYPE,
      config: {
        api_key: config.api_key,
        environment: config.environment,
        wallet_id: config.wallet_id,
        validated_at: config.validated_at,
        account_name: config.account_name,
      },
    });

    if (error || !result?.success) {
      log.error("Save settings error", result?.error || error);
      return { success: false, error: result?.error || error?.message || 'Erro ao salvar configurações' };
    }

    // Salvar wallet_id no profile via Edge Function
    if (config.wallet_id) {
      const { error: walletError } = await api.call<IntegrationManagementResponse>('integration-management', {
        action: 'save-profile-wallet',
        walletId: config.wallet_id,
      });

      if (walletError) {
        log.warn("Erro ao atualizar profiles.asaas_wallet_id", walletError);
      } else {
        log.info("profiles.asaas_wallet_id atualizado", { wallet_id: config.wallet_id });
      }
    }

    return { success: true };
  } catch (err) {
    log.error("Save settings exception", err);
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
    // Disconnect via Edge Function
    const { data: result, error } = await api.call<IntegrationManagementResponse>('integration-management', {
      action: 'disconnect',
      integrationType: INTEGRATION_TYPE,
    });

    if (error || !result?.success) {
      log.error("Disconnect error", result?.error || error);
      return { success: false, error: result?.error || error?.message };
    }

    // Limpar wallet_id no profile
    await api.call<IntegrationManagementResponse>('integration-management', {
      action: 'clear-profile-wallet',
    });

    log.info("Desconectado e wallet_id limpo", { vendorId });
    return { success: true };
  } catch (err) {
    log.error("Disconnect exception", err);
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
