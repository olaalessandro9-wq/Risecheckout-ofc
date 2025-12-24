/**
 * PaymentSection - Componente Unificado de Pagamento
 * 
 * Responsabilidade Única: Renderizar a seção de seleção de método de pagamento
 * e o container onde o formulário de cartão (Mercado Pago Brick) será montado.
 * 
 * Este componente é apenas para apresentação (UI). Toda a lógica de pagamento
 * está no hook usePaymentGateway.
 * 
 * @version 3.0 - Unificado (substituindo PaymentSectionV2 e v2/PaymentSectionV2)
 */

import React, { useMemo } from "react";
import { Wallet, Loader2, Lock } from "lucide-react";
import { PixIcon } from "@/components/icons/PixIcon";
import { CreditCardIcon } from "@/components/icons/CreditCardIcon";
import type { ThemePreset } from "@/lib/checkout/themePresets";

// ============================================================================
// TYPES
// ============================================================================

type PaymentMethod = 'pix' | 'credit_card';

interface PaymentSectionProps {
  /** Método de pagamento selecionado */
  selectedPayment: PaymentMethod;
  
  /** Callback quando o método de pagamento muda */
  onPaymentChange: (method: PaymentMethod) => void;
  
  /** ID do container onde o Brick será montado */
  brickContainerId: string;
  
  /** Se o Brick está pronto para uso */
  isBrickReady: boolean;
  
  /** Se o SDK do Mercado Pago está carregado */
  isSDKLoaded?: boolean;
  
  /** 
   * Tema/design do checkout (compatibilidade com PublicCheckout)
   * Se fornecido, usa design.colors
   */
  design?: ThemePreset;
  
