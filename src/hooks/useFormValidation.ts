import { useState, useCallback } from 'react';
import {
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskDocument,
  maskName,
  validateCPF,
  validateCNPJ,
  validatePhone,
  validateEmail,
  validateName,
  validatePassword,
  validateDocument,
  unmask,
  ERROR_MESSAGES,
} from '@/lib/validation';

export type FieldType = 'cpf' | 'cnpj' | 'document' | 'phone' | 'email' | 'name' | 'password' | 'text';

interface FieldState {
  value: string;
  error: string | null;
  isValid: boolean;
  isTouched: boolean;
}

interface UseFormValidationReturn {
  value: string;
  error: string | null;
  isValid: boolean;
  isTouched: boolean;
  maxLength: number | undefined; // Limite de caracteres para o input
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  reset: () => void;
  setValue: (value: string) => void;
  validate: () => boolean;
  getRawValue: () => string; // Retorna valor sem máscara
}

/**
 * Hook customizado para validação de campos de formulário
 * 
 * @param type - Tipo do campo (cpf, cnpj, phone, email, etc.)
 * @param required - Se o campo é obrigatório
 * @param initialValue - Valor inicial do campo
 * 
 * @example
 * const cpfField = useFormValidation('cpf', true);
 * <input
 *   value={cpfField.value}
 *   onChange={cpfField.onChange}
 *   onBlur={cpfField.onBlur}
 *   className={cpfField.error ? 'border-red-500' : 'border-green-500'}
 * />
 * {cpfField.error && <p className="text-red-500">{cpfField.error}</p>}
 */
export function useFormValidation(
  type: FieldType,
  required: boolean = true,
  initialValue: string = ''
): UseFormValidationReturn {
  const [state, setState] = useState<FieldState>({
    value: initialValue,
    error: null,
    isValid: !required || initialValue.length > 0,
    isTouched: false,
  });

  // Aplica máscara baseado no tipo
  const applyMask = useCallback((value: string): string => {
    switch (type) {
      case 'cpf':
        return maskCPF(value);
      case 'cnpj':
        return maskCNPJ(value);
      case 'document':
        return maskDocument(value);
      case 'phone':
        return maskPhone(value);
      case 'name':
        return maskName(value);
      default:
        return value;
    }
  }, [type]);

  // Valida o campo
  const validateField = useCallback((value: string): { isValid: boolean; error: string | null } => {
    // Campo obrigatório vazio
    if (required && !value.trim()) {
      return { isValid: false, error: ERROR_MESSAGES.required };
    }

    // Campo opcional vazio
    if (!required && !value.trim()) {
      return { isValid: true, error: null };
    }

    // Validação específica por tipo
    switch (type) {
      case 'cpf':
        const cpfValid = validateCPF(value);
        return { isValid: cpfValid, error: cpfValid ? null : ERROR_MESSAGES.cpf };
      
      case 'cnpj':
        const cnpjValid = validateCNPJ(value);
        return { isValid: cnpjValid, error: cnpjValid ? null : ERROR_MESSAGES.cnpj };
      
      case 'document':
        const docValid = validateDocument(value);
        const docType = unmask(value).length <= 11 ? 'cpf' : 'cnpj';
        return { isValid: docValid, error: docValid ? null : ERROR_MESSAGES[docType] };
      
      case 'phone':
        const phoneValid = validatePhone(value);
        return { isValid: phoneValid, error: phoneValid ? null : ERROR_MESSAGES.phone };
      
      case 'email':
        const emailValid = validateEmail(value);
        return { isValid: emailValid, error: emailValid ? null : ERROR_MESSAGES.email };
      
      case 'name':
        const nameValid = validateName(value);
        return { isValid: nameValid, error: nameValid ? null : ERROR_MESSAGES.name };
      
      case 'password':
        const passwordValid = validatePassword(value);
        return { isValid: passwordValid, error: passwordValid ? null : ERROR_MESSAGES.password };
      
      default:
        return { isValid: true, error: null };
    }
  }, [type, required]);

  // Handler de mudança
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const maskedValue = applyMask(rawValue);
    
    setState(prev => ({
      ...prev,
      value: maskedValue,
    }));
  }, [applyMask]);

  // Handler de blur (quando sai do campo)
  const onBlur = useCallback(() => {
    const { isValid, error } = validateField(state.value);
    
    setState(prev => ({
      ...prev,
      isTouched: true,
      isValid,
      error,
    }));
  }, [state.value, validateField]);

  // Valida manualmente (útil no submit)
  const validate = useCallback((): boolean => {
    const { isValid, error } = validateField(state.value);
    
    setState(prev => ({
      ...prev,
      isTouched: true,
      isValid,
      error,
    }));
    
    return isValid;
  }, [state.value, validateField]);

  // Reseta o campo
  const reset = useCallback(() => {
    setState({
      value: '',
      error: null,
      isValid: !required,
      isTouched: false,
    });
  }, [required]);

  // Define valor programaticamente
  const setValue = useCallback((value: string) => {
    const maskedValue = applyMask(value);
    const { isValid, error } = validateField(maskedValue);
    
    setState({
      value: maskedValue,
      error,
      isValid,
      isTouched: true,
    });
  }, [applyMask, validateField]);

  // Retorna valor sem máscara (para enviar ao backend)
  const getRawValue = useCallback((): string => {
    return unmask(state.value);
  }, [state.value]);

  // Calcula maxLength baseado no tipo de campo (com máscara)
  const getMaxLength = (): number | undefined => {
    switch (type) {
      case 'cpf':
        return 14; // 000.000.000-00 (11 dígitos + 3 pontos + 1 traço)
      case 'cnpj':
        return 18; // 00.000.000/0000-00 (14 dígitos + 2 pontos + 1 barra + 1 traço)
      case 'document':
        return 18; // Máximo (CNPJ)
      case 'phone':
        return 15; // (00) 00000-0000 (11 dígitos + 2 parênteses + 1 espaço + 1 traço)
      default:
        return undefined;
    }
  };

  return {
    value: state.value,
    error: state.error,
    isValid: state.isValid,
    isTouched: state.isTouched,
    maxLength: getMaxLength(),
    onChange,
    onBlur,
    reset,
    setValue,
    validate,
    getRawValue,
  };
}
