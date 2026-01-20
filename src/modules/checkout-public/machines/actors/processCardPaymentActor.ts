/**
 * Process Card Payment Actor
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles credit card payment processing for all gateways.
 * Returns payment status and navigation data.
 * 
 * @module checkout-public/machines/actors
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

// Type defined locally to avoid circular import issues
interface CardNavigationData {
  type: 'card';
  orderId: string;
  accessToken: string;
  status: 'approved' | 'pending' | 'rejected';
  requires3DS?: boolean;
  threeDSClientSecret?: string;
}

const log = createLogger("ProcessCardPaymentActor");

// ============================================================================
// MERCADOPAGO REJECTION REASON MAPPER
// ============================================================================

/**
 * Maps MercadoPago status_detail codes to user-friendly Portuguese messages.
 * @see https://www.mercadopago.com.br/developers/pt/docs/checkout-api/response-handling/collection-results
 */
function mapMercadoPagoRejectionReason(statusDetail?: string): string {
  const reasons: Record<string, string> = {
    'cc_rejected_bad_filled_security_code': 'CVV inválido. Verifique o código de segurança.',
    'cc_rejected_bad_filled_card_number': 'Número do cartão inválido.',
    'cc_rejected_bad_filled_date': 'Data de validade inválida.',
    'cc_rejected_bad_filled_other': 'Dados do cartão inválidos. Verifique as informações.',
    'cc_rejected_insufficient_amount': 'Saldo insuficiente no cartão.',
    'cc_rejected_call_for_authorize': 'Ligue para sua operadora para autorizar este pagamento.',
    'cc_rejected_card_disabled': 'Cartão desabilitado. Entre em contato com seu banco.',
    'cc_rejected_duplicated_payment': 'Pagamento duplicado. Já existe uma transação similar.',
    'cc_rejected_high_risk': 'Pagamento recusado por segurança. Tente outro cartão.',
    'cc_rejected_max_attempts': 'Limite de tentativas excedido. Aguarde e tente novamente.',
    'cc_rejected_card_type_not_allowed': 'Tipo de cartão não aceito para esta compra.',
    'cc_rejected_blacklist': 'Cartão bloqueado. Entre em contato com seu banco.',
    'cc_rejected_other_reason': 'Pagamento recusado pelo banco. Tente outro cartão.',
  };
  return reasons[statusDetail || ''] || 'Pagamento recusado. Verifique os dados ou use outro cartão.';
}

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessCardInput {
  orderId: string;
  accessToken: string;
  gateway: 'mercadopago' | 'stripe' | 'asaas';
  amount: number;
  formData: {
    name: string;
    email: string;
    cpf?: string;
    phone?: string;
  };
  cardToken: string;
  installments: number;
  paymentMethodId?: string;
  issuerId?: string;
  holderDocument?: string;
}

export interface ProcessCardOutput {
  success: boolean;
  navigationData?: CardNavigationData;
  error?: string;
}

// ============================================================================
// GATEWAY PROCESSORS
// ============================================================================

async function processMercadoPago(input: ProcessCardInput): Promise<ProcessCardOutput> {
  log.info("MercadoPago - processing card payment");

  const { data, error } = await api.publicCall<{
    success: boolean;
    error?: string;
    data?: { 
      status?: string;
      status_detail?: string;
    };
  }>("mercadopago-create-payment", {
    orderId: input.orderId,
    payerEmail: input.formData.email,
    payerName: input.formData.name,
    payerDocument: input.holderDocument?.replace(/\D/g, '') || null,
    paymentMethod: 'credit_card',
    token: input.cardToken,
    installments: input.installments,
    paymentMethodId: input.paymentMethodId,
    issuerId: input.issuerId,
  });

  if (error || !data?.success) {
    log.error("MercadoPago card payment failed", { error: error?.message || data?.error });
    return { 
      success: false, 
      error: data?.error || error?.message || "Erro ao processar pagamento com cartão" 
    };
  }

  const status = data.data?.status;
  const statusDetail = data.data?.status_detail;

  log.info("MercadoPago card payment result", { status, statusDetail });

  // CRITICAL: Rejected payments should return success: false
  // This ensures the state machine returns to the form with an error message
  if (status === 'rejected') {
    const userFriendlyError = mapMercadoPagoRejectionReason(statusDetail);
    log.warn("Card payment rejected", { statusDetail, userFriendlyError });
    return {
      success: false,
      error: userFriendlyError,
    };
  }

  // Only approved and pending statuses reach here
  const mappedStatus = status === 'approved' ? 'approved' : 'pending';

  return {
    success: true,
    navigationData: {
      type: 'card',
      orderId: input.orderId,
      accessToken: input.accessToken,
      status: mappedStatus,
    },
  };
}

