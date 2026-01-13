/**
 * MercadoPagoAdapter - Adaptador para o gateway Mercado Pago
 * 
 * Este adaptador traduz as requisições padronizadas do RiseCheckout
 * para o formato específico da API do Mercado Pago e vice-versa.
 * 
 * Suporta:
 * - Pagamentos via PIX
 * - Pagamentos via Cartão de Crédito
 * - Split de pagamentos (disbursements)
 * - Ambientes de teste (sandbox) e produção
 * - Circuit Breaker para resiliência
 * 
 * @version 2.1.0 - Zero `any` compliance
 */

import { IPaymentGateway } from "../IPaymentGateway.ts";
import { PaymentRequest, PaymentResponse, PaymentSplitRule } from "../types.ts";
import { CircuitBreaker, CircuitOpenError, GATEWAY_CIRCUIT_CONFIGS } from "../../circuit-breaker.ts";

// ============================================
// MERCADOPAGO SPECIFIC TYPES
// ============================================

interface MercadoPagoPayload {
  transaction_amount: number;
  description?: string;
  payment_method_id?: string;
  token?: string;
  installments?: number;
  statement_descriptor?: string;
  payer: {
    email: string;
    first_name: string;
    last_name: string;
    identification: {
      type: string;
      number: string;
    };
  };
  external_reference?: string;
  notification_url?: string;
  disbursements?: MercadoPagoDisbursement[];
}

interface MercadoPagoDisbursement {
  amount: number;
  external_reference: string;
  collector_id: string;
}

interface MercadoPagoResponse {
  id?: number | string;
  status?: string;
  message?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code_base64?: string;
      qr_code?: string;
    };
  };
}

// ============================================
// ADAPTER IMPLEMENTATION
// ============================================

export class MercadoPagoAdapter implements IPaymentGateway {
  readonly providerName = "mercadopago";
  
  private accessToken: string;
  private environment: 'sandbox' | 'production';
  private apiUrl = 'https://api.mercadopago.com/v1/payments';
  private circuitBreaker: CircuitBreaker;

  /**
   * Cria uma nova instância do adaptador Mercado Pago
   * 
   * @param accessToken - Access Token do Mercado Pago
   * @param environment - Ambiente (sandbox ou production)
   */
  constructor(accessToken: string, environment: 'sandbox' | 'production' = 'production') {
    if (!accessToken) {
      throw new Error('MercadoPago: Access Token é obrigatório');
    }
    this.accessToken = accessToken;
    this.environment = environment;
    this.circuitBreaker = new CircuitBreaker(GATEWAY_CIRCUIT_CONFIGS.mercadopago);
  }

  /**
   * Cria um pagamento via PIX
   * 
   * Traduz a requisição padronizada para o formato do Mercado Pago,
   * processa o pagamento e retorna a resposta padronizada com o QR Code.
   */
  async createPix(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Circuit Breaker: Proteger contra falhas em cascata
      return await this.circuitBreaker.execute(async () => {
        const document = request.customer.document || '';
        
        // 1. Traduzir: RiseCheckout → Mercado Pago
        const mpPayload: MercadoPagoPayload = {
          transaction_amount: request.amount_cents / 100, // Centavos → Reais
          description: request.description,
          payment_method_id: 'pix',
          payer: {
            email: request.customer.email,
            first_name: request.customer.name.split(' ')[0],
            last_name: request.customer.name.split(' ').slice(1).join(' ') || 'Cliente',
            identification: {
              type: document.length === 11 ? 'CPF' : 'CNPJ',
              number: document
            }
          },
          external_reference: request.order_id,
          notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`
        };

        // ✅ Adicionar split se houver regras válidas
        const disbursements = this.buildDisbursements(request.split_rules);
        
        if (disbursements && disbursements.length > 0) {
          mpPayload.disbursements = disbursements;
          console.log(`[MercadoPagoAdapter] Split ativo com ${disbursements.length} destinatário(s)`);
        } else if (request.split_rules && request.split_rules.length > 0) {
          console.warn('[MercadoPagoAdapter] Split solicitado mas nenhum destinatário tem collector_id. Dinheiro vai todo pro produtor.');
        }

        console.log(`[MercadoPagoAdapter] Criando PIX para pedido ${request.order_id}`);

        // 2. Fazer requisição à API do Mercado Pago
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
            'X-Idempotency-Key': request.order_id
          },
          body: JSON.stringify(mpPayload)
        });

        const data = await response.json() as MercadoPagoResponse;

        // 3. Verificar erros (não contabilizar como falha do circuit breaker para erros de negócio)
        if (!response.ok) {
          console.error('[MercadoPagoAdapter] Erro na API:', data);
          return {
            success: false,
            transaction_id: '',
            status: 'error',
            raw_response: data,
            error_message: data.message || 'Erro ao processar pagamento com Mercado Pago'
          };
        }

        // 4. Traduzir: Mercado Pago → RiseCheckout
        const qrCodeData = data.point_of_interaction?.transaction_data;
        
        return {
          success: true,
          transaction_id: data.id?.toString() || '',
          qr_code: qrCodeData?.qr_code_base64,
          qr_code_text: qrCodeData?.qr_code,
          status: this.mapMercadoPagoStatus(data.status || ''),
          raw_response: data
        };
      });

    } catch (error: unknown) {
      // Circuit Breaker aberto - gateway temporariamente indisponível
      if (error instanceof CircuitOpenError) {
        console.warn(`[MercadoPagoAdapter] Circuit breaker OPEN: ${error.message}`);
        return {
          success: false,
          transaction_id: '',
          status: 'error',
          raw_response: { circuit_breaker: 'open' },
          error_message: 'Gateway temporariamente indisponível. Tente novamente em alguns segundos.'
        };
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[MercadoPagoAdapter] Exception:', error);
      return {
        success: false,
        transaction_id: '',
        status: 'error',
        raw_response: { error: errorMessage },
        error_message: errorMessage || 'Erro desconhecido ao processar PIX'
      };
    }
  }

  /**
   * Cria um pagamento via Cartão de Crédito
   * 
   * Traduz a requisição padronizada para o formato do Mercado Pago,
   * processa o pagamento e retorna a resposta padronizada.
   */
  async createCreditCard(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!request.card_token) {
        throw new Error('Token do cartão é obrigatório');
      }

      // Circuit Breaker: Proteger contra falhas em cascata
      return await this.circuitBreaker.execute(async () => {
        const document = request.customer.document || '';

        // 1. Traduzir: RiseCheckout → Mercado Pago
        const mpPayload: MercadoPagoPayload = {
          transaction_amount: request.amount_cents / 100,
          description: request.description,
          token: request.card_token,
          installments: request.installments || 1,
          statement_descriptor: 'RISECHECKOUT',
          payer: {
            email: request.customer.email,
            first_name: request.customer.name.split(' ')[0],
            last_name: request.customer.name.split(' ').slice(1).join(' ') || 'Cliente',
            identification: {
              type: document.length === 11 ? 'CPF' : 'CNPJ',
              number: document
            }
          },
          external_reference: request.order_id,
          notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`
        };

        // ✅ Adicionar split se houver regras válidas
        const disbursements = this.buildDisbursements(request.split_rules);
        
        if (disbursements && disbursements.length > 0) {
          mpPayload.disbursements = disbursements;
          console.log(`[MercadoPagoAdapter] Split ativo com ${disbursements.length} destinatário(s)`);
        } else if (request.split_rules && request.split_rules.length > 0) {
          console.warn('[MercadoPagoAdapter] Split solicitado mas nenhum destinatário tem collector_id. Dinheiro vai todo pro produtor.');
        }

        console.log(`[MercadoPagoAdapter] Criando pagamento com cartão para pedido ${request.order_id}`);

        // 2. Fazer requisição à API do Mercado Pago
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
            'X-Idempotency-Key': request.order_id
          },
          body: JSON.stringify(mpPayload)
        });

