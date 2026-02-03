/**
 * GatewayCardForm - Componente Unificado de Formulário de Cartão
 * 
 * RISE Protocol V3 Compliant - Design Tokens
 * PHASE 2: Uses dynamic imports for lazy-loaded payment SDKs.
 * 
 * Seleciona automaticamente o formulário correto baseado no gateway.
 * 
 * Gateways Suportados:
 * - mercadopago: DynamicMercadoPagoForm ✅ (lazy-loaded)
 * - stripe: DynamicStripeForm ✅ (lazy-loaded)
 * - pagseguro: PagSeguroCardForm (futuro)
 */

import React from 'react';
import { 
  DynamicMercadoPagoForm, 
  DynamicStripeForm, 
  PaymentGatewayFallback 
} from '@/lib/payment-gateways/dynamic';
import type { CardTokenResult } from '@/lib/payment-gateways';
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
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-sm text-destructive">
          Gateway de pagamento não configurado. Entre em contato com o suporte.
        </p>
      </div>
    );
  }

  if (!isGatewayAvailable(gateway)) {
    log.error(`Gateway "${gateway}" não está disponível`);
    return (
      <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
        <p className="text-sm text-[hsl(var(--warning-foreground))]">
          Gateway "{gatewayConfig.displayName}" ainda não está disponível.
        </p>
      </div>
    );
  }

  // ============================================
  // RENDERIZAÇÃO POR GATEWAY (LAZY-LOADED)
  // ============================================

  switch (gateway) {
    case 'mercadopago':
      return (
        <DynamicMercadoPagoForm
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
        <DynamicStripeForm
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
      return (
        <PaymentGatewayFallback 
          gatewayName={gateway} 
          onRetry={() => window.location.reload()} 
        />
      );
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
    <div className="p-6 bg-muted border border-border rounded-lg text-center">
      <p className="text-sm text-muted-foreground">
        Gateway <strong>{name}</strong> estará disponível em breve.
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Por favor, selecione outro método de pagamento.
      </p>
    </div>
  );
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default GatewayCardForm;
