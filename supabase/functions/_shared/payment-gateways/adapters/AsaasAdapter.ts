/**
 * AsaasAdapter - Adaptador para o gateway Asaas
 * 
 * Este adaptador traduz as requisições padronizadas do RiseCheckout
 * para o formato específico da API da Asaas e vice-versa.
 * 
 * Suporta:
 * - Pagamentos via PIX (QR Code dinâmico)
 * - Pagamentos via Cartão de Crédito (com tokenização)
 * - Split de pagamentos nativo (N recebedores via walletId)
 * - Ambientes de sandbox e produção
 * - Circuit Breaker para resiliência
 * 
 * Documentação Asaas:
 * - Split: https://docs.asaas.com/docs/split-de-pagamentos
 * - PIX: https://docs.asaas.com/docs/pix
 * - Cobranças: https://docs.asaas.com/reference/criar-nova-cobranca
 * 
 * @example
 * ```typescript
 * const adapter = new AsaasAdapter(apiKey, 'production');
 * const result = await adapter.createPix({
 *   amount_cents: 10000,
 *   order_id: 'abc123',
 *   customer: { name: 'João', email: 'joao@example.com', document: '12345678900' },
 *   description: 'Pedido #123'
 * });
 * ```
 * 
 * @version 3.0.0 - Refatorado para RISE Protocol V2 (< 300 linhas)
 */

import { IPaymentGateway } from "../IPaymentGateway.ts";
import { PaymentRequest, PaymentResponse } from "../types.ts";
import { CircuitBreaker, CircuitOpenError, GATEWAY_CIRCUIT_CONFIGS } from "../../circuit-breaker.ts";

// Importar helpers modulares - UNIFICADO para RISE Protocol V2
import { findOrCreateCustomer, type AsaasCustomer } from "../../asaas-customer.ts";
import { 
  createPayment, 
  getPixQrCode, 
  buildSplitRules, 
  getDueDate, 
  parseCardToken, 
  mapAsaasStatus,
  type AsaasPaymentStatus 
} from "./asaas-payment-helper.ts";

// ============================================
// ADAPTER IMPLEMENTATION
// ============================================

export class AsaasAdapter implements IPaymentGateway {
  readonly providerName = "asaas";
  
  private apiKey: string;
  private environment: 'sandbox' | 'production';
  private baseUrl: string;
  private circuitBreaker: CircuitBreaker;

  /**
   * Cria uma nova instância do adaptador Asaas
   * 
   * @param apiKey - API Key da conta Asaas
   * @param environment - Ambiente (sandbox ou production)
   */
  constructor(apiKey: string, environment: 'sandbox' | 'production' = 'production') {
    if (!apiKey) {
      throw new Error('Asaas: API Key é obrigatória');
    }
    this.apiKey = apiKey;
    this.environment = environment;
    this.baseUrl = environment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';
    this.circuitBreaker = new CircuitBreaker(GATEWAY_CIRCUIT_CONFIGS.asaas);
  }

  // ============================================
  // PUBLIC METHODS (IPaymentGateway)
  // ============================================

  /**
   * Cria um pagamento via PIX
   */
  async createPix(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log(`[AsaasAdapter] Criando PIX para pedido ${request.order_id}`);

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
      console.log(`[AsaasAdapter] Criando pagamento cartão para pedido ${request.order_id}`);

      if (!request.card_token) {
        return this.errorResponse('Token do cartão é obrigatório');
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
      console.warn(`[AsaasAdapter] Circuit breaker OPEN: ${error.message}`);
      return {
        success: false,
        transaction_id: '',
        status: 'error',
        raw_response: { circuit_breaker: 'open' },
        error_message: 'Gateway temporariamente indisponível. Tente novamente em alguns segundos.'
      };
    }

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[AsaasAdapter] Exception ${method}:`, error);
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
