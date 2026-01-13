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
 * @version 2.1.0 - Adicionado Circuit Breaker em 11/01/2026
 */

import { IPaymentGateway } from "../IPaymentGateway.ts";
import { PaymentRequest, PaymentResponse, PaymentSplitRule } from "../types.ts";
import { CircuitBreaker, CircuitOpenError, GATEWAY_CIRCUIT_CONFIGS } from "../../circuit-breaker.ts";

// ============================================
// ASAAS SPECIFIC TYPES
// ============================================

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

interface AsaasPayment {
  id: string;
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  value: number;
  dueDate: string;
  status: AsaasPaymentStatus;
  externalReference?: string;
  description?: string;
}

interface AsaasPixQrCode {
  encodedImage: string;  // Base64
  payload: string;       // Copia e Cola
  expirationDate: string;
}

interface AsaasSplitRule {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
  description?: string;
}

type AsaasPaymentStatus = 
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

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
   * 
   * Fluxo:
   * 1. Cria/busca customer na Asaas
   * 2. Cria cobrança com billingType PIX + split
   * 3. Obtém QR Code
   * 4. Retorna resposta padronizada
   */
  async createPix(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log(`[AsaasAdapter] Criando PIX para pedido ${request.order_id}`);

      // Circuit Breaker: Proteger contra falhas em cascata
      return await this.circuitBreaker.execute(async () => {
        // 1. Criar ou buscar customer
        const customer = await this.findOrCreateCustomer(request.customer);
        
        if (!customer) {
          return this.errorResponse('Erro ao criar/buscar cliente na Asaas');
        }

        // 2. Criar cobrança PIX com split
        const payment = await this.createPayment({
          customer: customer.id,
          billingType: 'PIX',
          value: request.amount_cents / 100,
          dueDate: this.getDueDate(),
          externalReference: request.order_id,
          description: request.description,
          split: this.buildSplitRules(request.split_rules)
        });

        if (!payment || payment.error) {
          return this.errorResponse(payment?.error || 'Erro ao criar cobrança PIX');
        }

        // 3. Obter QR Code
        const qrCode = await this.getPixQrCode(payment.id);
        
        if (!qrCode) {
          return this.errorResponse('Erro ao obter QR Code PIX');
        }

        // 4. Retornar resposta padronizada
        return {
          success: true,
          transaction_id: payment.id,
          status: this.mapAsaasStatus(payment.status),
          qr_code: qrCode.encodedImage,
          qr_code_text: qrCode.payload,
          raw_response: { payment, qrCode }
        };
      });

    } catch (error: unknown) {
      // Circuit Breaker aberto
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
      console.error('[AsaasAdapter] Exception createPix:', error);
      return this.errorResponse(errorMessage);
    }
  }

  /**
   * Cria um pagamento via Cartão de Crédito
   * 
   * Fluxo:
   * 1. Cria/busca customer na Asaas
   * 2. Cria cobrança com billingType CREDIT_CARD + dados do cartão + split
   * 3. Retorna resposta padronizada
   */
  async createCreditCard(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log(`[AsaasAdapter] Criando pagamento cartão para pedido ${request.order_id}`);

      if (!request.card_token) {
        return this.errorResponse('Token do cartão é obrigatório');
      }

      // Circuit Breaker: Proteger contra falhas em cascata
      return await this.circuitBreaker.execute(async () => {
        // 1. Criar ou buscar customer
        const customer = await this.findOrCreateCustomer(request.customer);
        
        if (!customer) {
          return this.errorResponse('Erro ao criar/buscar cliente na Asaas');
        }

        // 2. Parsear token do cartão (formato: token ou objeto serializado)
        const cardData = this.parseCardToken(request.card_token || '');

        // 3. Criar cobrança com cartão e split
        const payload: Record<string, unknown> = {
          customer: customer.id,
          billingType: 'CREDIT_CARD',
          value: request.amount_cents / 100,
          dueDate: this.getDueDate(),
          externalReference: request.order_id,
          description: request.description,
          installmentCount: request.installments || 1,
          split: this.buildSplitRules(request.split_rules)
        };

        // Adicionar dados do cartão
        if (cardData.creditCardToken) {
          // Usando token previamente gerado
          payload.creditCardToken = cardData.creditCardToken;
        } else if (cardData.creditCard) {
          // Usando dados do cartão diretamente (menos seguro)
          payload.creditCard = cardData.creditCard;
          payload.creditCardHolderInfo = cardData.creditCardHolderInfo;
        }

        const payment = await this.createPayment(payload);

        if (!payment || payment.error) {
          return this.errorResponse(payment?.error || 'Erro ao criar cobrança com cartão');
        }

        return {
          success: true,
          transaction_id: payment.id,
          status: this.mapAsaasStatus(payment.status),
          raw_response: payment
        };
      });

    } catch (error: unknown) {
      // Circuit Breaker aberto
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
      console.error('[AsaasAdapter] Exception createCreditCard:', error);
      return this.errorResponse(errorMessage);
    }
  }

  /**
   * Valida se as credenciais (API Key) são válidas
   * 
   * Faz uma requisição GET simples à API para verificar autenticação
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
  // CUSTOMER MANAGEMENT
  // ============================================

  /**
   * Busca customer existente por CPF/CNPJ ou cria novo
   */
  private async findOrCreateCustomer(customerData: PaymentRequest['customer']): Promise<AsaasCustomer | null> {
    const document = customerData.document?.replace(/\D/g, '') || '';
    
    // 1. Tentar buscar por documento
    if (document) {
      const existing = await this.findCustomerByDocument(document);
      if (existing) {
        console.log(`[AsaasAdapter] Customer encontrado: ${existing.id}`);
        return existing;
      }
    }

    // 2. Criar novo customer
    return this.createCustomer(customerData);
  }

  /**
   * Busca customer por CPF/CNPJ
   */
  private async findCustomerByDocument(document: string): Promise<AsaasCustomer | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/customers?cpfCnpj=${document}`,
        { headers: this.getHeaders() }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.data?.[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Cria novo customer na Asaas
   */
  private async createCustomer(customerData: PaymentRequest['customer']): Promise<AsaasCustomer | null> {
    try {
      const document = customerData.document?.replace(/\D/g, '') || '';
      
      const payload = {
        name: customerData.name,
        email: customerData.email,
        cpfCnpj: document,
        phone: customerData.phone?.replace(/\D/g, ''),
        notificationDisabled: false
      };

      console.log(`[AsaasAdapter] Criando customer: ${customerData.email}`);

      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[AsaasAdapter] Erro ao criar customer:', error);
        return null;
      }

      const customer = await response.json();
      console.log(`[AsaasAdapter] Customer criado: ${customer.id}`);
      return customer;
    } catch (error) {
      console.error('[AsaasAdapter] Exception createCustomer:', error);
      return null;
    }
  }

  // ============================================
  // PAYMENT MANAGEMENT
  // ============================================

  /**
   * Cria cobrança na Asaas
   */
  private async createPayment(payload: Record<string, unknown>): Promise<AsaasPayment & { error?: string } | null> {
    try {
      console.log(`[AsaasAdapter] Criando cobrança:`, JSON.stringify(payload, null, 2));

      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[AsaasAdapter] Erro ao criar cobrança:', data);
        const asaasError = data as { errors?: Array<{ description?: string }>; message?: string };
        const errorMessage = asaasError.errors?.[0]?.description || asaasError.message || 'Erro desconhecido';
        return { error: errorMessage } as AsaasPayment & { error: string };
      }

      console.log(`[AsaasAdapter] Cobrança criada: ${data.id}`);
      return data;
    } catch (error) {
      console.error('[AsaasAdapter] Exception createPayment:', error);
      return null;
    }
  }

  /**
   * Obtém QR Code PIX de uma cobrança
   */
  private async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/payments/${paymentId}/pixQrCode`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.error('[AsaasAdapter] Erro ao obter QR Code');
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[AsaasAdapter] Exception getPixQrCode:', error);
      return null;
    }
  }

  /**
   * Consulta status de um pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<AsaasPaymentStatus | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/payments/${paymentId}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.status;
    } catch {
      return null;
    }
  }

  // ============================================
  // SPLIT MANAGEMENT
  // ============================================

  /**
   * Converte PaymentSplitRule[] para formato Asaas
   * 
   * Asaas usa walletId para identificar recebedores.
   * O valor restante vai automaticamente para o emissor (owner).
   */
  private buildSplitRules(rules?: PaymentSplitRule[]): AsaasSplitRule[] | undefined {
    if (!rules || rules.length === 0) return undefined;

    const asaasSplits: AsaasSplitRule[] = [];

    for (const rule of rules) {
      // Pula o produtor (owner) - resto vai automaticamente para ele
      if (rule.role === 'producer') continue;
      
      // Precisa de recipient_id (walletId na Asaas)
      if (!rule.recipient_id) {
        console.warn(`[AsaasAdapter] Split ignorado para ${rule.role}: sem walletId`);
        continue;
      }

      const split: AsaasSplitRule = {
        walletId: rule.recipient_id,
        description: `Split ${rule.role}`
      };

      // Converter centavos para reais (fixedValue)
      if (rule.amount_cents > 0) {
        split.fixedValue = rule.amount_cents / 100;
      }

      asaasSplits.push(split);
    }

    if (asaasSplits.length === 0) return undefined;

    console.log(`[AsaasAdapter] Split configurado com ${asaasSplits.length} recebedor(es)`);
    return asaasSplits;
  }

  // ============================================
  // UTILITY METHODS
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
   * Retorna data de vencimento (hoje + 1 dia)
   */
  private getDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Parseia token do cartão
   * 
   * Pode ser:
   * - String simples (creditCardToken)
   * - JSON serializado com dados do cartão
   */
  private parseCardToken(token: string): {
    creditCardToken?: string;
    creditCard?: Record<string, string>;
    creditCardHolderInfo?: Record<string, string>;
  } {
    try {
      // Tentar parsear como JSON
      const parsed = JSON.parse(token);
      return parsed;
    } catch {
      // String simples = token
      return { creditCardToken: token };
    }
  }

  /**
   * Mapeia status Asaas para status padronizado RiseCheckout
   */
  private mapAsaasStatus(status: AsaasPaymentStatus): 'pending' | 'approved' | 'refused' | 'error' | 'cancelled' | 'refunded' {
    switch (status) {
      case 'RECEIVED':
      case 'CONFIRMED':
      case 'RECEIVED_IN_CASH':
        return 'approved';
      
      case 'PENDING':
      case 'AWAITING_RISK_ANALYSIS':
        return 'pending';
      
      case 'REFUNDED':
      case 'REFUND_REQUESTED':
      case 'REFUND_IN_PROGRESS':
        return 'refunded';
      
      case 'OVERDUE':
      case 'CHARGEBACK_REQUESTED':
      case 'CHARGEBACK_DISPUTE':
      case 'AWAITING_CHARGEBACK_REVERSAL':
      case 'DUNNING_REQUESTED':
      case 'DUNNING_RECEIVED':
        return 'cancelled';
      
      default:
        return 'error';
    }
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
