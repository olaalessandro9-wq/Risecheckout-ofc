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
import type { CardNavigationData } from "../checkoutPublicMachine.types";

const log = createLogger("ProcessCardPaymentActor");

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
  const mappedStatus = status === 'approved' ? 'approved' : 
                       status === 'rejected' ? 'rejected' : 'pending';

  log.info("MercadoPago card payment result", { status: mappedStatus });

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
