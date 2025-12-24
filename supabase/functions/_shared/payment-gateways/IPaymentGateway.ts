/**
 * Interface IPaymentGateway - A "Lei" do Sistema de Pagamentos
 * 
 * Esta interface define o contrato que TODOS os gateways de pagamento
 * devem seguir. Isso garante que:
 * 
 * 1. Qualquer gateway pode ser usado de forma intercambiável
 * 2. O código que usa os gateways não precisa saber detalhes de implementação
 * 3. Novos gateways podem ser adicionados sem modificar código existente
 * 4. TypeScript força a implementação correta em tempo de compilação
 * 
 * @example
 * ```typescript
 * const gateway: IPaymentGateway = PaymentFactory.create('mercadopago', credentials);
 * const result = await gateway.createPix(request);
 * ```
 */

import { PaymentRequest, PaymentResponse } from "./types.ts";

export interface IPaymentGateway {
  /**
   * Nome do provedor de pagamento
   * 
   * Exemplos: 'mercadopago', 'pushinpay', 'stripe', 'pagarme'
   */
  readonly providerName: string;

  /**
   * Cria um pagamento via PIX
   * 
   * @param request - Dados padronizados do pagamento
   * @returns Resposta padronizada com QR Code e status
   * 
   * @example
   * ```typescript
   * const result = await gateway.createPix({
   *   amount_cents: 10000, // R$ 100,00
   *   orderId: 'abc123',
   *   customer: {
   *     name: 'João Silva',
   *     email: 'joao@example.com',
   *     document: '12345678900'
   *   },
   *   description: 'Pedido #123'
   * });
   * ```
   */
  createPix(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Cria um pagamento via Cartão de Crédito
   * 
   * @param request - Dados padronizados do pagamento (incluindo cardToken)
   * @returns Resposta padronizada com status da transação
   * 
   * @example
   * ```typescript
   * const result = await gateway.createCreditCard({
   *   amount_cents: 10000,
   *   orderId: 'abc123',
   *   customer: { ... },
   *   description: 'Pedido #123',
   *   cardToken: 'tok_abc123',
   *   installments: 3
   * });
   * ```
   */
  createCreditCard(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Valida se as credenciais fornecidas são válidas
   * 
   * @returns true se as credenciais estão corretas, false caso contrário
   * 
   * @example
   * ```typescript
   * const isValid = await gateway.validateCredentials();
   * if (!isValid) {
   *   throw new Error('Credenciais inválidas');
   * }
   * ```
   */
  validateCredentials(): Promise<boolean>;
}