        const data = await response.json() as MercadoPagoResponse;

        // 3. Verificar erros
        if (!response.ok) {
          console.error('[MercadoPagoAdapter] Erro na API:', data);
          return {
            success: false,
            transaction_id: '',
            status: 'error',
            raw_response: data,
            error_message: data.message || 'Erro ao processar pagamento com cartão'
          };
        }

        // 4. Traduzir: Mercado Pago → RiseCheckout
        return {
          success: true,
          transaction_id: data.id?.toString() || '',
          status: this.mapMercadoPagoStatus(data.status || ''),
          raw_response: data
        };
      });

    } catch (error: unknown) {
      // Circuit Breaker aberto
      if (error instanceof CircuitOpenError) {
        console.warn(`[MercadoPagoAdapter] Circuit breaker OPEN: ${error.message}`);
        return {
          success: false,
          transaction_id: '',
          status: 'error',
          raw_response: { circuit_breaker: 'open' },
          error_message: 'Gateway temporariamente indisponível. Tente novamente em alguns segundos.'
        };
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[MercadoPagoAdapter] Exception:', error);
      return {
        success: false,
        transaction_id: '',
        status: 'error',
        raw_response: { error: errorMessage },
        error_message: errorMessage || 'Erro desconhecido ao processar cartão'
      };
    }
  }

  /**
   * Constrói o array de disbursements para o Mercado Pago
   * 
   * Filtra apenas os destinatários que NÃO são o produtor (dono do token)
   * e que possuem collector_id válido.
   * 
   * @private
   */
  private buildDisbursements(rules?: PaymentSplitRule[]): MercadoPagoDisbursement[] | undefined {
    if (!rules || rules.length === 0) return undefined;

    // Filtra apenas quem NÃO é o produtor e tem collector_id
    const disbursements: MercadoPagoDisbursement[] = rules
      .filter(r => r.role !== 'producer' && r.recipient_id)
      .map(r => ({
        amount: r.amount_cents / 100, // Centavos → Reais
        external_reference: r.role,   // 'affiliate' ou 'platform'
        collector_id: r.recipient_id! // ID numérico do MP (já filtrado acima)
      }));

    return disbursements.length > 0 ? disbursements : undefined;
  }

  /**
   * Valida se as credenciais estão corretas
   * 
   * Faz uma requisição simples à API para verificar se o token é válido.
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Mapeia o status do Mercado Pago para o status padronizado
   * 
   * @private
   */
  private mapMercadoPagoStatus(mpStatus: string): 'pending' | 'approved' | 'refused' | 'error' {
    switch (mpStatus) {
      case 'approved':
        return 'approved';
      case 'rejected':
      case 'cancelled':
        return 'refused';
      case 'pending':
      case 'in_process':
      case 'in_mediation':
      case 'authorized':
        return 'pending';
      default:
        return 'error';
    }
  }
}
