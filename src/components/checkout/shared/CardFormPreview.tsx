/**
 * CardFormPreview
 * 
 * Componente de preview do formulário de cartão de crédito para o Builder.
 * Mostra apenas o LAYOUT visual (sem iframes do SDK).
 * 
 * ✅ Usado no Builder e Preview para visualização
 * ✅ Layout consistente independente do gateway
 * ✅ Campos estilizados conforme design do checkout
 * ✅ Preparado para futuras integrações (Stripe, PagarMe, etc.)
 */

import React from 'react';

interface CreditCardFieldColors {
  textColor?: string;
  placeholderColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  focusBorderColor?: string;
  focusTextColor?: string;
}

interface CardFormPreviewProps {
  design: {
    colors: {
      primaryText: string;
      secondaryText: string;
      formBackground: string;
      creditCardFields?: CreditCardFieldColors;
    };
  };
}

export const CardFormPreview: React.FC<CardFormPreviewProps> = ({ design }) => {
  const colors = design.colors;
  const ccFields = colors.creditCardFields || {};
  
  // Cores dos campos com fallbacks inteligentes baseados nas configurações
  const fieldBg = ccFields.backgroundColor || (colors.primaryText === '#FFFFFF' ? '#1a1a1a' : '#f9fafb');
  const fieldBorder = ccFields.borderColor || (colors.primaryText === '#FFFFFF' ? '#333' : '#e5e7eb');
  const fieldText = ccFields.textColor || colors.primaryText;
  const fieldPlaceholder = ccFields.placeholderColor || colors.secondaryText;

  // Estilo base para os campos
  const fieldStyle: React.CSSProperties = {
    backgroundColor: fieldBg,
    borderColor: fieldBorder,
    color: fieldText,
  };

  // Estilo para labels
  const labelStyle: React.CSSProperties = {
    color: colors.secondaryText,
  };

  return (
    <div className="space-y-3">
      {/* Número do Cartão */}
      <div className="space-y-1">
        <label 
          className="block text-[11px] font-normal opacity-70"
          style={labelStyle}
        >
          Número do cartão
        </label>
        <div 
          className="h-9 px-3 rounded-xl border flex items-center"
          style={fieldStyle}
        >
          <span 
            className="text-sm opacity-50"
            style={{ color: fieldPlaceholder }}
          >
            0000 0000 0000 0000
          </span>
        </div>
      </div>

      {/* Nome do Titular */}
      <div className="space-y-1">
        <label 
          className="block text-[11px] font-normal opacity-70"
          style={labelStyle}
        >
          Nome do titular
        </label>
        <div 
          className="h-9 px-3 rounded-xl border flex items-center"
          style={fieldStyle}
        >
          <span 
            className="text-sm opacity-50"
            style={{ color: fieldPlaceholder }}
          >
            Nome como está no cartão
          </span>
        </div>
      </div>

      {/* Validade e CVV */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label 
            className="block text-[11px] font-normal opacity-70"
            style={labelStyle}
          >
            Validade
          </label>
          <div 
            className="h-9 px-3 rounded-xl border flex items-center"
            style={fieldStyle}
          >
            <span 
              className="text-sm opacity-50"
              style={{ color: fieldPlaceholder }}
            >
              MM/AA
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <label 
            className="block text-[11px] font-normal opacity-70"
            style={labelStyle}
          >
            CVV
          </label>
          <div 
            className="h-9 px-3 rounded-xl border flex items-center"
            style={fieldStyle}
          >
            <span 
              className="text-sm opacity-50"
              style={{ color: fieldPlaceholder }}
            >
              000
            </span>
          </div>
        </div>
      </div>

      {/* CPF */}
      <div className="space-y-1">
        <label 
          className="block text-[11px] font-normal opacity-70"
          style={labelStyle}
        >
          CPF do titular
        </label>
        <div 
          className="h-9 px-3 rounded-xl border flex items-center"
          style={fieldStyle}
        >
          <span 
            className="text-sm opacity-50"
            style={{ color: fieldPlaceholder }}
          >
            000.000.000-00
          </span>
        </div>
      </div>

      {/* Parcelas */}
      <div className="space-y-1">
        <label 
          className="block text-[11px] font-normal opacity-70"
          style={labelStyle}
        >
          Parcelas
        </label>
        <div 
          className="h-9 px-3 rounded-xl border flex items-center justify-between"
          style={fieldStyle}
        >
          <span 
            className="text-sm"
            style={{ color: fieldText }}
          >
            1x de R$ 97,00
          </span>
          <svg 
            className="w-4 h-4 opacity-50" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: fieldText }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
