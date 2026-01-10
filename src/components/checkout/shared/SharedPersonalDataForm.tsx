/**
 * SharedPersonalDataForm
 * 
 * Componente compartilhado para formulário de dados pessoais
 * 
 * REFATORADO: Usa componente atômico PersonalDataField (< 200 linhas)
 */

import React, { useCallback } from 'react';
import { UserCircle } from 'lucide-react';
import { PersonalDataField } from './fields';
import { maskName, maskDocument, maskPhone, validateName, validateDocument, validatePhone, validateEmail, ERROR_MESSAGES } from '@/lib/validation';

interface SharedPersonalDataFormProps {
  design: {
    colors: {
      primaryText: string;
      formBackground: string;
      personalDataFields?: {
        textColor: string;
        placeholderColor: string;
        borderColor: string;
        backgroundColor: string;
        focusBorderColor: string;
        focusTextColor?: string;
      };
    };
  };
  mode?: 'editor' | 'preview' | 'public';
  formData?: { name?: string; email?: string; cpf?: string; phone?: string };
  formErrors?: { name?: string; email?: string; cpf?: string; phone?: string };
  requiredFields?: any;
  onFieldChange?: (field: string, value: string) => void;
  disabled?: boolean;
}

interface ValidationState { isValid: boolean; error: string | null; isTouched: boolean }

export const SharedPersonalDataForm: React.FC<SharedPersonalDataFormProps> = ({
  design, mode = 'public', formData = {}, formErrors = {}, requiredFields, onFieldChange, disabled = false,
}) => {
  const [focusedField, setFocusedField] = React.useState<string | null>(null);
  const [localValidation, setLocalValidation] = React.useState<Record<string, ValidationState>>({
    name: { isValid: false, error: null, isTouched: false },
    email: { isValid: false, error: null, isTouched: false },
    cpf: { isValid: false, error: null, isTouched: false },
    phone: { isValid: false, error: null, isTouched: false },
  });

  const fieldColors = design.colors.personalDataFields || {
    textColor: '#000000', placeholderColor: '#9CA3AF', borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF', focusBorderColor: '#10B981', focusTextColor: '#000000',
  };

  const validateField = useCallback((field: string, value: string): ValidationState => {
    if (!value.trim()) return { isValid: false, error: ERROR_MESSAGES.required, isTouched: true };
    
    const validators: Record<string, () => boolean> = {
      name: () => validateName(value),
      email: () => validateEmail(value),
      cpf: () => validateDocument(value),
      phone: () => validatePhone(value),
    };
    
    const isValid = validators[field]?.() ?? true;
    const errors: Record<string, string> = { name: ERROR_MESSAGES.name, email: ERROR_MESSAGES.email, cpf: 'CPF/CNPJ inválido', phone: ERROR_MESSAGES.phone };
    
    return { isValid, error: isValid ? null : errors[field], isTouched: true };
  }, []);

  const handleChange = useCallback((field: string, rawValue: string) => {
    const masks: Record<string, (v: string) => string> = { name: maskName, cpf: maskDocument, phone: maskPhone };
    const maskedValue = masks[field]?.(rawValue) ?? rawValue;
    onFieldChange?.(field, maskedValue);
  }, [onFieldChange]);

  const handleBlur = useCallback((field: string, value: string) => {
    setLocalValidation(prev => ({ ...prev, [field]: validateField(field, value) }));
    setFocusedField(null);
  }, [validateField]);

  const shouldShowField = (field: string): boolean => {
    if (field === 'name' || field === 'email') return true;
    if (!requiredFields) return false;
    if (Array.isArray(requiredFields)) return requiredFields.includes(field);
    return requiredFields[field] === true;
  };

  const getMaxLength = (field: string): number | undefined => {
    const lengths: Record<string, number> = { cpf: 18, phone: 15 };
    return lengths[field];
  };

  const fields = [
    { name: 'name', type: 'text' as const, label: 'Nome completo', placeholder: 'Digite seu nome completo', autoComplete: 'name', show: true },
    { name: 'email', type: 'email' as const, label: 'Email', placeholder: 'Digite seu email', autoComplete: 'email', show: true },
    { name: 'cpf', type: 'text' as const, label: 'CPF/CNPJ', placeholder: '000.000.000-00 ou 00.000.000/0000-00', autoComplete: 'off', show: shouldShowField('cpf') },
    { name: 'phone', type: 'tel' as const, label: 'Celular', placeholder: '(00) 00000-0000', autoComplete: 'tel', show: shouldShowField('phone') },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <UserCircle className="w-6 h-6" style={{ color: design.colors.primaryText }} />
        <h2 className="text-lg font-semibold" style={{ color: design.colors.primaryText }}>Dados pessoais</h2>
      </div>

      <div className="space-y-4 mb-6">
        {fields.filter(f => f.show).map(field => (
          <PersonalDataField
            key={field.name}
            name={field.name}
            type={field.type}
            label={field.label}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            maxLength={getMaxLength(field.name)}
            value={formData[field.name as keyof typeof formData] || ''}
            onChange={(value) => handleChange(field.name, value)}
            onBlur={() => handleBlur(field.name, formData[field.name as keyof typeof formData] || '')}
            onFocus={() => setFocusedField(field.name)}
            disabled={disabled}
            isFocused={focusedField === field.name}
            validation={localValidation[field.name]}
            externalError={formErrors[field.name as keyof typeof formErrors]}
            fieldColors={fieldColors}
            primaryTextColor={design.colors.primaryText}
          />
        ))}
      </div>
    </div>
  );
};
