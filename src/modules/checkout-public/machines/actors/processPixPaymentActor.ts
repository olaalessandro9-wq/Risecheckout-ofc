/**
 * Process PIX Payment Actor
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles PIX payment processing for all gateways.
 * Generates QR codes or prepares navigation data.
 * 
 * @module checkout-public/machines/actors
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

// Type imported from parent directory's types file
interface PixNavigationData {
  type: 'pix';
  orderId: string;
  accessToken: string;
  gateway: 'pushinpay' | 'mercadopago' | 'stripe' | 'asaas';
  amount: number;
  checkoutSlug: string;
  qrCode?: string;
  qrCodeBase64?: string;
  qrCodeText?: string;
}

const log = createLogger("ProcessPixPaymentActor");

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessPixInput {
  orderId: string;
  accessToken: string;
  gateway: 'pushinpay' | 'mercadopago' | 'stripe' | 'asaas';
  amount: number;
  checkoutSlug: string;
  formData: {
    name: string;
    email: string;
    cpf?: string;
    phone?: string;
  };
}

export interface ProcessPixOutput {
  success: boolean;
  navigationData?: PixNavigationData;
  error?: string;
}

// ============================================================================
// GATEWAY PROCESSORS
// ============================================================================

async function processPushinPay(input: ProcessPixInput): Promise<ProcessPixOutput> {
  // PushinPay: QR code is generated on the PIX payment page
  log.info("PushinPay - delegating QR generation to payment page");
  
  return {
    success: true,
    navigationData: {
      type: 'pix',
      orderId: input.orderId,
      accessToken: input.accessToken,
      gateway: 'pushinpay',
      amount: input.amount,
      checkoutSlug: input.checkoutSlug,
    },
  };
}

async function processMercadoPago(input: ProcessPixInput): Promise<ProcessPixOutput> {
  log.info("MercadoPago - creating PIX payment");

  const { data, error } = await api.publicCall<{
    success: boolean;
    error?: string;
    data?: {
      pix?: {
        qrCode?: string;
        qr_code?: string;
        qrCodeBase64?: string;
        qr_code_base64?: string;
      };
    };
  }>("mercadopago-create-payment", {
    orderId: input.orderId,
    payerEmail: input.formData.email,
    payerName: input.formData.name,
    payerDocument: input.formData.cpf?.replace(/\D/g, '') || null,
    paymentMethod: 'pix',
    token: null,
    installments: 1,
  });

  if (error || !data?.success) {
    log.error("MercadoPago PIX creation failed", { error: error?.message ?? data?.error ?? "Unknown error" });
    return { 
      success: false, 
      error: data?.error ?? error?.message ?? "Erro ao gerar QR Code do MercadoPago" 
    };
  }

  const pixData = data.data?.pix;
  
  return {
    success: true,
    navigationData: {
      type: 'pix',
      orderId: input.orderId,
      accessToken: input.accessToken,
      gateway: 'mercadopago',
      amount: input.amount,
      checkoutSlug: input.checkoutSlug,
      qrCode: pixData?.qrCode || pixData?.qr_code,
      qrCodeBase64: pixData?.qrCodeBase64 || pixData?.qr_code_base64,
    },
  };
}

async function processAsaas(input: ProcessPixInput): Promise<ProcessPixOutput> {
  log.info("Asaas - creating PIX payment");

  const { data, error } = await api.publicCall<{
    success: boolean;
    error?: string;
    qrCode?: string;
    qrCodeText?: string;
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
    paymentMethod: 'pix',
  });

  if (error || !data?.success) {
    log.error("Asaas PIX creation failed", { error: error?.message ?? data?.error ?? "Unknown error" });
    return { 
      success: false, 
      error: data?.error ?? error?.message ?? "Erro ao gerar QR Code do Asaas" 
    };
  }

  return {
    success: true,
    navigationData: {
      type: 'pix',
      orderId: input.orderId,
      accessToken: input.accessToken,
      gateway: 'asaas',
      amount: input.amount,
      checkoutSlug: input.checkoutSlug,
      qrCode: data.qrCode,
      qrCodeText: data.qrCodeText,
    },
  };
}

async function processStripe(input: ProcessPixInput): Promise<ProcessPixOutput> {
  // ⚠️ STRIPE PIX NOT IMPLEMENTED
  // Stripe PIX requires additional configuration:
  // 1. Enable PIX payment method in Stripe Dashboard
  // 2. Implement PaymentIntent creation with payment_method_types: ['pix']
  // 3. Handle webhook confirmations for async PIX payments
  // 
  // Current behavior: Delegates to payment page for manual handling
  // TODO: Implement when Stripe PIX is enabled on the platform
  log.warn("Stripe PIX is not fully implemented - delegating to payment page");

  return {
    success: true,
    navigationData: {
      type: 'pix',
      orderId: input.orderId,
      accessToken: input.accessToken,
      gateway: 'stripe',
      amount: input.amount,
      checkoutSlug: input.checkoutSlug,
    },
  };
}

// ============================================================================
// ACTOR
// ============================================================================

export const processPixPaymentActor = fromPromise<ProcessPixOutput, ProcessPixInput>(
  async ({ input }) => {
    log.info("Processing PIX payment", { 
      orderId: input.orderId,
      gateway: input.gateway,
      amount: input.amount,
    });

    switch (input.gateway) {
      case 'pushinpay':
        return processPushinPay(input);

      case 'mercadopago':
        return processMercadoPago(input);

      case 'asaas':
        return processAsaas(input);

      case 'stripe':
        return processStripe(input);

      default:
        log.error("Unsupported PIX gateway", { gateway: input.gateway });
        return { 
          success: false, 
          error: `Gateway PIX não suportado: ${input.gateway}` 
        };
    }
  }
);
