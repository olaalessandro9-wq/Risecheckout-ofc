/**
 * CardHolderNameField - Campo de Nome do Titular
 * 
 * Componente compartilhado entre todos os gateways.
 * Valida e formata o nome do titular do cartão.
 */

import { memo } from 'react';
import { User } from 'lucide-react';
import type { SharedFieldProps } from '@/types/payment-types';
import { INPUT_BASE_CLASS, INPUT_ERROR_CLASS, INPUT_DISABLED_CLASS, LABEL_CLASS, ERROR_MESSAGE_CLASS } from '../../core/constants';

interface CardHolderNameFieldProps extends SharedFieldProps {
  placeholder?: string;
}

export const CardHolderNameField = memo<CardHolderNameFieldProps>(({
  value,
  error,
  disabled = false,
  onChange,
  onBlur,
  placeholder = 'Como impresso no cartão'
}) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove números e caracteres especiais (exceto acentos e espaços)
    const cleanValue = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    onChange(cleanValue);
  };
  
  const inputClasses = [
    INPUT_BASE_CLASS,
    error ? INPUT_ERROR_CLASS : 'border-gray-300',
    disabled ? INPUT_DISABLED_CLASS : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div className="space-y-1">
      <label htmlFor="card-holder-name" className={LABEL_CLASS}>
        Nome do Titular
      </label>
      <div className="relative">
        <input
          id="card-holder-name"
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          autoComplete="cc-name"
          maxLength={50}
        />
        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className={ERROR_MESSAGE_CLASS} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

CardHolderNameField.displayName = 'CardHolderNameField';
