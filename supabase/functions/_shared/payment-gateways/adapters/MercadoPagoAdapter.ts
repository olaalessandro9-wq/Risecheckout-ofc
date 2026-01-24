/**
 * MercadoPagoAdapter - Adaptador para o gateway Mercado Pago
 * @version 3.0.0 - RISE Protocol V3 Compliance (validação de preço integrada)
 */

import { IPaymentGateway } from "../IPaymentGateway.ts";
import { PaymentRequest, PaymentResponse, PaymentSplitRule } from "../types.ts";
import { CircuitBreaker, CircuitOpenError, GATEWAY_CIRCUIT_CONFIGS } from "../../circuit-breaker.ts";
import { createGatewayClient, type GatewayHttpClient } from "../../http-client.ts";
import { validateOrderAmount } from "../../payment-validation.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { MercadoPagoPayload, MercadoPagoDisbursement, MercadoPagoResponse } from "./mercadopago-types.ts";
import { createLogger } from "../../logger.ts";

const log = createLogger("MercadoPagoAdapter");

export class MercadoPagoAdapter implements IPaymentGateway {
  readonly providerName = "mercadopago";
  private accessToken: string;
  private apiUrl = 'https://api.mercadopago.com/v1/payments';
  private circuitBreaker: CircuitBreaker;
  private httpClient: GatewayHttpClient;
  private supabase: SupabaseClient;

  constructor(
    accessToken: string, 
    _environment: 'sandbox' | 'production' = 'production',
    supabase: SupabaseClient
  ) {
    if (!accessToken) throw new Error('MercadoPago: Access Token é obrigatório');
    this.accessToken = accessToken;
    this.supabase = supabase;
    this.circuitBreaker = new CircuitBreaker(GATEWAY_CIRCUIT_CONFIGS.mercadopago);
    this.httpClient = createGatewayClient({
      gateway: 'mercadopago',
      baseUrl: 'https://api.mercadopago.com/v1',
      timeout: 15000,
      defaultHeaders: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}` 
      }
    });
  }

  async createPix(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // RISE V3: Validação de preço ANTES de qualquer operação
      const priceValidation = await validateOrderAmount({
        supabase: this.supabase,
        orderId: request.order_id,
        expectedAmountCents: request.amount_cents,
        gateway: 'mercadopago'
      });

      if (!priceValidation.valid) {
        log.error('SECURITY: Price validation failed', { 
          orderId: request.order_id,
          error: priceValidation.error 
        });
        return this.errorResponse(priceValidation.error || 'Valor inválido', { security: 'price_mismatch' });
      }

      return await this.circuitBreaker.execute(async () => {
        const mpPayload = this.buildPixPayload(request);
        this.attachDisbursements(mpPayload, request.split_rules);
        log.info(`Creating PIX for order ${request.order_id}`);

        const response = await this.callApi(mpPayload, request.order_id);
        const data = await response.json() as MercadoPagoResponse;

        if (!response.ok) {
          log.error("API error:", data);
          return this.errorResponse(data.message || 'Erro ao processar pagamento PIX', data);
        }

        const qrCodeData = data.point_of_interaction?.transaction_data;
        return {
          success: true,
          transaction_id: data.id?.toString() || '',
          qr_code: qrCodeData?.qr_code_base64,
          qr_code_text: qrCodeData?.qr_code,
          status: this.mapStatus(data.status || ''),
          raw_response: data
        };
      });
    } catch (error: unknown) {
      return this.handleError(error, 'PIX');
    }
  }

  async createCreditCard(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!request.card_token) throw new Error('Token do cartão é obrigatório');

      // RISE V3: Validação de preço ANTES de qualquer operação
      const priceValidation = await validateOrderAmount({
        supabase: this.supabase,
        orderId: request.order_id,
        expectedAmountCents: request.amount_cents,
        gateway: 'mercadopago'
      });

      if (!priceValidation.valid) {
        log.error('SECURITY: Price validation failed', { 
          orderId: request.order_id,
          error: priceValidation.error 
        });
        return this.errorResponse(priceValidation.error || 'Valor inválido', { security: 'price_mismatch' });
      }

      return await this.circuitBreaker.execute(async () => {
        const mpPayload = this.buildCardPayload(request);
        this.attachDisbursements(mpPayload, request.split_rules);
        log.info(`Creating credit card payment for order ${request.order_id}`);

        const response = await this.callApi(mpPayload, request.order_id);
        const data = await response.json() as MercadoPagoResponse;

        if (!response.ok) {
          log.error("API error:", data);
          return this.errorResponse(data.message || 'Erro ao processar cartão', data);
        }

        return {
          success: true,
          transaction_id: data.id?.toString() || '',
          status: this.mapStatus(data.status || ''),
          raw_response: data
        };
      });
    } catch (error: unknown) {
      return this.handleError(error, 'cartão');
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // === PRIVATE HELPERS ===

  private buildPixPayload(request: PaymentRequest): MercadoPagoPayload {
    const doc = request.customer.document || '';
    return {
      transaction_amount: request.amount_cents / 100,
      description: request.description,
      payment_method_id: 'pix',
      payer: {
        email: request.customer.email,
        first_name: request.customer.name.split(' ')[0],
        last_name: request.customer.name.split(' ').slice(1).join(' ') || 'Cliente',
        identification: { type: doc.length === 11 ? 'CPF' : 'CNPJ', number: doc }
      },
      external_reference: request.order_id,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`
    };
  }

