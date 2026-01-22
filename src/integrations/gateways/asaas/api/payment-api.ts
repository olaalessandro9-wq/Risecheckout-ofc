/**
 * Asaas Payment API
 * 
 * @module integrations/gateways/asaas/api/payment-api
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Funções para criação de pagamentos PIX e Cartão de Crédito via Asaas.
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type {
  AsaasPaymentRequest,
  AsaasPaymentResponse,
} from "../types";

const log = createLogger("AsaasPaymentAPI");

// ============================================
// TYPES
// ============================================

interface AsaasPaymentApiResponse {
  success?: boolean;
  transactionId?: string;
  status?: string;
  qrCode?: string;
  qrCodeText?: string;
  pixId?: string;
  errorMessage?: string;
}

// ============================================
// PIX PAYMENT
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

// ============================================
// CREDIT CARD PAYMENT
// ============================================

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
