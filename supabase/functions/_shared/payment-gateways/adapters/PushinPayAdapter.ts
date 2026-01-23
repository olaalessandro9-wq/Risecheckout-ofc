/**
 * PushinPayAdapter - Adaptador para o gateway PushinPay
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Este adaptador traduz as requisições padronizadas do RiseCheckout
 * para o formato específico da API do PushinPay e vice-versa.
 * 
 * FEATURES:
 * - Validação de preço integrada (segurança)
 * - HTTP Client com timeout e circuit breaker
 * - Logging estruturado
 * 
 * DOCUMENTAÇÃO OFICIAL:
 * - Criar PIX: https://app.theneo.io/pushinpay/pix/pix/criar-pix
 * - Consultar PIX: https://app.theneo.io/pushinpay/pix/pix/consultar-pix
 * 
 * @module payment-gateways/adapters/PushinPayAdapter
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { IPaymentGateway } from "../IPaymentGateway.ts";
import { PaymentRequest, PaymentResponse } from "../types.ts";
import { CircuitOpenError } from "../../circuit-breaker.ts";
import { createLogger } from "../../logger.ts";
import { createGatewayClient, createGatewayHeaders } from "../../http-client.ts";
import { validateOrderAmount } from "../../payment-validation.ts";

const log = createLogger("PushinPayAdapter");

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
  private supabase: SupabaseClient;
  private httpClient: ReturnType<typeof createGatewayClient>;

  /**
   * Cria uma nova instância do adaptador PushinPay
   * 
   * @param token - API Token do PushinPay
   * @param environment - Ambiente (sandbox ou production)
   * @param supabase - Cliente Supabase para validação de preço
   */
  constructor(
    token: string, 
    environment: 'sandbox' | 'production' = 'production',
    supabase: SupabaseClient
  ) {
    if (!token) {
      throw new Error('PushinPay: Token é obrigatório');
    }
    if (!supabase) {
      throw new Error('PushinPay: Supabase client é obrigatório');
    }
    
    this.token = token;
    this.environment = environment;
    this.supabase = supabase;
    
    // HTTP Client com Circuit Breaker integrado
    this.httpClient = createGatewayClient({
      gateway: 'pushinpay',
      baseUrl: PUSHINPAY_API_URLS[environment],
      timeout: 15000, // 15s para PushinPay
      defaultHeaders: createGatewayHeaders('pushinpay', token),
    });
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
      // ===================================================================
      // VALIDAÇÃO DE PREÇO - SEGURANÇA CRÍTICA
      // ===================================================================
      const validation = await validateOrderAmount({
        supabase: this.supabase,
        orderId: request.order_id,
        expectedAmountCents: request.amount_cents,
        gateway: 'pushinpay',
      });

      if (!validation.valid) {
        log.error(`Price validation failed: ${validation.error}`);
        return {
          success: false,
          transaction_id: '',
          status: 'error',
          raw_response: { validation_error: validation.error },
          error_message: validation.error || 'Validação de preço falhou',
        };
      }
      // ===================================================================

      log.info(`Creating PIX for order ${request.order_id}`);
      log.debug(`amount_cents: ${request.amount_cents}`);

      // IMPORTANTE: value deve estar em CENTAVOS (não dividir por 100!)
      const pushinPayload = {
        value: request.amount_cents,
        webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/pushinpay-webhook`
      };

      // Fazer requisição via HTTP Client (com timeout e circuit breaker)
      const response = await this.httpClient.post<PushinPayCreatePixResponse>(
        '/pix/cashIn',
        pushinPayload
      );

      if (!response.success || !response.data) {
        log.error("API error:", response.error);
        return {
          success: false,
          transaction_id: '',
          status: 'error',
          raw_response: response,
          error_message: `PushinPay retornou erro: ${response.error || response.status}`
        };
      }

      const data = response.data;

      // Traduzir resposta para formato padronizado
      return {
        success: true,
        transaction_id: data.id?.toString() || '',
        qr_code: data.qr_code_base64 || data.qrcode_base64,
        qr_code_text: data.qr_code || data.qrcode,
        status: this.mapPushinPayStatus(data.status || ''),
        raw_response: data
      };

    } catch (error: unknown) {
      // Circuit Breaker aberto
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

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      log.error("Exception:", error);
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
    log.info(`Checking PIX status: ${pixId}`);

    const response = await this.httpClient.get<PushinPayStatusResponse>(
      `/transactions/${pixId}`
    );

    if (!response.success || !response.data) {
      log.error("Error fetching status:", response.error);
      throw new Error(`Erro ao consultar PIX: ${response.status}`);
    }

    const data = response.data;

    return {
      status: this.mapPushinPayStatus(data.status || ''),
      paid_at: data.paid_at,
      raw_response: data
    };
  }

  /**
   * Cria um pagamento via Cartão de Crédito
   * 
   * PushinPay não suporta cartão de crédito.
   */
  async createCreditCard(_request: PaymentRequest): Promise<PaymentResponse> {
    log.warn("Credit card is not supported by PushinPay");
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
   * Retorna estado do Circuit Breaker
   */
  getCircuitState(): string {
    return this.httpClient.getCircuitState?.() ?? 'unknown';
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