  /**
   * Cores customizadas (compatibilidade com PublicCheckoutV2)
   * Se fornecido, usa colors diretamente
   */
  colors?: {
    formBackground?: string;
    primaryText?: string;
    secondaryText?: string;
    active?: string;
    border?: string;
    selectedButton?: {
      background: string;
      text: string;
    };
    unselectedButton?: {
      background: string;
      text: string;
      icon: string;
    };
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Seção de pagamento do checkout.
 * 
 * Permite ao usuário selecionar entre PIX e Cartão de Crédito,
 * e exibe o formulário de cartão quando necessário.
 * 
 * @example
 * // Com design (PublicCheckout)
 * <PaymentSection
 *   selectedPayment="pix"
 *   onPaymentChange={setSelectedPayment}
 *   brickContainerId="payment-brick"
 *   isBrickReady={false}
 *   isSDKLoaded={true}
 *   design={design}
 * />
 * 
 * @example
 * // Com colors (PublicCheckoutV2)
 * <PaymentSection
 *   selectedPayment="pix"
 *   onPaymentChange={setSelectedPayment}
 *   brickContainerId="payment-brick"
 *   isBrickReady={false}
 *   colors={design.colors}
 * />
 */
export const PaymentSection: React.FC<PaymentSectionProps> = ({
  selectedPayment,
  onPaymentChange,
  brickContainerId,
  isBrickReady,
  isSDKLoaded = true,
  design,
  colors,
}) => {
  // ============================================================================
  // COMPUTED STYLES
  // ============================================================================
  
  // Normalizar cores: aceita tanto design quanto colors
  const normalizedColors = useMemo(() => {
    const baseColors = design?.colors || colors || {};
    
    return {
      formBackground: baseColors.formBackground || '#FFFFFF',
      primaryText: baseColors.primaryText || '#1F2937',
      secondaryText: baseColors.secondaryText || '#6B7280',
      active: baseColors.active || '#10B981',
      border: baseColors.border || '#E5E7EB',
      selectedButton: {
        background: baseColors.selectedButton?.background || '#10B981',
        text: baseColors.selectedButton?.text || '#FFFFFF',
      },
      unselectedButton: {
        background: baseColors.unselectedButton?.background || '#F9FAFB',
        text: baseColors.unselectedButton?.text || '#6B7280',
        icon: baseColors.unselectedButton?.icon || '#9CA3AF',
      },
    };
  }, [design, colors]);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div 
      className="rounded-xl p-5"
      style={{ backgroundColor: normalizedColors.formBackground }}
    >
      {/* Título da Seção */}
      <h2 
        className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight"
        style={{ color: normalizedColors.primaryText }}
      >
        <Wallet className="w-5 h-5" />
        Pagamento
      </h2>
      
      {/* Botões de Seleção de Método */}
      <div className="space-y-2.5 mb-4">
        {/* PIX */}
        <button
          type="button"
          onClick={() => onPaymentChange('pix')}
          className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 text-left"
          style={{
            backgroundColor: selectedPayment === 'pix'
              ? normalizedColors.selectedButton.background
              : normalizedColors.unselectedButton.background,
            borderColor: selectedPayment === 'pix'
              ? normalizedColors.active
              : normalizedColors.border,
            color: selectedPayment === 'pix'
              ? normalizedColors.selectedButton.text
              : normalizedColors.unselectedButton.text,
            outline: 'none',
          }}
        >
          <div className="flex items-center gap-3">
            <PixIcon 
              className="w-5 h-5" 
              color={selectedPayment === 'pix'
                ? normalizedColors.selectedButton.text
                : normalizedColors.unselectedButton.icon
              }
            />
            <span className="font-semibold text-sm">PIX</span>
          </div>
        </button>

        {/* Cartão de Crédito */}
        <button
          type="button"
          onClick={() => onPaymentChange('credit_card')}
          className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 text-left"
          style={{
            backgroundColor: selectedPayment === 'credit_card'
              ? normalizedColors.selectedButton.background
              : normalizedColors.unselectedButton.background,
            borderColor: selectedPayment === 'credit_card'
              ? normalizedColors.active
              : normalizedColors.border,
            color: selectedPayment === 'credit_card'
              ? normalizedColors.selectedButton.text
              : normalizedColors.unselectedButton.text,
            outline: 'none',
          }}
        >
          <div className="flex items-center gap-3">
            <CreditCardIcon 
              className="w-5 h-5" 
              color={selectedPayment === 'credit_card'
                ? normalizedColors.selectedButton.text
                : normalizedColors.unselectedButton.icon
              }
            />
            <span className="font-semibold text-sm">Cartão de Crédito</span>
          </div>
        </button>
      </div>

      {/* Mensagem de Segurança */}
      <div 
        className="flex items-center gap-2 text-sm mb-4"
        style={{ color: normalizedColors.secondaryText }}
      >
        <Lock className="w-4 h-4" />
        <span>Pagamento 100% seguro e criptografado</span>
      </div>

      {/* Formulário de Cartão (renderizado pelo Mercado Pago Brick) */}
      {selectedPayment === 'credit_card' && (
        <div className="mt-4">
          {!isSDKLoaded ? (
            // Loading do SDK
            <div className="flex items-center justify-center py-8">
              <Loader2 
                className="w-6 h-6 animate-spin" 
                style={{ color: normalizedColors.active }} 
              />
              <span 
                className="ml-2 text-sm" 
                style={{ color: normalizedColors.secondaryText }}
              >
                Carregando formulário...
              </span>
            </div>
          ) : (
            <>
              {/* Container onde o Brick será montado */}
              <div id={brickContainerId} className="min-h-[300px]"></div>
              
              {/* Loading do Brick */}
              {!isBrickReady && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 
                    className="w-5 h-5 animate-spin" 
                    style={{ color: normalizedColors.active }} 
                  />
                  <span 
                    className="ml-2 text-sm" 
                    style={{ color: normalizedColors.secondaryText }}
                  >
                    Inicializando formulário seguro...
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export type { PaymentSectionProps, PaymentMethod };
