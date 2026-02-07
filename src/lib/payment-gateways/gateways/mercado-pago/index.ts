/**
 * Mercado Pago Gateway
 * 
 * Exportações do gateway Mercado Pago
 */

export { MercadoPagoCardForm } from './MercadoPagoCardForm';

import { generateInstallments } from '../../installments';

const MERCADO_PAGO_INTEREST_RATE = 0.0299; // 2.99% ao mês

export const mercadoPagoGateway = {
  id: 'mercadopago' as const,
  displayName: 'Mercado Pago',
  
  generateInstallments(amountCents: number, maxInstallments = 9) {
    return generateInstallments(amountCents, {
      interestRate: MERCADO_PAGO_INTEREST_RATE,
      maxInstallments,
    });
  },
  
  getInterestRate() {
    return MERCADO_PAGO_INTEREST_RATE;
  },
};
