/**
 * SharedCheckoutLayout
 * 
 * Componente compartilhado que contém TODA a estrutura de layout do checkout
 * 
 * REFATORADO: Lógica de submit extraída para useCheckoutSubmit (< 280 linhas)
 */

import React from 'react';
import { CheckCircle, Wallet, Zap } from 'lucide-react';
import {
  SharedProductSection, SharedPersonalDataForm, SharedPaymentMethodSelector,
  SharedOrderBumps, SharedOrderSummary, SharedCheckoutButton,
} from './index';
import { useCheckoutSubmit } from '@/hooks/checkout/useCheckoutSubmit';

import type { RequiredFieldsConfig, AppliedCoupon } from "@/types/checkout-shared.types";
import { normalizeRequiredFields } from "@/types/checkout-shared.types";
import type { OrderBump, CheckoutFormData, CheckoutFormErrors, ProductData } from "@/types/checkout";
import type { ThemePreset } from "@/lib/checkout/themePresets";

interface SharedCheckoutLayoutProps {
  productData: ProductData;
  orderBumps: OrderBump[];
  design: ThemePreset;
  selectedPayment: 'pix' | 'credit_card';
  onPaymentChange: (payment: 'pix' | 'credit_card') => void;
  selectedBumps: Set<string>;
  onToggleBump: (bumpId: string) => void;
  mode: 'editor' | 'preview' | 'public';
  formData?: CheckoutFormData;
  formErrors?: CheckoutFormErrors;
  onFieldChange?: (field: string, value: string) => void;
  requiredFields?: RequiredFieldsConfig | Record<string, boolean> | unknown;
  isProcessing?: boolean;
  publicKey?: string | null;
  creditCardGateway?: string;
  amount?: number;
  onSubmitPayment?: (token: string, installments: number, paymentMethodId: string, issuerId: string, holderDocument?: string) => Promise<void>;
  onTotalChange?: (total: number, appliedCoupon: AppliedCoupon | null) => void;
  additionalContent?: React.ReactNode;
  formWrapper?: (children: React.ReactNode, formRef: React.RefObject<HTMLFormElement>) => React.ReactNode;
}

export const SharedCheckoutLayout: React.FC<SharedCheckoutLayoutProps> = ({
  productData, orderBumps, design, selectedPayment, onPaymentChange, selectedBumps, onToggleBump,
  mode, formData, formErrors, onFieldChange, requiredFields, isProcessing, publicKey,
  creditCardGateway, amount, onSubmitPayment, onTotalChange, additionalContent, formWrapper,
}) => {
  const { formRef, handleCardSubmitReady, handleCheckoutClick } = useCheckoutSubmit(selectedPayment);

  // Normalize required fields to ensure correct type
  const normalizedRequiredFields = normalizeRequiredFields(requiredFields);

  const needsBorder = () => {
    const bgColor = design.colors.background || '#000000';
    const formBgColor = design.colors.formBackground || '#FFFFFF';
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16);
      return ((0.299 * ((rgb >> 16) & 0xff) + 0.587 * ((rgb >> 8) & 0xff) + 0.114 * (rgb & 0xff)) / 255);
    };
    return Math.abs(getLuminance(bgColor) - getLuminance(formBgColor)) < 0.3;
  };

  const borderStyle = needsBorder() ? '1px solid rgba(0, 0, 0, 0.1)' : 'none';

  const Divider = () => (
    <hr className="border-t my-6" style={{ 
      borderColor: design.colors.primaryText === '#FFFFFF' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' 
    }} />
  );

  const content = (
    <div className="rounded-xl shadow-sm p-6 space-y-6" style={{ backgroundColor: design.colors.formBackground || '#FFFFFF', border: borderStyle }}>
      {/* Produto */}
      {productData && (
        <>
          <SharedProductSection productData={productData} design={design} mode={mode} />
          <Divider />
        </>
      )}
      
      {/* Formulário de Dados Pessoais */}
      <SharedPersonalDataForm design={design} mode={mode} disabled={false} formData={formData} formErrors={formErrors} onFieldChange={onFieldChange} requiredFields={normalizedRequiredFields} />
      <Divider />

      {/* Seção de Pagamento */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: design.colors.primaryText }}>
          <Wallet className="w-5 h-5" /> Pagamento
        </h2>
        
        <div className="space-y-4">
          <SharedPaymentMethodSelector selectedPayment={selectedPayment} onPaymentChange={onPaymentChange} design={design} mode={mode} disabled={false}
            publicKey={publicKey} creditCardGateway={creditCardGateway} amount={amount} onSubmitPayment={onSubmitPayment} isProcessing={isProcessing} onCardSubmitReady={handleCardSubmitReady} />

          {selectedPayment === 'pix' && (
            <div 
              className="p-4 rounded-r-lg flex items-start gap-3 relative overflow-hidden"
              style={{ 
                backgroundColor: design.colors.infoBox?.background || '#ECFDF5',
                borderLeft: `4px solid ${design.colors.infoBox?.border || design.colors.active}` 
              }}
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: design.colors.active }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: design.colors.infoBox?.text || design.colors.primaryText }}>Liberação imediata</p>
                <p className="text-sm mt-1" style={{ color: design.colors.secondaryText }}>É simples, só usar o aplicativo do seu banco para pagar Pix</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Bumps */}
      {orderBumps && orderBumps.length > 0 && (
        <>
          <Divider />
          <div className="mt-8 mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: design.colors.primaryText }}>
              <Zap className="w-5 h-5 fill-current" /> Ofertas limitadas
            </h3>
          </div>
          <SharedOrderBumps orderBumps={orderBumps} selectedBumps={selectedBumps} onToggleBump={onToggleBump} design={design} mode={mode} disabled={false} />
        </>
      )}

      {/* Resumo do Pedido */}
      {productData && (
        <>
          <Divider />
          <SharedOrderSummary productData={productData} orderBumps={orderBumps} selectedBumps={selectedBumps} design={design} mode={mode} onTotalChange={onTotalChange} />
        </>
      )}

      {/* Botão de Finalizar */}
      <div className="mt-6">
        <SharedCheckoutButton selectedPayment={selectedPayment} design={design} mode={mode} isProcessing={isProcessing}
          disabled={false} onClick={handleCheckoutClick} />
      </div>

      {additionalContent}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {formWrapper ? formWrapper(content, formRef as React.RefObject<HTMLFormElement>) : content}
    </div>
  );
};
