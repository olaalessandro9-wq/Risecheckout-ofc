/**
 * InstallmentsField - Campo de Parcelamento
 * 
 * Componente compartilhado entre todos os gateways.
 * Exibe opções de parcelamento calculadas pelo gateway.
 */

import { memo } from 'react';
import { CreditCard } from 'lucide-react';
import type { Installment } from '@/types/payment-types';
import { INPUT_BASE_CLASS, INPUT_ERROR_CLASS, INPUT_DISABLED_CLASS, LABEL_CLASS, ERROR_MESSAGE_CLASS } from '../../core/constants';

interface InstallmentsFieldProps {
  installments: Installment[];
  value: number;
  error?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
  onBlur?: () => void;
}

export const InstallmentsField = memo<InstallmentsFieldProps>(({
  installments,
  value,
  error,
  disabled = false,
  onChange,
  onBlur
}) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(Number(e.target.value));
  };
  
  const selectClasses = [
    INPUT_BASE_CLASS,
    error ? INPUT_ERROR_CLASS : 'border-gray-300',
    disabled ? INPUT_DISABLED_CLASS : ''
  ].filter(Boolean).join(' ');
  
  const formatInstallmentLabel = (installment: Installment): string => {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    
    const installmentValue = formatter.format(installment.installmentAmount);
    
    return `${installment.installments}x de ${installmentValue}`;
  };
  
  return (
    <div className="space-y-1">
      <label htmlFor="installments" className={LABEL_CLASS}>
        Parcelamento
      </label>
      <div className="relative">
        <select
          id="installments"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled || installments.length === 0}
          className={selectClasses}
        >
          {installments.length === 0 ? (
            <option value="">Carregando parcelas...</option>
          ) : (
            installments.map((installment) => (
              <option key={installment.installments} value={installment.installments}>
                {formatInstallmentLabel(installment)}
              </option>
            ))
          )}
        </select>
        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className={ERROR_MESSAGE_CLASS} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

InstallmentsField.displayName = 'InstallmentsField';
