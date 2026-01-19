/**
 * GatewayCardForm - Componente Unificado de Formulário de Cartão
 * 
 * Este componente seleciona automaticamente o formulário correto
 * baseado no gateway configurado pelo vendedor.
 * 
 * Gateways Suportados:
 * - mercadopago: MercadoPagoCardForm ✅
 * - stripe: StripeCardForm ✅
 * - pagseguro: PagSeguroCardForm (futuro)
 */

import React from 'react';
import { MercadoPagoCardForm, type CardTokenResult } from '@/lib/payment-gateways';
import { StripeCardForm } from '@/lib/payment-gateways/gateways/stripe';
import { getGatewayById, isGatewayAvailable } from '@/config/payment-gateways';
import { createLogger } from "@/lib/logger";

const log = createLogger("GatewayCardForm");

// ============================================
// TIPOS
// ============================================

export interface GatewayCardFormProps {
  gateway: string;
  publicKey: string;
  amount: number; // em centavos
  payerEmail?: string;
  onSubmit: (result: CardTokenResult) => Promise<void>;
  isProcessing?: boolean;
  onMount?: (submitFn: () => void) => void;
  
  // Estilos customizáveis
  textColor?: string;
  placeholderColor?: string;
  backgroundColor?: string;
  borderColor?: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const GatewayCardForm: React.FC<GatewayCardFormProps> = ({
  gateway,
  publicKey,
  amount,
  payerEmail,
  onSubmit,
  isProcessing = false,
  onMount,
  textColor,
  placeholderColor,
  backgroundColor,
  borderColor,
}) => {
  // Verificar se o gateway está disponível
  const gatewayConfig = getGatewayById(gateway);
  
  if (!gatewayConfig) {
    log.error(`Gateway "${gateway}" não encontrado no registry`);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">
          Gateway de pagamento não configurado. Entre em contato com o suporte.
        </p>
      </div>
    );
  }

  if (!isGatewayAvailable(gateway)) {
    log.error(`Gateway "${gateway}" não está disponível`);
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-600">
          Gateway "{gatewayConfig.displayName}" ainda não está disponível.
        </p>
      </div>
    );
  }

  // ============================================
  // RENDERIZAÇÃO POR GATEWAY
  // ============================================

  switch (gateway) {
    case 'mercadopago':
      return (
        <MercadoPagoCardForm
          publicKey={publicKey}
          amount={amount}
          onSubmit={onSubmit}
          isProcessing={isProcessing}
          onMount={onMount}
          textColor={textColor}
          placeholderColor={placeholderColor}
          backgroundColor={backgroundColor}
          borderColor={borderColor}
        />
      );

    case 'stripe':
      return (
        <StripeCardForm
          publicKey={publicKey}
          amount={amount}
          onSubmit={async (result) => {
            // Adaptar resultado do Stripe para o formato esperado
            await onSubmit({
              token: result.paymentMethodId,
              paymentMethodId: result.paymentMethodId,
              issuerId: '',
              installments: result.installments,
            });
          }}
          isProcessing={isProcessing}
          onMount={onMount}
          colors={{
            text: textColor,
            placeholder: placeholderColor,
            background: backgroundColor,
            border: borderColor,
          }}
        />
      );

    case 'pagseguro':
      return <GatewayComingSoon name="PagSeguro" />;

    case 'cielo':
    case 'rede':
      return <GatewayComingSoon name={gatewayConfig.displayName} />;

    default:
      log.warn(`Gateway "${gateway}" não implementado`);
      return <GatewayComingSoon name={gateway} />;
  }
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface GatewayComingSoonProps {
  name: string;
}

function GatewayComingSoon({ name }: GatewayComingSoonProps) {
  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
      <p className="text-sm text-gray-600">
        Gateway <strong>{name}</strong> estará disponível em breve.
      </p>
      <p className="text-xs text-gray-500 mt-2">
        Por favor, selecione outro método de pagamento.
      </p>
    </div>
  );
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default GatewayCardForm;
