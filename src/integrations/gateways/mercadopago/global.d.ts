/**
 * Declarações globais para o Mercado Pago SDK
 * 
 * Este arquivo declara os tipos globais necessários para usar a SDK do Mercado Pago
 * carregada via script externo (https://sdk.mercadopago.com/js/v2)
 */

interface Window {
  /**
   * SDK do Mercado Pago
   * 
   * Carregada dinamicamente via script tag.
   * Fornece acesso aos Bricks (formulários de pagamento) e outras funcionalidades.
   * 
   * @see https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/landing
   */
  MercadoPago: any;
}
