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
 * Salva as configurações do Asaas para um vendor
 */
export async function saveAsaasSettings(
  vendorId: string,
  config: AsaasIntegrationConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if exists first
    const { data: existing } = await supabase
      .from('vendor_integrations')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('integration_type', INTEGRATION_TYPE)
      .maybeSingle();

    if (existing) {
      // Update
      const { error } = await supabase
        .from('vendor_integrations')
        .update({
          config: config as unknown as Json,
          active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('[Asaas] Update settings error:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('vendor_integrations')
        .insert([{
          vendor_id: vendorId,
          integration_type: INTEGRATION_TYPE,
          config: config as unknown as Json,
          active: true,
        }]);

      if (error) {
        console.error('[Asaas] Insert settings error:', error);
        return { success: false, error: error.message };
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
 * Desconecta o Asaas (desativa a integração)
 */
export async function disconnectAsaas(
  vendorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('vendor_integrations')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('vendor_id', vendorId)
      .eq('integration_type', INTEGRATION_TYPE);

    if (error) {
      console.error('[Asaas] Disconnect error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

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
