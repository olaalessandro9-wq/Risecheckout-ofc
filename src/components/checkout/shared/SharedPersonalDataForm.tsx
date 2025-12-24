/**
 * SharedPersonalDataForm
 * 
 * Componente compartilhado para formulário de dados pessoais
 * Usado por: Builder, Preview e Checkout Público
 * 
 * Garante consistência visual entre todos os modos
 * 
 * ✅ NOVO: Validações matemáticas + Máscaras + Feedback visual
 */

import React, { useEffect, useCallback } from 'react';
import { UserCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  maskName,
  maskDocument,
  maskPhone,
  validateName,
  validateDocument,
  validatePhone,
  validateEmail,
  ERROR_MESSAGES,
} from '@/lib/validation';

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
  formData?: {
    name?: string;
    email?: string;
    cpf?: string;
    phone?: string;
  };
  formErrors?: {
    name?: string;
    email?: string;
    cpf?: string;
    phone?: string;
  };
  requiredFields?: any; // Pode ser array ou objeto
  onFieldChange?: (field: string, value: string) => void;
  disabled?: boolean;
}

export const SharedPersonalDataForm: React.FC<SharedPersonalDataFormProps> = ({
  design,
  mode = 'public',
  formData = {},
  formErrors = {},
  requiredFields,
  onFieldChange,
  disabled = false,
}) => {
  // Estado para controlar qual campo está focado
  const [focusedField, setFocusedField] = React.useState<string | null>(null);
  
  // Estado para controlar validação local (feedback visual)
  const [localValidation, setLocalValidation] = React.useState<{
    name: { isValid: boolean; error: string | null; isTouched: boolean };
    email: { isValid: boolean; error: string | null; isTouched: boolean };
    cpf: { isValid: boolean; error: string | null; isTouched: boolean };
    phone: { isValid: boolean; error: string | null; isTouched: boolean };
  }>({
    name: { isValid: false, error: null, isTouched: false },
    email: { isValid: false, error: null, isTouched: false },
    cpf: { isValid: false, error: null, isTouched: false },
    phone: { isValid: false, error: null, isTouched: false },
  });

  const fieldColors = design.colors.personalDataFields || {
    textColor: '#000000',
    placeholderColor: '#9CA3AF',
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    focusBorderColor: '#10B981',
    focusTextColor: '#000000',
  };

  // Valida campo específico
  const validateField = useCallback((field: string, value: string): { isValid: boolean; error: string | null } => {
    if (!value.trim()) {
      return { isValid: false, error: ERROR_MESSAGES.required };
    }

    switch (field) {
      case 'name':
        const nameValid = validateName(value);
        return { isValid: nameValid, error: nameValid ? null : ERROR_MESSAGES.name };
      
      case 'email':
        const emailValid = validateEmail(value);
        return { isValid: emailValid, error: emailValid ? null : ERROR_MESSAGES.email };
      
      case 'cpf':
        const cpfValid = validateDocument(value);
        return { isValid: cpfValid, error: cpfValid ? null : 'CPF/CNPJ inválido' };
      
      case 'phone':
        const phoneValid = validatePhone(value);
        return { isValid: phoneValid, error: phoneValid ? null : ERROR_MESSAGES.phone };
      
      default:
        return { isValid: true, error: null };
    }
  }, []);

  // Handler de mudança com máscara
  const handleChange = useCallback((field: string, rawValue: string) => {
    let maskedValue = rawValue;
    
    // Aplica máscara baseado no campo
    switch (field) {
      case 'name':
        maskedValue = maskName(rawValue);
        break;
      case 'cpf':
        maskedValue = maskDocument(rawValue);
        break;
      case 'phone':
        maskedValue = maskPhone(rawValue);
        break;
      default:
        maskedValue = rawValue;
    }
    
    // Propaga mudança para o componente pai
    onFieldChange?.(field, maskedValue);
  }, [onFieldChange]);

  // Handler de blur (validação ao sair do campo)
  const handleBlur = useCallback((field: string, value: string) => {
    const validation = validateField(field, value);
    
    setLocalValidation(prev => ({
      ...prev,
      [field]: {
        ...validation,
        isTouched: true,
      },
    }));
    
    setFocusedField(null);
  }, [validateField]);

  // Helper para obter estilos do campo baseado no estado
  const getFieldStyle = (fieldName: string) => {
    const isFocused = focusedField === fieldName;
    const validation = localValidation[fieldName as keyof typeof localValidation];
    const hasExternalError = formErrors[fieldName as keyof typeof formErrors];
    
    // Determina a cor da borda
    let borderColor = fieldColors.borderColor;
    
    if (isFocused) {
      borderColor = fieldColors.focusBorderColor;
    } else if (hasExternalError || (validation.isTouched && validation.error)) {
      borderColor = '#ef4444'; // Vermelho
    } else if (validation.isTouched && validation.isValid) {
      borderColor = '#10b981'; // Verde
    }

    return {
      color: isFocused ? (fieldColors.focusTextColor || fieldColors.textColor) : fieldColors.textColor,
      backgroundColor: fieldColors.backgroundColor,
      borderColor,
      borderWidth: isFocused ? '2px' : '1px',
      boxShadow: isFocused ? `0 0 0 1px ${fieldColors.focusBorderColor}` : 'none',
      transition: 'all 0.2s ease',
    };
  };

  // Helper para obter ícone de validação
  const getValidationIcon = (fieldName: string) => {
    const validation = localValidation[fieldName as keyof typeof localValidation];
    const hasExternalError = formErrors[fieldName as keyof typeof formErrors];
    
    if (hasExternalError || (validation.isTouched && validation.error)) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    
    if (validation.isTouched && validation.isValid) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    
    return null;
  };

  // Helper para obter mensagem de erro
  const getErrorMessage = (fieldName: string): string | null => {
    const validation = localValidation[fieldName as keyof typeof localValidation];
    const externalError = formErrors[fieldName as keyof typeof formErrors];
    
    return externalError || (validation.isTouched ? validation.error : null);
  };

  // Helper para obter maxLength baseado no campo
  const getMaxLength = (fieldName: string): number | undefined => {
    switch (fieldName) {
      case 'cpf':
        return 18; // 00.000.000/0000-00 (CNPJ é o maior)
      case 'phone':
        return 15; // (00) 00000-0000
      default:
        return undefined;
    }
  };

  const inputClassName = "w-full px-4 py-3 pr-10 rounded-lg border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  // Helper para verificar se campo deve ser exibido
  const shouldShowField = (field: string): boolean => {
    if (field === 'name' || field === 'email') return true;
    if (!requiredFields) return false;
    if (Array.isArray(requiredFields)) return requiredFields.includes(field);
    return requiredFields[field] === true;
  };

  return (
    <div>
      {/* Título com Ícone */}
      <div className="flex items-center gap-2 mb-4">
        <UserCircle className="w-6 h-6" style={{ color: design.colors.primaryText }} />
        <h2 
          className="text-lg font-semibold"
          style={{ color: design.colors.primaryText }}
        >
          Dados pessoais
        </h2>
      </div>

      <div className="space-y-4 mb-6">
        {/* Nome Completo - Sempre visível */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: design.colors.primaryText }}>
            Nome completo <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Digite seu nome completo"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => handleBlur('name', formData.name || '')}
              disabled={disabled}
              className={inputClassName}
              style={{
                ...getFieldStyle('name'),
                outline: 'none',
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getValidationIcon('name')}
            </div>
          </div>
          {getErrorMessage('name') && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {getErrorMessage('name')}
            </p>
          )}
        </div>

        {/* Email - Sempre visível */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: design.colors.primaryText }}>
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="Digite seu email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => handleBlur('email', formData.email || '')}
              disabled={disabled}
              className={inputClassName}
              style={{
                ...getFieldStyle('email'),
                outline: 'none',
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getValidationIcon('email')}
            </div>
          </div>
          {getErrorMessage('email') && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {getErrorMessage('email')}
            </p>
          )}
        </div>

        {/* CPF/CNPJ - Só aparece se habilitado pelo produtor */}
        {shouldShowField('cpf') && (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: design.colors.primaryText }}>
              CPF/CNPJ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={formData.cpf || ''}
                onChange={(e) => handleChange('cpf', e.target.value)}
                onFocus={() => setFocusedField('cpf')}
                onBlur={() => handleBlur('cpf', formData.cpf || '')}
                disabled={disabled}
                maxLength={getMaxLength('cpf')}
                className={inputClassName}
                style={{
                  ...getFieldStyle('cpf'),
                  outline: 'none',
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getValidationIcon('cpf')}
              </div>
            </div>
            {getErrorMessage('cpf') && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {getErrorMessage('cpf')}
              </p>
            )}
          </div>
        )}

        {/* Celular - Só aparece se habilitado pelo produtor */}
        {shouldShowField('phone') && (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: design.colors.primaryText }}>
              Celular <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => handleBlur('phone', formData.phone || '')}
                disabled={disabled}
                maxLength={getMaxLength('phone')}
                className={inputClassName}
                style={{
                  ...getFieldStyle('phone'),
                  outline: 'none',
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getValidationIcon('phone')}
              </div>
            </div>
            {getErrorMessage('phone') && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {getErrorMessage('phone')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