  private buildCardPayload(request: PaymentRequest): MercadoPagoPayload {
    const doc = request.customer.document || '';
    return {
      transaction_amount: request.amount_cents / 100,
      description: request.description,
      token: request.card_token,
      installments: request.installments || 1,
      statement_descriptor: 'RISECHECKOUT',
      payer: {
        email: request.customer.email,
        first_name: request.customer.name.split(' ')[0],
        last_name: request.customer.name.split(' ').slice(1).join(' ') || 'Cliente',
        identification: { type: doc.length === 11 ? 'CPF' : 'CNPJ', number: doc }
      },
      external_reference: request.order_id,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`
    };
  }

  private attachDisbursements(payload: MercadoPagoPayload, rules?: PaymentSplitRule[]): void {
    if (!rules || rules.length === 0) return;
    const disbursements: MercadoPagoDisbursement[] = rules
      .filter(r => r.role !== 'producer' && r.recipient_id)
      .map(r => ({ amount: r.amount_cents / 100, external_reference: r.role, collector_id: r.recipient_id! }));
    
    if (disbursements.length > 0) {
      payload.disbursements = disbursements;
      log.info(`Split active: ${disbursements.length} recipient(s)`);
    } else if (rules.length > 0) {
      log.warn("Split requested but no valid collector_id found");
    }
  }

  private callApi(payload: MercadoPagoPayload, orderId: string): Promise<Response> {
    return fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Idempotency-Key': orderId
      },
      body: JSON.stringify(payload)
    });
  }

  private errorResponse(message: string, raw: unknown): PaymentResponse {
    return { success: false, transaction_id: '', status: 'error', raw_response: raw, error_message: message };
  }

  private handleError(error: unknown, method: string): PaymentResponse {
    if (error instanceof CircuitOpenError) {
      log.warn(`Circuit breaker OPEN: ${error.message}`);
      return this.errorResponse('Gateway temporariamente indisponível', { circuit_breaker: 'open' });
    }
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    log.error(`Exception (${method}):`, error);
    return this.errorResponse(msg || `Erro ao processar ${method}`, { error: msg });
  }

  private mapStatus(mpStatus: string): 'pending' | 'approved' | 'refused' | 'error' {
    switch (mpStatus) {
      case 'approved': return 'approved';
      case 'rejected': case 'cancelled': return 'refused';
      case 'pending': case 'in_process': case 'in_mediation': case 'authorized': return 'pending';
      default: return 'error';
    }
  }
}
