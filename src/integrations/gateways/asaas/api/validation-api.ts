/**
 * Asaas Validation API
 * 
 * @module integrations/gateways/asaas/api/validation-api
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Funções para validação de credenciais do gateway Asaas.
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type {
  AsaasEnvironment,
  AsaasValidationResult,
} from "../types";

const log = createLogger("AsaasValidationAPI");

// ============================================
// TYPES
// ============================================

interface AsaasValidationApiResponse {
  valid?: boolean;
  message?: string;
  accountName?: string;
  walletId?: string;
}

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
