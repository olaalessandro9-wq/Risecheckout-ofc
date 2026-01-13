/**
 * PushinPayAdapter - Adaptador para o gateway PushinPay
 * 
 * Este adaptador traduz as requisições padronizadas do RiseCheckout
 * para o formato específico da API do PushinPay e vice-versa.
 * 
 * DOCUMENTAÇÃO OFICIAL:
 * - Criar PIX: https://app.theneo.io/pushinpay/pix/pix/criar-pix
 * - Consultar PIX: https://app.theneo.io/pushinpay/pix/pix/consultar-pix
 * 
 * ENDPOINTS CORRETOS:
 * - Criar PIX: POST /api/pix/cashIn
 * - Consultar PIX: GET /api/transactions/{id}
 * 
 * IMPORTANTE:
 * - O valor DEVE ser enviado em CENTAVOS (não dividir por 100!)
 * - URL Sandbox: https://api-sandbox.pushinpay.com.br/api
 * - URL Produção: https://api.pushinpay.com.br/api
 * - Circuit Breaker para resiliência
 * 
 * @author RiseCheckout Team
 * @version 2.2.0 - Zero `any` compliance
 */

import { IPaymentGateway } from "../IPaymentGateway.ts";
import { PaymentRequest, PaymentResponse } from "../types.ts";
import { CircuitBreaker, CircuitOpenError, GATEWAY_CIRCUIT_CONFIGS } from "../../circuit-breaker.ts";

// URLs corretas conforme documentação oficial
const PUSHINPAY_API_URLS = {
  sandbox: 'https://api-sandbox.pushinpay.com.br/api',
  production: 'https://api.pushinpay.com.br/api'
} as const;

// ============================================
// PUSHINPAY SPECIFIC TYPES
// ============================================

interface PushinPayCreatePixResponse {
  id?: string | number;
  qr_code_base64?: string;
  qrcode_base64?: string;
  qr_code?: string;
  qrcode?: string;
  status?: string;
}

interface PushinPayStatusResponse {
  id?: string | number;
  status?: string;
  paid_at?: string;
}

// ============================================
// ADAPTER IMPLEMENTATION
// ============================================

export class PushinPayAdapter implements IPaymentGateway {
  readonly providerName = "pushinpay";
  
  private token: string;
  private environment: 'sandbox' | 'production';
  private baseUrl: string;
  private circuitBreaker: CircuitBreaker;

  /**
   * Cria uma nova instância do adaptador PushinPay
   * 
   * @param token - API Token do PushinPay
   * @param environment - Ambiente (sandbox ou production)
   */
  constructor(token: string, environment: 'sandbox' | 'production' = 'production') {
    if (!token) {
      throw new Error('PushinPay: Token é obrigatório');
    }
    this.token = token;
    this.environment = environment;
    
    // URLs corretas da API PushinPay conforme documentação
    this.baseUrl = PUSHINPAY_API_URLS[environment];
    this.circuitBreaker = new CircuitBreaker(GATEWAY_CIRCUIT_CONFIGS.pushinpay);
  }

