/**
 * AsaasAdapter - Gateway Adapter (RISE V3 Compliant)
 * @module payment-gateways/adapters
 * @version 3.1.0
 */
import { IPaymentGateway } from "../IPaymentGateway.ts";
import { PaymentRequest, PaymentResponse } from "../types.ts";
import { CircuitBreaker, CircuitOpenError, GATEWAY_CIRCUIT_CONFIGS } from "../../circuit-breaker.ts";
import { createLogger } from "../../logger.ts";
import { createGatewayClient, type GatewayHttpClient } from "../../http/index.ts";
import { validateOrderAmount } from "../../validation/index.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { findOrCreateCustomer, type AsaasCustomer } from "../../asaas-customer.ts";
import { createPayment, getPixQrCode, buildSplitRules, getDueDate, parseCardToken, mapAsaasStatus, type AsaasPaymentStatus } from "./asaas-payment-helper.ts";

const log = createLogger("AsaasAdapter");

export class AsaasAdapter implements IPaymentGateway {
  readonly providerName = "asaas";
  private apiKey: string;
  private environment: 'sandbox' | 'production';
  private baseUrl: string;
  private circuitBreaker: CircuitBreaker;
  private httpClient: GatewayHttpClient;
  private supabase: SupabaseClient;
  constructor(
    apiKey: string, 
    environment: 'sandbox' | 'production' = 'production',
    supabase: SupabaseClient
  ) {
    if (!apiKey) {
      throw new Error('Asaas: API Key é obrigatória');
    }
    this.apiKey = apiKey;
    this.environment = environment;
    this.supabase = supabase;
    this.baseUrl = environment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';
    this.circuitBreaker = new CircuitBreaker(GATEWAY_CIRCUIT_CONFIGS.asaas);
    this.httpClient = createGatewayClient({
      gateway: 'asaas',
      baseUrl: this.baseUrl,
      timeout: 15000,
      defaultHeaders: { 
        'Content-Type': 'application/json',
        'access_token': this.apiKey 
      }
    });
  }

  // ============================================
  // PUBLIC METHODS (IPaymentGateway)
  // ============================================

  /**
   * Cria um pagamento via PIX
   */
  async createPix(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      log.info(`Creating PIX payment for order ${request.order_id}`);

      // RISE V3: Validação de preço ANTES de qualquer operação
      const priceValidation = await validateOrderAmount({
        supabase: this.supabase,
        orderId: request.order_id,
        expectedAmountCents: request.amount_cents,
        gateway: 'asaas'
      });

      if (!priceValidation.valid) {
        log.error('SECURITY: Price validation failed', { 
          orderId: request.order_id,
          error: priceValidation.error 
        });
        return this.errorResponse(priceValidation.error || 'Valor inválido');
      }

      return await this.circuitBreaker.execute(async () => {
        // 1. Criar ou buscar customer
        const customer = await findOrCreateCustomer(
          this.baseUrl, 
          this.getHeaders(), 
          request.customer
        );
        
        if (!customer) {
          return this.errorResponse('Erro ao criar/buscar cliente na Asaas');
        }

        // 2. Criar cobrança PIX com split
        const payment = await createPayment(this.baseUrl, this.getHeaders(), {
          customer: customer.id,
          billingType: 'PIX',
          value: request.amount_cents / 100,
          dueDate: getDueDate(),
          externalReference: request.order_id,
          description: request.description,
          split: buildSplitRules(request.split_rules)
        });

        if (!payment || payment.error) {
          return this.errorResponse(payment?.error || 'Erro ao criar cobrança PIX');
        }

        // 3. Obter QR Code
        const qrCode = await getPixQrCode(this.baseUrl, this.getHeaders(), payment.id);
        
        if (!qrCode) {
          return this.errorResponse('Erro ao obter QR Code PIX');
        }

        // 4. Retornar resposta padronizada
        return {
          success: true,
          transaction_id: payment.id,
          status: mapAsaasStatus(payment.status),
          qr_code: qrCode.encodedImage,
          qr_code_text: qrCode.payload,
          raw_response: { payment, qrCode }
        };
      });

    } catch (error: unknown) {
      return this.handleError(error, 'createPix');
    }
  }

  /**
   * Cria um pagamento via Cartão de Crédito
   */
  async createCreditCard(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      log.info(`Creating credit card payment for order ${request.order_id}`);

      if (!request.card_token) {
        return this.errorResponse('Token do cartão é obrigatório');
      }

      // RISE V3: Validação de preço ANTES de qualquer operação
      const priceValidation = await validateOrderAmount({
        supabase: this.supabase,
        orderId: request.order_id,
        expectedAmountCents: request.amount_cents,
        gateway: 'asaas'
      });

      if (!priceValidation.valid) {
        log.error('SECURITY: Price validation failed', { 
          orderId: request.order_id,
          error: priceValidation.error 
        });
        return this.errorResponse(priceValidation.error || 'Valor inválido');
      }

      return await this.circuitBreaker.execute(async () => {
        // 1. Criar ou buscar customer
        const customer = await findOrCreateCustomer(
          this.baseUrl, 
          this.getHeaders(), 
          request.customer
        );
        
        if (!customer) {
          return this.errorResponse('Erro ao criar/buscar cliente na Asaas');
        }

        // 2. Parsear token do cartão
        const cardData = parseCardToken(request.card_token || '');

        // 3. Criar cobrança com cartão e split
        const payload: Record<string, unknown> = {
          customer: customer.id,
          billingType: 'CREDIT_CARD',
          value: request.amount_cents / 100,
          dueDate: getDueDate(),
          externalReference: request.order_id,
          description: request.description,
          installmentCount: request.installments || 1,
          split: buildSplitRules(request.split_rules)
        };

        // Adicionar dados do cartão
        if (cardData.creditCardToken) {
          payload.creditCardToken = cardData.creditCardToken;
        } else if (cardData.creditCard) {
          payload.creditCard = cardData.creditCard;
          payload.creditCardHolderInfo = cardData.creditCardHolderInfo;
        }

        const payment = await createPayment(this.baseUrl, this.getHeaders(), payload);

        if (!payment || payment.error) {
          return this.errorResponse(payment?.error || 'Erro ao criar cobrança com cartão');
        }

        return {
          success: true,
          transaction_id: payment.id,
          status: mapAsaasStatus(payment.status),
          raw_response: payment
        };
      });

    } catch (error: unknown) {
      return this.handleError(error, 'createCreditCard');
    }
  }

  /**
   * Valida se as credenciais (API Key) são válidas
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/finance/balance`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ============================================
  // PRIVATE UTILITY METHODS
  // ============================================

  /**
   * Retorna headers padrão para requisições à API
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'access_token': this.apiKey
    };
  }

  /**
   * Trata erros de forma padronizada
   */
  private handleError(error: unknown, method: string): PaymentResponse {
    if (error instanceof CircuitOpenError) {
      log.warn(`Circuit breaker OPEN: ${error.message}`);
      return {
        success: false,
        transaction_id: '',
        status: 'error',
        raw_response: { circuit_breaker: 'open' },
        error_message: 'Gateway temporariamente indisponível. Tente novamente em alguns segundos.'
      };
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Exception in ${method}:`, error);
    return this.errorResponse(errorMessage);
  }

  /**
   * Retorna resposta de erro padronizada
   */
  private errorResponse(message: string): PaymentResponse {
    return {
      success: false,
      transaction_id: '',
      status: 'error',
      error_message: message
    };
  }
}

// Re-export types for convenience
export type { AsaasCustomer, AsaasPaymentStatus };
