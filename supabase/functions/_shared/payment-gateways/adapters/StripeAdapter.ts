/**
 * Stripe Adapter - Implementação do Gateway de Pagamento Stripe
 * 
 * Seguindo o padrão de arquitetura multi-gateway do RiseCheckout.
 * Suporta:
 * - Pagamentos com cartão de crédito
 * - PIX via Stripe (Brasil)
 * - Split de pagamentos (Stripe Connect)
 */

import Stripe from "https://esm.sh/stripe@14.14.0";
import { IPaymentGateway } from "./IPaymentGateway.ts";
import { PaymentRequest, PaymentResponse, GatewayCredentials } from "./types.ts";
import { calculatePlatformFeeCents } from "../platform-config.ts";

export interface StripeCredentials extends GatewayCredentials {
  secret_key: string;
  connected_account_id?: string; // Para Stripe Connect
  is_test?: boolean;
}

export interface StripePaymentIntentResult {
  client_secret: string;
  payment_intent_id: string;
  status: string;
  amount: number;
  currency: string;
}

export interface StripePixResult {
  qr_code: string;
  qr_code_text: string;
  expires_at: string;
  payment_intent_id: string;
}

export class StripeAdapter implements IPaymentGateway {
  readonly providerName = "stripe";
  private stripe: Stripe;
  private connectedAccountId?: string;
  private isTest: boolean;

  constructor(credentials: StripeCredentials) {
    this.stripe = new Stripe(credentials.secret_key, {
      apiVersion: "2023-10-16",
    });
    this.connectedAccountId = credentials.connected_account_id;
    this.isTest = credentials.is_test ?? false;
  }

  /**
   * Cria um Payment Intent para cartão de crédito
   */
  async createCreditCard(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log(`[StripeAdapter] Creating card payment for order ${request.order_id}`);
      
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: request.amount_cents,
        currency: "brl",
        payment_method_types: ["card"],
        metadata: {
          order_id: request.order_id,
          customer_email: request.customer.email,
          customer_name: request.customer.name,
        },
        description: request.description,
      };

      // Se tem conta conectada (Stripe Connect), adicionar split
      if (this.connectedAccountId) {
        // Taxa da plataforma: 4% (padronizado em platform-config.ts)
        const platformFee = calculatePlatformFeeCents(request.amount_cents);
        paymentIntentParams.application_fee_amount = platformFee;
        paymentIntentParams.transfer_data = {
          destination: this.connectedAccountId,
        };
        console.log(`[StripeAdapter] Split payment: platform fee ${platformFee} centavos`);
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      console.log(`[StripeAdapter] Payment Intent created: ${paymentIntent.id}`);

      return {
        success: true,
        transaction_id: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        raw_response: {
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
      };
    } catch (error: unknown) {
      console.error(`[StripeAdapter] Error creating card payment:`, error);
      return {
        success: false,
        transaction_id: "",
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Cria um pagamento PIX via Stripe
   */
  async createPix(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log(`[StripeAdapter] Creating PIX payment for order ${request.order_id}`);

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: request.amount_cents,
        currency: "brl",
        payment_method_types: ["pix"],
        metadata: {
          order_id: request.order_id,
          customer_email: request.customer.email,
          customer_name: request.customer.name,
        },
        description: request.description,
      };

      // Se tem conta conectada (Stripe Connect), adicionar split
      if (this.connectedAccountId) {
        // Taxa da plataforma: 4% (padronizado em platform-config.ts)
        const platformFee = calculatePlatformFeeCents(request.amount_cents);
        paymentIntentParams.application_fee_amount = platformFee;
        paymentIntentParams.transfer_data = {
          destination: this.connectedAccountId,
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      // Confirmar o payment intent para gerar o QR Code PIX
      const confirmedIntent = await this.stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method_data: {
          type: "pix",
        },
      });

      // Extrair dados do PIX do next_action
      const pixAction = confirmedIntent.next_action?.pix_display_qr_code;

      if (!pixAction) {
        throw new Error("PIX QR Code not generated by Stripe");
      }

      console.log(`[StripeAdapter] PIX Payment Intent created: ${confirmedIntent.id}`);

      return {
        success: true,
        transaction_id: confirmedIntent.id,
        status: this.mapStripeStatus(confirmedIntent.status),
        qr_code: pixAction.image_url_png || "",
        qr_code_text: pixAction.data || "",
        raw_response: {
          payment_intent_id: confirmedIntent.id,
          expires_at: pixAction.expires_at,
          hosted_instructions_url: pixAction.hosted_instructions_url,
        },
      };
    } catch (error: unknown) {
      console.error(`[StripeAdapter] Error creating PIX payment:`, error);
      return {
        success: false,
        transaction_id: "",
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Confirma um Payment Intent com o token do cartão
   */
  async confirmCardPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentResponse> {
    try {
      console.log(`[StripeAdapter] Confirming payment ${paymentIntentId}`);

      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      return {
        success: paymentIntent.status === "succeeded",
        transaction_id: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        raw_response: paymentIntent,
      };
    } catch (error: unknown) {
      console.error(`[StripeAdapter] Error confirming payment:`, error);
      return {
        success: false,
        transaction_id: paymentIntentId,
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Busca status de um Payment Intent
   */
  async getPaymentStatus(paymentIntentId: string): Promise<PaymentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: paymentIntent.status === "succeeded",
        transaction_id: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        raw_response: paymentIntent,
      };
    } catch (error: unknown) {
      return {
        success: false,
        transaction_id: paymentIntentId,
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Cria um reembolso
   */
  async createRefund(
    paymentIntentId: string,
    amountCents?: number,
    reason?: string
  ): Promise<{ success: boolean; refund_id?: string; error?: string }> {
    try {
      console.log(`[StripeAdapter] Creating refund for ${paymentIntentId}`);

      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amountCents) {
        refundParams.amount = amountCents;
      }

      if (reason) {
        refundParams.reason = reason as Stripe.RefundCreateParams.Reason;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      return {
        success: refund.status === "succeeded",
        refund_id: refund.id,
      };
    } catch (error: unknown) {
      console.error(`[StripeAdapter] Error creating refund:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Valida as credenciais da conta Stripe
   */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.stripe.accounts.retrieve();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Mapeia status do Stripe para status padronizado
   */
  private mapStripeStatus(stripeStatus: string): PaymentResponse["status"] {
    const statusMap: Record<string, PaymentResponse["status"]> = {
      succeeded: "approved",
      processing: "pending",
      requires_payment_method: "pending",
      requires_confirmation: "pending",
      requires_action: "pending",
      canceled: "cancelled",
      requires_capture: "pending",
    };

    return statusMap[stripeStatus] || "pending";
  }
}

/**
 * Factory function para criar instância do StripeAdapter
 */
export function createStripeAdapter(credentials: StripeCredentials): StripeAdapter {
  return new StripeAdapter(credentials);
}
