/**
 * SharedPaymentMethodSelector
 * 
 * Componente compartilhado para seleção de método de pagamento (PIX/Cartão)
 * Usado por: Builder, Preview e Checkout Público
 * 
 * ✅ Arquitetura Multi-Gateway
 * ✅ Parcelas exibidas imediatamente (sem esperar BIN)
 * ✅ PCI DSS Compliance via @mercadopago/sdk-react
 * ✅ Preview do formulário no Builder (sem iframes)
 * 
 * FEATURE FLAG: USE_NEW_PAYMENT_ARCHITECTURE
 * - Quando ativado: Usa GatewayCardForm (suporta múltiplos gateways)
 * - Quando desativado: Usa MercadoPagoCardForm (comportamento atual)
 */

import React from 'react';
import { PixIcon, CreditCardIcon } from '@/components/icons';
import { MercadoPagoCardForm, type CardTokenResult } from '@/lib/payment-gateways';
import { CardFormPreview } from './CardFormPreview';
import { FEATURE_FLAGS } from '@/config/feature-flags';
import { GatewayCardForm } from '@/components/checkout/payment/GatewayCardForm';

interface CreditCardFieldColors {
  textColor?: string;
  placeholderColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  focusBorderColor?: string;
  focusTextColor?: string;
}

interface SharedPaymentMethodSelectorProps {
  selectedPayment: 'pix' | 'credit_card';
  onPaymentChange: (method: 'pix' | 'credit_card') => void;
  design: {
    colors: {
      primaryText: string;
      secondaryText: string;
      formBackground: string;
      selectedButton: {
        text: string;
        background: string;
        icon: string;
      };
      unselectedButton: {
        text: string;
        background: string;
        icon: string;
      };
      creditCardFields?: CreditCardFieldColors;
    };
  };
  mode?: 'editor' | 'preview' | 'public';
  disabled?: boolean;
  // Props para integração real
  publicKey?: string | null;
  amount?: number; // em centavos
  onSubmitPayment?: (token: string, installments: number, paymentMethodId: string, issuerId: string, holderDocument?: string) => Promise<void>;
  isProcessing?: boolean;
  onCardSubmitReady?: (submitFn: () => void) => void;
  
  // NOVO: Gateway de cartão configurado pelo vendedor
  creditCardGateway?: string;
  payerEmail?: string;
}

