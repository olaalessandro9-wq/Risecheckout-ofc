/**
 * Stripe Gateway
 * 
 * Exportações do gateway Stripe
 */

export { StripeCardForm } from './StripeCardForm';
export { StripePix } from './StripePix';

import { generateInstallments } from '../../installments';

const STRIPE_INTEREST_RATE = 0.0199; // 1.99% ao mês

export const stripeGateway = {
  id: 'stripe' as const,
  displayName: 'Stripe',
  
  generateInstallments(amountCents: number, maxInstallments = 12) {
    return generateInstallments(amountCents, {
      interestRate: STRIPE_INTEREST_RATE,
      maxInstallments,
    });
  },
  
  getInterestRate() {
    return STRIPE_INTEREST_RATE;
  },
};