async function processAsaas(input: ProcessCardInput): Promise<ProcessCardOutput> {
  log.info("Asaas - processing card payment");

  const { data, error } = await api.publicCall<{
    success: boolean;
    error?: string;
    status?: string;
  }>("asaas-create-payment", {
    orderId: input.orderId,
    amountCents: input.amount,
    customer: {
      name: input.formData.name,
      email: input.formData.email,
      document: input.formData.cpf?.replace(/\D/g, '') || '',
      phone: input.formData.phone || undefined,
    },
    description: `Pedido ${input.orderId}`,
    paymentMethod: 'credit_card',
    creditCard: {
      token: input.cardToken,
      installments: input.installments,
    },
  });

  if (error || !data?.success) {
    log.error("Asaas card payment failed", { error: error?.message || data?.error });
    return { 
      success: false, 
      error: data?.error || error?.message || "Erro ao processar pagamento Asaas" 
    };
  }

  const status = data.status === 'CONFIRMED' || data.status === 'RECEIVED' ? 'approved' :
                 data.status === 'REFUSED' ? 'rejected' : 'pending';

  return {
    success: true,
    navigationData: {
      type: 'card',
      orderId: input.orderId,
      accessToken: input.accessToken,
      status,
    },
  };
}

async function processStripe(input: ProcessCardInput): Promise<ProcessCardOutput> {
  log.info("Stripe - processing card payment");

  const { data, error } = await api.publicCall<{
    success: boolean;
    error?: string;
    status?: string;
    requires_action?: boolean;
    client_secret?: string;
  }>("stripe-create-payment", {
    orderId: input.orderId,
    paymentMethodId: input.cardToken,
    amount: input.amount,
    email: input.formData.email,
  });

  if (error || !data?.success) {
    log.error("Stripe card payment failed", { error: error?.message || data?.error });
    return { 
      success: false, 
      error: data?.error || error?.message || "Erro ao processar pagamento Stripe" 
    };
  }

  // Handle 3DS requirement
  if (data.requires_action) {
    return {
      success: true,
      navigationData: {
        type: 'card',
        orderId: input.orderId,
        accessToken: input.accessToken,
        status: 'pending',
        requires3DS: true,
        threeDSClientSecret: data.client_secret,
      },
    };
  }

  const status = data.status === 'succeeded' ? 'approved' : 
                 data.status === 'failed' ? 'rejected' : 'pending';

  return {
    success: true,
    navigationData: {
      type: 'card',
      orderId: input.orderId,
      accessToken: input.accessToken,
      status,
    },
  };
}

// ============================================================================
// ACTOR
// ============================================================================

export const processCardPaymentActor = fromPromise<ProcessCardOutput, ProcessCardInput>(
  async ({ input }) => {
    log.info("Processing card payment", { 
      orderId: input.orderId,
      gateway: input.gateway,
      installments: input.installments,
    });

    switch (input.gateway) {
      case 'mercadopago':
        return processMercadoPago(input);

      case 'asaas':
        return processAsaas(input);

      case 'stripe':
        return processStripe(input);

      default:
        log.error("Unsupported card gateway", { gateway: input.gateway });
        return { 
          success: false, 
          error: `Gateway de cartão não suportado: ${input.gateway}` 
        };
    }
  }
);
