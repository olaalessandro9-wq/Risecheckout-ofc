/**
 * PixFormMercadoPago - Formulário PIX para Mercado Pago
 * 
 * Este componente é responsável por renderizar a interface
 * de pagamento PIX usando o gateway Mercado Pago.
 * 
 * O fluxo atual já usa o Edge Function mercadopago-create-payment,
 * então este componente serve como wrapper de documentação
 * e ponto de extensão para customizações futuras.
 */

import { type PixPaymentData } from '@/types/payment-types';

interface PixFormMercadoPagoProps {
  amountCents: number;
  orderId: string;
  onPaymentCreated: (data: PixPaymentData) => void;
  onError?: (error: Error) => void;
}

export function PixFormMercadoPago({ 
  amountCents, 
  orderId,
  onPaymentCreated, 
  onError 
}: PixFormMercadoPagoProps) {
  /**
   * NOTA: O PIX Mercado Pago atualmente é criado via usePaymentGateway hook,
   * que chama o Edge Function mercadopago-create-payment com payment_method: 'pix'.
   * 
   * Este componente pode ser expandido no futuro para:
   * - Adicionar UI customizada para Mercado Pago PIX
   * - Mostrar informações específicas do gateway
   * - Implementar polling de status específico
   */
  
  return null; // Renderização é feita pelo PixPaymentPage
}

PixFormMercadoPago.displayName = 'PixFormMercadoPago';
