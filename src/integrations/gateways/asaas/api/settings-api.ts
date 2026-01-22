/**
 * Asaas Settings API
 * 
 * @module integrations/gateways/asaas/api/settings-api
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Funções para gerenciamento de configurações do gateway Asaas.
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type {
  AsaasEnvironment,
  AsaasIntegrationConfig,
} from "../types";

const log = createLogger("AsaasSettingsAPI");

// ============================================
// TYPES
// ============================================

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
// GET SETTINGS
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

// ============================================
// SAVE SETTINGS
// ============================================

/**
 * Salva as configurações do Asaas para um vendor via Edge Function
 * 
 * @note O parâmetro vendorId não é mais necessário pois a Edge Function
 *       usa o token de autenticação para identificar o vendor.
 */
export async function saveAsaasSettings(
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

// ============================================
// DISCONNECT
// ============================================

/**
 * Desconecta o Asaas via Edge Function
 * 
 * @note O parâmetro vendorId não é mais necessário pois a Edge Function
 *       usa o token de autenticação para identificar o vendor.
 */
export async function disconnectAsaas(): Promise<{ success: boolean; error?: string }> {
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

    log.info("Desconectado e wallet_id limpo");
    return { success: true };
  } catch (err) {
    log.error("Disconnect exception", err);
    return {
      success: false,
      error: 'Erro ao desconectar',
    };
  }
}

// ============================================
// CONNECTION STATUS
// ============================================

/**
 * Verifica se o Asaas está conectado para um vendor
 */
export async function isAsaasConnected(vendorId: string): Promise<boolean> {
  const settings = await getAsaasSettings(vendorId);
  // Check the internal flag since api_key is not exposed
  return settings !== null && !!(settings as AsaasIntegrationConfig & { _has_api_key?: boolean })._has_api_key;
}
