/**
 * Personal Data Validators
 * 
 * Single Source of Truth para validação de dados pessoais.
 * Usa as funções de validação existentes em @/lib/validation.
 * 
 * Segue RISE ARCHITECT PROTOCOL: 
 * - Responsabilidade única (validação)
 * - Sem side-effects (retorna resultado, não exibe toasts)
 */

import {
  validateName,
  validateEmail,
  validateDocument,
  validatePhone,
  ERROR_MESSAGES,
} from '@/lib/validation';
import type { 
  PersonalData, 
  PersonalDataErrors, 
  PersonalDataField,
  ValidationResult,
  RequiredFieldsConfig,
} from '../types';

// ============================================================================
// SINGLE FIELD VALIDATION
// ============================================================================

/**
 * Valida um campo individual.
 * 
 * @param field - Nome do campo
 * @param value - Valor do campo
 * @returns Objeto com isValid e error (null se válido)
 */
export function validateField(
  field: PersonalDataField, 
  value: string
): { isValid: boolean; error: string | null } {
  const trimmedValue = (value || '').trim();

  // Campo vazio
  if (!trimmedValue) {
    return { isValid: false, error: ERROR_MESSAGES.required };
  }

  switch (field) {
    case 'name':
      const nameValid = validateName(trimmedValue);
      return { 
        isValid: nameValid, 
        error: nameValid ? null : ERROR_MESSAGES.name 
      };

    case 'email':
      const emailValid = validateEmail(trimmedValue);
      return { 
        isValid: emailValid, 
        error: emailValid ? null : ERROR_MESSAGES.email 
      };

    case 'cpf':
      const cpfValid = validateDocument(trimmedValue);
      return { 
        isValid: cpfValid, 
        error: cpfValid ? null : 'CPF/CNPJ inválido' 
      };

    case 'phone':
      const phoneValid = validatePhone(trimmedValue);
      return { 
        isValid: phoneValid, 
        error: phoneValid ? null : ERROR_MESSAGES.phone 
      };

    default:
      return { isValid: true, error: null };
  }
}

// ============================================================================
// FULL FORM VALIDATION
// ============================================================================

/**
 * Valida todos os campos de dados pessoais.
 * 
 * @param data - Dados pessoais
 * @param requiredFields - Configuração de campos obrigatórios
 * @returns ValidationResult com isValid e errors
 */
export function validatePersonalData(
  data: PersonalData,
  requiredFields: RequiredFieldsConfig
): ValidationResult {
  const errors: PersonalDataErrors = {};

  // Nome (sempre obrigatório)
  const nameResult = validateField('name', data.name);
  if (!nameResult.isValid) {
    errors.name = nameResult.error || ERROR_MESSAGES.required;
  }

  // Email (sempre obrigatório)
  const emailResult = validateField('email', data.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.error || ERROR_MESSAGES.required;
  }

  // CPF (obrigatório se configurado)
  if (requiredFields.cpf) {
    const cpfResult = validateField('cpf', data.cpf);
    if (!cpfResult.isValid) {
      errors.cpf = cpfResult.error || ERROR_MESSAGES.required;
    }
  }

  // Phone (obrigatório se configurado)
  if (requiredFields.phone) {
    const phoneResult = validateField('phone', data.phone);
    if (!phoneResult.isValid) {
      errors.phone = phoneResult.error || ERROR_MESSAGES.required;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida campos obrigatórios, retornando apenas erros de "campo obrigatório".
 * Útil para validação inicial antes do submit.
 */
export function validateRequiredFields(
  data: PersonalData,
  requiredFields: RequiredFieldsConfig
): PersonalDataErrors {
  const errors: PersonalDataErrors = {};

  // Nome (sempre obrigatório)
  if (!data.name?.trim()) {
    errors.name = ERROR_MESSAGES.required;
  }

  // Email (sempre obrigatório)
  if (!data.email?.trim()) {
    errors.email = ERROR_MESSAGES.required;
  }

  // CPF (obrigatório se configurado)
  if (requiredFields.cpf && !data.cpf?.trim()) {
    errors.cpf = ERROR_MESSAGES.required;
  }

  // Phone (obrigatório se configurado)
  if (requiredFields.phone && !data.phone?.trim()) {
    errors.phone = ERROR_MESSAGES.required;
  }

  return errors;
}
