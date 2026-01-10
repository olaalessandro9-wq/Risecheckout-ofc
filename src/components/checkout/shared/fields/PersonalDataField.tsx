/**
 * PersonalDataField
 * 
 * Componente atômico reutilizável para campos de formulário pessoal.
 * Suporta validação visual, máscaras e ícones de feedback.
 */

import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ValidationState {
  isValid: boolean;
  error: string | null;
  isTouched: boolean;
}

interface FieldColors {
  textColor: string;
  placeholderColor: string;
  borderColor: string;
  backgroundColor: string;
  focusBorderColor: string;
  focusTextColor?: string;
}

interface PersonalDataFieldProps {
  name: string;
  type: 'text' | 'email' | 'tel';
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onFocus: () => void;
  disabled?: boolean;
  maxLength?: number;
  autoComplete?: string;
  required?: boolean;
  isFocused: boolean;
  validation: ValidationState;
  externalError?: string;
  fieldColors: FieldColors;
  primaryTextColor: string;
}

export const PersonalDataField: React.FC<PersonalDataFieldProps> = ({
  name,
  type,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  maxLength,
  autoComplete,
  required = true,
  isFocused,
  validation,
  externalError,
  fieldColors,
  primaryTextColor,
}) => {
  // Determina a cor da borda baseado no estado
  const getBorderColor = (): string => {
    if (isFocused) return fieldColors.focusBorderColor;
    if (externalError || (validation.isTouched && validation.error)) return '#ef4444';
    if (validation.isTouched && validation.isValid) return '#10b981';
    return fieldColors.borderColor;
  };

  // Ícone de validação
  const getValidationIcon = () => {
    if (externalError || (validation.isTouched && validation.error)) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    if (validation.isTouched && validation.isValid) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return null;
  };

  // Mensagem de erro
  const errorMessage = externalError || (validation.isTouched ? validation.error : null);

  const inputStyle: React.CSSProperties = {
    color: isFocused ? (fieldColors.focusTextColor || fieldColors.textColor) : fieldColors.textColor,
    backgroundColor: fieldColors.backgroundColor,
    borderColor: getBorderColor(),
    borderWidth: isFocused ? '2px' : '1px',
    boxShadow: isFocused ? `0 0 0 1px ${fieldColors.focusBorderColor}` : 'none',
    transition: 'all 0.2s ease',
    outline: 'none',
  };

  return (
    <div>
      <label 
        className="block text-sm font-medium mb-1" 
        style={{ color: primaryTextColor }}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={(e) => onChange(e.currentTarget.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          maxLength={maxLength}
          className="w-full px-4 py-3 pr-10 rounded-lg border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={inputStyle}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>
      {errorMessage && (
        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </p>
      )}
    </div>
  );
};
