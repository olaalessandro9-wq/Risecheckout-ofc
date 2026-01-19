/**
 * PaymentFactory - Fábrica de Gateways de Pagamento
 * 
 * Esta classe é responsável por criar a instância correta do gateway
 * baseado no nome fornecido. Ela elimina a necessidade de if/else
 * espalhados pelo código.
 * 
 * Benefícios:
 * 1. Centraliza a lógica de criação de gateways
 * 2. Facilita adicionar novos gateways (basta adicionar um case)
 * 3. Garante type safety com TypeScript
 * 4. Torna o código mais testável
 * 
 * @example
 * ```typescript
 * // Criar gateway Mercado Pago
 * const gateway = PaymentFactory.create('mercadopago', {
 *   access_token: 'APP_USR_123...',
 *   environment: 'production'
 * });
 * 
 * // Criar gateway PushinPay
 * const gateway = PaymentFactory.create('pushinpay', {
 *   token: 'pk_123...',
 *   environment: 'sandbox'
 * });
 * 
 * // Usar o gateway (independente de qual foi criado)
 * const result = await gateway.createPix(request);
 * ```
 */

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
   * @returns Instância do gateway que implementa IPaymentGateway
   * @throws Error se o gateway não for suportado ou credenciais inválidas
   * 
   * @example
   * ```typescript
   * const gateway = PaymentFactory.create('mercadopago', {
   *   access_token: 'APP_USR_123...'
   * });
   * ```
   */
  static create(gatewayName: string, credentials: GatewayCredentials): IPaymentGateway {
    const normalizedName = gatewayName.toLowerCase().trim();
    
    log.info(`Creating gateway: ${normalizedName}`);

    switch (normalizedName) {
      case 'mercadopago':
      case 'mercado_pago':
      case 'mercado-pago':
        return this.createMercadoPago(credentials);
      
      case 'pushinpay':
      case 'pushin_pay':
      case 'pushin-pay':
        return this.createPushinPay(credentials);
      
      case 'asaas':
        return this.createAsaas(credentials);
      
      default:
        throw new Error(
          `Gateway '${gatewayName}' não é suportado pelo sistema. ` +
          `Gateways disponíveis: mercadopago, pushinpay, asaas`
        );
    }
  }

  /**
   * Cria uma instância do MercadoPagoAdapter
   * 
   * @private
   */
  private static createMercadoPago(credentials: GatewayCredentials): MercadoPagoAdapter {
    const accessToken = credentials.access_token || credentials.token;
    
    if (!accessToken) {
      throw new Error(
        'MercadoPago: access_token é obrigatório nas credenciais. ' +
        'Verifique se o gateway está configurado corretamente.'
      );
    }

    const environment = credentials.environment || 'production';
    
    return new MercadoPagoAdapter(accessToken, environment);
  }

  /**
   * Cria uma instância do PushinPayAdapter
   * 
   * @private
   */
  private static createPushinPay(credentials: GatewayCredentials): PushinPayAdapter {
    const token = credentials.token || credentials.access_token;
    
    if (!token) {
      throw new Error(
        'PushinPay: token é obrigatório nas credenciais. ' +
        'Verifique se o gateway está configurado corretamente.'
      );
    }

    const environment = credentials.environment || 'production';
    
    return new PushinPayAdapter(token, environment);
  }

  /**
   * Cria uma instância do AsaasAdapter
   * 
   * @private
   */
  private static createAsaas(credentials: GatewayCredentials): AsaasAdapter {
    const apiKey = credentials.api_key || credentials.token || credentials.access_token;
    
    if (!apiKey) {
      throw new Error(
        'Asaas: api_key é obrigatório nas credenciais. ' +
        'Verifique se o gateway está configurado corretamente.'
      );
    }

    const environment = credentials.environment || 'production';
    
    return new AsaasAdapter(apiKey, environment);
  }

  /**
   * Lista todos os gateways suportados
   * 
   * @returns Array com os nomes dos gateways suportados
   * 
   * @example
   * ```typescript
   * const gateways = PaymentFactory.getSupportedGateways();
   * console.log(gateways); // ['mercadopago', 'pushinpay']
   * ```
   */
  static getSupportedGateways(): string[] {
    return [
      'mercadopago',
      'pushinpay',
      'asaas'
    ];
  }

  /**
   * Verifica se um gateway é suportado
   * 
   * @param gatewayName - Nome do gateway a verificar
   * @returns true se o gateway é suportado, false caso contrário
   * 
   * @example
   * ```typescript
   * if (PaymentFactory.isSupported('stripe')) {
   *   // Gateway suportado
   * }
   * ```
   */
  static isSupported(gatewayName: string): boolean {
    const normalized = gatewayName.toLowerCase().trim();
    const supported = this.getSupportedGateways();
    return supported.includes(normalized);
  }
}
