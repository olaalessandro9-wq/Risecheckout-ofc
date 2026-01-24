/**
 * CPFField - Campo de CPF/CNPJ
 * 
 * Componente compartilhado entre todos os gateways.
 * Aplica máscara e validação de CPF/CNPJ.
 */

import { memo } from 'react';
import { Shield } from 'lucide-react';
import type { SharedFieldProps } from '@/types/payment-types';
import { INPUT_BASE_CLASS, INPUT_ERROR_CLASS, INPUT_DISABLED_CLASS, LABEL_CLASS, ERROR_MESSAGE_CLASS } from '../../core/constants';

interface CPFFieldProps extends SharedFieldProps {
  placeholder?: string;
}

export const CPFField = memo<CPFFieldProps>(({
  value,
  error,
  disabled = false,
  onChange,
  onBlur,
  placeholder = '000.000.000-00 ou 00.000.000/0000-00'
}) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não é número
    let cleanValue = e.target.value.replace(/\D/g, '');
    
    // Limita a 14 dígitos (CNPJ)
    if (cleanValue.length > 14) {
      cleanValue = cleanValue.slice(0, 14);
    }
    
    // Aplica máscara
    let maskedValue = '';
    if (cleanValue.length <= 11) {
      // CPF: 000.000.000-00
      maskedValue = cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0000-00
      maskedValue = cleanValue
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    onChange(maskedValue);
  };
  
  const inputClasses = [
    INPUT_BASE_CLASS,
    error ? INPUT_ERROR_CLASS : 'border-[hsl(var(--checkout-input-border))]',
    disabled ? INPUT_DISABLED_CLASS : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div className="space-y-1">
      <label htmlFor="card-holder-document" className={LABEL_CLASS}>
        CPF/CNPJ do Titular
      </label>
      <div className="relative">
        <input
          id="card-holder-document"
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          maxLength={18}
        />
        <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className={ERROR_MESSAGE_CLASS} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

CPFField.displayName = 'CPFField';
