/**
 * Gateway Factory
 * 
 * Factory pattern para criar instâncias de gateways.
 * Facilita adicionar novos gateways no futuro.
 * 
 * NOTA: Apenas gateways implementados são incluídos aqui.
 * Gateways "coming_soon" são registrados em src/config/payment-gateways.ts
 */

import { mercadoPagoGateway } from './gateways/mercado-pago';
import { stripeGateway } from './gateways/stripe';

type ImplementedGateway = 'mercadopago' | 'stripe';

const gateways: Record<ImplementedGateway, typeof mercadoPagoGateway | typeof stripeGateway> = {
  mercadopago: mercadoPagoGateway,
  stripe: stripeGateway,
};

/**
 * Obtém uma instância do gateway pelo tipo
 */
export function getGateway(type: string) {
  const gateway = gateways[type as ImplementedGateway];
  
  if (!gateway) {
    throw new Error(`Gateway "${type}" não suportado ou não implementado`);
  }
  
  return gateway;
}

/**
 * Lista todos os gateways implementados
 */
export function getAvailableGateways(): ImplementedGateway[] {
  return Object.keys(gateways) as ImplementedGateway[];
}

/**
 * Verifica se um gateway é suportado
 */
export function isGatewaySupported(type: string): boolean {
  return type in gateways;
}
