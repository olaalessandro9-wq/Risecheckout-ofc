/**
 * PaymentFactory - Fábrica de Gateways de Pagamento
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Esta classe é responsável por criar a instância correta do gateway
 * baseado no nome fornecido. Agora requer Supabase client para
 * validação de preço integrada nos adapters.
 * 
 * @module payment-gateways/PaymentFactory
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { IPaymentGateway } from "./IPaymentGateway.ts";
import { GatewayCredentials } from "./types.ts";
import { MercadoPagoAdapter } from "./adapters/MercadoPagoAdapter.ts";
import { PushinPayAdapter } from "./adapters/PushinPayAdapter.ts";
import { AsaasAdapter } from "./adapters/AsaasAdapter.ts";
import { createLogger } from "../logger.ts";

const log = createLogger("PaymentFactory");

export class PaymentFactory {
  /**
   * Cria a instância correta do gateway baseado no nome
   * 
   * @param gatewayName - Nome do gateway ('mercadopago', 'pushinpay', etc)
   * @param credentials - Credenciais do gateway
   * @param supabase - Cliente Supabase para validação de preço
   * @returns Instância do gateway que implementa IPaymentGateway
   * @throws Error se o gateway não for suportado ou credenciais inválidas
   */
  static create(
    gatewayName: string, 
    credentials: GatewayCredentials,
    supabase: SupabaseClient
  ): IPaymentGateway {
    const normalizedName = gatewayName.toLowerCase().trim();
    
    log.info(`Creating gateway: ${normalizedName}`);

    switch (normalizedName) {
      case 'mercadopago':
      case 'mercado_pago':
      case 'mercado-pago':
        return this.createMercadoPago(credentials, supabase);
      
      case 'pushinpay':
      case 'pushin_pay':
      case 'pushin-pay':
        return this.createPushinPay(credentials, supabase);
      
      case 'asaas':
        return this.createAsaas(credentials, supabase);
      
      default:
        throw new Error(
          `Gateway '${gatewayName}' não é suportado pelo sistema. ` +
          `Gateways disponíveis: mercadopago, pushinpay, asaas`
        );
    }
  }

  private static createMercadoPago(
    credentials: GatewayCredentials,
    supabase: SupabaseClient
  ): MercadoPagoAdapter {
    const accessToken = credentials.access_token || credentials.token;
    
    if (!accessToken) {
      throw new Error('MercadoPago: access_token é obrigatório nas credenciais.');
    }
    
    return new MercadoPagoAdapter(accessToken, supabase);
  }

  private static createPushinPay(
    credentials: GatewayCredentials,
    supabase: SupabaseClient
  ): PushinPayAdapter {
    const token = credentials.token || credentials.access_token;
    
    if (!token) {
      throw new Error('PushinPay: token é obrigatório nas credenciais.');
    }

    const environment = credentials.environment || 'production';
    
    return new PushinPayAdapter(token, environment, supabase);
  }

  private static createAsaas(
    credentials: GatewayCredentials,
    supabase: SupabaseClient
  ): AsaasAdapter {
    const apiKey = credentials.api_key || credentials.token || credentials.access_token;
    
    if (!apiKey) {
      throw new Error('Asaas: api_key é obrigatório nas credenciais.');
    }

    const environment = credentials.environment || 'production';
    
    return new AsaasAdapter(apiKey, environment, supabase);
  }

  static getSupportedGateways(): string[] {
    return ['mercadopago', 'pushinpay', 'asaas'];
  }

  static isSupported(gatewayName: string): boolean {
    const normalized = gatewayName.toLowerCase().trim();
    return this.getSupportedGateways().includes(normalized);
  }
}
