/**
 * PixFormPushinpay - Formulário PIX para PushinPay
 * 
 * Este componente é responsável por renderizar a interface
 * de pagamento PIX usando o gateway PushinPay.
 * 
 * O fluxo atual já usa o Edge Function pushinpay-create-pix,
 * então este componente serve como wrapper de documentação
 * e ponto de extensão para customizações futuras.
 */

import { type PixPaymentData } from '@/types/payment-types';

interface PixFormPushinpayProps {
  amountCents: number;
  orderId: string;
  onPaymentCreated: (data: PixPaymentData) => void;
  onError?: (error: Error) => void;
}

export function PixFormPushinpay({ 
  amountCents, 
  orderId,
  onPaymentCreated, 
  onError 
}: PixFormPushinpayProps) {
  /**
   * NOTA: O PIX PushinPay atualmente é criado via usePaymentGateway hook,
   * que chama o Edge Function pushinpay-create-pix.
   * 
   * Este componente pode ser expandido no futuro para:
   * - Adicionar UI customizada para PushinPay
   * - Mostrar informações específicas do gateway
   * - Implementar polling de status específico
   */
  
  return null; // Renderização é feita pelo PixPaymentPage
}

PixFormPushinpay.displayName = 'PixFormPushinpay';