export const SharedPaymentMethodSelector: React.FC<SharedPaymentMethodSelectorProps> = ({
  selectedPayment,
  onPaymentChange,
  design,
  mode = 'public',
  disabled = false,
  publicKey,
  amount,
  onSubmitPayment,
  isProcessing = false,
  onCardSubmitReady,
  creditCardGateway = 'mercadopago', // Default para Mercado Pago
  payerEmail,
}) => {
  const isPixSelected = selectedPayment === 'pix';
  const isCardSelected = selectedPayment === 'credit_card';

  const getButtonStyle = (isSelected: boolean) => ({
    backgroundColor: isSelected 
      ? design.colors.selectedButton.background 
      : design.colors.unselectedButton.background,
    color: isSelected 
      ? design.colors.selectedButton.text 
      : design.colors.unselectedButton.text,
    borderColor: isSelected 
      ? design.colors.selectedButton.background 
      : design.colors.unselectedButton.background,
  });

  const getIconColor = (isSelected: boolean) => 
    isSelected 
      ? design.colors.selectedButton.icon 
      : design.colors.unselectedButton.icon;

  // Adapter para converter CardTokenResult para a interface existente
  const handleCardSubmit = async (result: CardTokenResult) => {
    if (onSubmitPayment) {
      await onSubmitPayment(
        result.token,
        result.installments,
        result.paymentMethodId,
        result.issuerId,
        result.holderDocument // Propagar CPF do titular
      );
    }
  };

  // Determinar se mostra preview ou formulário real
  const showRealForm = mode === 'public' && publicKey && amount && onSubmitPayment;
  const showPreviewForm = mode === 'editor' || mode === 'preview';

  const fallbackBorderColor =
    design.colors.creditCardFields?.borderColor ??
    (design.colors.primaryText === '#FFFFFF'
      ? 'rgba(255, 255, 255, 0.16)'
      : 'rgba(0, 0, 0, 0.12)');

  // Determinar qual componente de formulário usar
  const useNewArchitecture = FEATURE_FLAGS.USE_NEW_PAYMENT_ARCHITECTURE;

  return (
    <div>
      <div className="space-y-3 mb-6">
        {/* Botão PIX */}
        <button
          type="button"
          onClick={() => !disabled && onPaymentChange('pix')}
          disabled={disabled}
          className="w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all font-medium"
          style={getButtonStyle(isPixSelected)}
        >
          <PixIcon color={getIconColor(isPixSelected)} className="w-6 h-6" />
          <span>PIX</span>
        </button>

        {/* Botão Cartão de Crédito */}
        <button
          type="button"
          onClick={() => !disabled && onPaymentChange('credit_card')}
          disabled={disabled}
          className="w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all font-medium"
          style={getButtonStyle(isCardSelected)}
        >
          <CreditCardIcon color={getIconColor(isCardSelected)} className="w-6 h-6" />
          <span>Cartão de Crédito</span>
        </button>
      </div>

      {/* 
        FORMULÁRIO DE CARTÃO - LÓGICA DE RENDERIZAÇÃO:
        
        1. Builder/Preview: Mostra CardFormPreview (layout visual sem iframes)
           - Permite visualizar e editar estilos
           - Consistente para qualquer gateway futuro
        
        2. Checkout Público: 
           - USE_NEW_PAYMENT_ARCHITECTURE = true: GatewayCardForm (multi-gateway)
           - USE_NEW_PAYMENT_ARCHITECTURE = false: MercadoPagoCardForm (atual)
      */}
      
      {/* Preview para Builder/Preview - Mostra quando cartão selecionado */}
      {showPreviewForm && (
        <div 
          className={`mt-4 transition-all duration-300 ${
            isCardSelected 
              ? 'opacity-100 h-auto' 
              : 'opacity-0 h-0 overflow-hidden pointer-events-none'
          }`}
          aria-hidden={!isCardSelected}
        >
          <CardFormPreview design={design} />
        </div>
      )}

      {/* Formulário Real para Checkout Público */}
      {showRealForm && (
        <div 
          className={`mt-4 transition-all duration-300 ${
            isCardSelected 
              ? 'opacity-100 h-auto' 
              : 'opacity-0 h-0 overflow-hidden pointer-events-none'
          }`}
          aria-hidden={!isCardSelected}
        >
          {useNewArchitecture ? (
            // NOVA ARQUITETURA: GatewayCardForm (multi-gateway)
            <GatewayCardForm
              gateway={creditCardGateway}
              publicKey={publicKey}
              amount={amount}
              payerEmail={payerEmail}
              onSubmit={handleCardSubmit}
              isProcessing={isProcessing}
              onMount={onCardSubmitReady}
              textColor={design.colors.creditCardFields?.textColor || design.colors.primaryText}
              placeholderColor={design.colors.creditCardFields?.placeholderColor || design.colors.secondaryText}
              backgroundColor={design.colors.creditCardFields?.backgroundColor || design.colors.formBackground}
              borderColor={fallbackBorderColor}
            />
          ) : (
            // ARQUITETURA ATUAL: MercadoPagoCardForm (hardcoded)
            <MercadoPagoCardForm 
              publicKey={publicKey}
              amount={amount}
              onSubmit={handleCardSubmit}
              isProcessing={isProcessing}
              onMount={onCardSubmitReady}
              textColor={design.colors.creditCardFields?.textColor || design.colors.primaryText}
              placeholderColor={design.colors.creditCardFields?.placeholderColor || design.colors.secondaryText}
              backgroundColor={design.colors.creditCardFields?.backgroundColor || design.colors.formBackground}
              borderColor={fallbackBorderColor}
            />
          )}
        </div>
      )}
    </div>
  );
};

};
