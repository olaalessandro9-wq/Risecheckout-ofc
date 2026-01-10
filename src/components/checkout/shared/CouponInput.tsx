/**
 * CouponInput
 * 
 * Componente de input de cupom extraído de SharedOrderSummary
 */

import React from 'react';

interface CouponInputProps {
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  appliedCoupon: { code: string } | null;
  isValidating: boolean;
  onValidate: () => void;
  onRemove: () => void;
  design: {
    colors: {
      primaryText: string;
      formBackground: string;
      active: string;
    };
  };
}

export const CouponInput: React.FC<CouponInputProps> = ({
  couponCode,
  onCouponCodeChange,
  appliedCoupon,
  isValidating,
  onValidate,
  onRemove,
  design,
}) => {
  return (
    <div className="pt-2">
      <label 
        className="text-sm font-medium mb-2 flex items-center gap-2"
        style={{ color: design.colors.primaryText }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Cupom de desconto
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
          placeholder="DIGITE O CÓDIGO"
          disabled={isValidating || !!appliedCoupon}
          className="flex-1 px-3 py-2 border rounded-lg text-sm uppercase transition-colors focus:ring-2 focus:ring-opacity-50"
          style={{ 
            borderColor: design.colors.primaryText + '20',
            color: design.colors.primaryText,
            backgroundColor: design.colors.formBackground,
          }}
        />
        {!appliedCoupon ? (
          <button
            type="button"
            onClick={onValidate}
            disabled={isValidating || !couponCode.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: design.colors.active,
              color: '#FFFFFF'
            }}
          >
            {isValidating ? 'Validando...' : 'Aplicar'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onRemove}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: '#EF4444',
              color: '#FFFFFF'
            }}
          >
            Remover
          </button>
        )}
      </div>
    </div>
  );
};
