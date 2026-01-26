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
import { publicApi } from "@/lib/api/public-client";
import { createLogger } from "@/lib/logger";
import type { PixNavigationData } from "@/types/checkout-payment.types";

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
  log.info("PushinPay - creating PIX payment in actor (RISE V3 unified flow)");

  // RISE V3 FIX: Generate QR code HERE, not on the payment page
  // This ensures consistent behavior across all gateways
  const { data, error } = await publicApi.call<{
    ok: boolean;
    pix?: {
      id?: string;
      pix_id?: string;
      qr_code?: string;
      qr_code_base64?: string;
      status?: string;
      value?: number;
    };
    error?: string;
  }>("pushinpay-create-pix", {
    orderId: input.orderId,
    valueInCents: input.amount,
  });

  if (error || !data?.ok) {
    log.error("PushinPay PIX creation failed", { 
      error: error?.message ?? data?.error ?? "Unknown error",
      orderId: input.orderId,
      amount: input.amount,
    });
    return { 
      success: false, 
      error: data?.error ?? error?.message ?? "Erro ao gerar QR Code do PushinPay" 
    };
  }

  log.info("PushinPay PIX created successfully", { 
    pixId: data.pix?.id ?? data.pix?.pix_id,
    orderId: input.orderId,
  });

  return {
    success: true,
    navigationData: {
      type: 'pix',
      orderId: input.orderId,
      accessToken: input.accessToken,
      gateway: 'pushinpay',
      amount: input.amount,
      checkoutSlug: input.checkoutSlug,
      qrCode: data.pix?.qr_code,
      qrCodeBase64: data.pix?.qr_code_base64,
    },
  };
}

async function processMercadoPago(input: ProcessPixInput): Promise<ProcessPixOutput> {
  log.info("MercadoPago - creating PIX payment");

  const { data, error } = await publicApi.call<{
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

  const { data, error } = await publicApi.call<{
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
      qrCode: data.qrCodeText,       // EMV copia e cola (payload)
      qrCodeBase64: data.qrCode,     // Imagem base64 (encodedImage)
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
  // Stripe PIX: Implementar quando habilitado na plataforma via Stripe Dashboard
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