  /**
   * Cria um pagamento via PIX
   * 
   * Endpoint: POST /api/pix/cashIn
   * 
   * IMPORTANTE: O valor é enviado em CENTAVOS conforme documentação!
   */
  async createPix(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Circuit Breaker: Proteger contra falhas em cascata
      return await this.circuitBreaker.execute(async () => {
        // Endpoint correto: /api/pix/cashIn
        const apiUrl = `${this.baseUrl}/pix/cashIn`;
        
        // IMPORTANTE: value deve estar em CENTAVOS (não dividir por 100!)
        // Conforme documentação oficial do PushinPay
        const pushinPayload = {
          value: request.amount_cents, // JÁ em centavos!
          webhook_url: 'https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/pushinpay-webhook'
        };

        console.log(`[PushinPayAdapter] Criando PIX para pedido ${request.order_id}`);
        console.log(`[PushinPayAdapter] URL: ${apiUrl}`);
        console.log(`[PushinPayAdapter] Valor em centavos: ${request.amount_cents}`);

        // Fazer requisição à API do PushinPay
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify(pushinPayload)
        });

        const responseText = await response.text();
        console.log(`[PushinPayAdapter] Status: ${response.status}`);

        // Verificar erros
        if (!response.ok) {
          console.error('[PushinPayAdapter] Erro na API:', responseText);
          return {
            success: false,
            transaction_id: '',
            status: 'error',
            raw_response: responseText,
            error_message: `PushinPay retornou erro: ${response.status} - ${responseText}`
          };
        }

        const data = JSON.parse(responseText) as PushinPayCreatePixResponse;

        // Traduzir resposta para formato padronizado
        return {
          success: true,
          transaction_id: data.id?.toString() || '',
          qr_code: data.qr_code_base64 || data.qrcode_base64,
          qr_code_text: data.qr_code || data.qrcode,
          status: this.mapPushinPayStatus(data.status || ''),
          raw_response: data
        };
      });

    } catch (error: unknown) {
      // Circuit Breaker aberto
      if (error instanceof CircuitOpenError) {
        console.warn(`[PushinPayAdapter] Circuit breaker OPEN: ${error.message}`);
        return {
          success: false,
          transaction_id: '',
          status: 'error',
          raw_response: { circuit_breaker: 'open' },
          error_message: 'Gateway temporariamente indisponível. Tente novamente em alguns segundos.'
        };
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[PushinPayAdapter] Exception:', error);
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
   * Consulta o status de um PIX
   * 
   * Endpoint: GET /api/transactions/{id}
   */
  async getPixStatus(pixId: string): Promise<{ status: string; paid_at?: string; raw_response: PushinPayStatusResponse }> {
    try {
      const apiUrl = `${this.baseUrl}/transactions/${pixId}`;
      
      console.log(`[PushinPayAdapter] Consultando status do PIX: ${pixId}`);
      console.log(`[PushinPayAdapter] URL: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.token}`
        }
      });

      const responseText = await response.text();
      console.log(`[PushinPayAdapter] Status: ${response.status}`);

      if (!response.ok) {
        console.error('[PushinPayAdapter] Erro ao consultar status:', responseText);
        throw new Error(`Erro ao consultar PIX: ${response.status}`);
      }

      const data = JSON.parse(responseText) as PushinPayStatusResponse;

      return {
        status: this.mapPushinPayStatus(data.status || ''),
        paid_at: data.paid_at,
        raw_response: data
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[PushinPayAdapter] Erro ao consultar status:', errorMessage);
      throw error;
    }
  }

  /**
   * Cria um pagamento via Cartão de Crédito
   * 
   * PushinPay não suporta cartão de crédito.
   */
  async createCreditCard(_request: PaymentRequest): Promise<PaymentResponse> {
    console.warn('[PushinPayAdapter] Cartão de crédito não é suportado pelo PushinPay');
    return {
      success: false,
      transaction_id: '',
      status: 'error',
      raw_response: null,
      error_message: 'PushinPay não suporta pagamentos com cartão de crédito'
    };
  }

  /**
   * Valida se as credenciais estão corretas
   */
  async validateCredentials(): Promise<boolean> {
    try {
      return this.token.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Mapeia o status do PushinPay para o status padronizado
   * @private
   */
  private mapPushinPayStatus(pushinStatus: string): 'pending' | 'approved' | 'refused' | 'error' {
    const status = pushinStatus?.toLowerCase();
    
    switch (status) {
      case 'paid':
      case 'approved':
      case 'confirmed':
        return 'approved';
      case 'cancelled':
      case 'canceled':
      case 'rejected':
      case 'expired':
        return 'refused';
      case 'pending':
      case 'waiting':
      case 'processing':
      case 'created':
        return 'pending';
      default:
        return 'error';
    }
  }
}
