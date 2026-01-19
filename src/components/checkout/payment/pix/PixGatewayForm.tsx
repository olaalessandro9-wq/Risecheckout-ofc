/**
 * PixGatewayForm - Factory Component para PIX
 * 
 * Este componente renderiza o formulário de PIX correto
 * baseado no gateway selecionado. Segue o Factory Pattern.
 * 
 * Para adicionar um novo gateway:
 * 1. Criar arquivo em ./gateways/PixFormNovoGateway.tsx
 * 2. Adicionar no switch case abaixo
 * 3. Adicionar no registry (src/config/payment-gateways.ts)
 */

import { type PaymentGatewayId, type PixFormProps } from '@/types/payment-types';
import { PixFormPushinpay } from './gateways/PixFormPushinpay';
import { PixFormMercadoPago } from './gateways/PixFormMercadoPago';
import { createLogger } from '@/lib/logger';

const log = createLogger("PixGatewayForm");

interface PixGatewayFormProps extends Omit<PixFormProps, 'gatewayId'> {
  gatewayId: PaymentGatewayId;
}

export function PixGatewayForm({ gatewayId, ...props }: PixGatewayFormProps) {
  switch (gatewayId) {
    case 'pushinpay':
      return <PixFormPushinpay {...props} />;
    
    case 'mercadopago':
      return <PixFormMercadoPago {...props} />;
    
    // Futuros gateways:
    // case 'pagseguro':
    //   return <PixFormPagSeguro {...props} />;
    
    default:
      log.warn(`Gateway "${gatewayId}" não suportado para PIX`);
      return (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
          <p className="text-sm text-destructive">
            Gateway de PIX não configurado ou não suportado.
          </p>
        </div>
      );
  }
}
