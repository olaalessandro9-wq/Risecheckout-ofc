/**
 * Personal Data Domain Types
 * 
 * Single Source of Truth para tipos de dados pessoais do checkout.
 * Segue RISE ARCHITECT PROTOCOL: tipos fortes, sem 'any'.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Dados pessoais do cliente.
 */
export interface PersonalData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}

/**
 * Erros de validação para cada campo.
 */
export interface PersonalDataErrors {
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
}

/**
 * Campos que são obrigatórios.
 * name e email são sempre obrigatórios.
 */
export interface RequiredFieldsConfig {
  name: true; // Sempre obrigatório
  email: true; // Sempre obrigatório
  cpf: boolean;
  phone: boolean;
}

/**
 * Estado de validação de um campo individual.
 */
export interface FieldValidationState {
  isValid: boolean;
  error: string | null;
  isTouched: boolean;
}

/**
 * Estado de validação completo do formulário.
 */
export interface FormValidationState {
  name: FieldValidationState;
  email: FieldValidationState;
  cpf: FieldValidationState;
  phone: FieldValidationState;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Campos de dados pessoais.
 */
export type PersonalDataField = keyof PersonalData;

/**
 * Resultado de validação.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: PersonalDataErrors;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Cria um objeto PersonalData vazio.
 */
export function createEmptyPersonalData(): PersonalData {
  return {
    name: '',
    email: '',
    cpf: '',
    phone: '',
  };
}

/**
 * Cria um objeto de erros vazio.
 */
export function createEmptyErrors(): PersonalDataErrors {
  return {};
}

/**
 * Cria estado de validação inicial.
 */
export function createInitialValidationState(): FormValidationState {
  return {
    name: { isValid: false, error: null, isTouched: false },
    email: { isValid: false, error: null, isTouched: false },
    cpf: { isValid: false, error: null, isTouched: false },
    phone: { isValid: false, error: null, isTouched: false },
  };
}

/**
 * Converte required_fields (any) para RequiredFieldsConfig tipado.
 */
export function parseRequiredFields(requiredFields: unknown): RequiredFieldsConfig {
  const config: RequiredFieldsConfig = {
    name: true,
    email: true,
    cpf: false,
    phone: false,
  };

  if (!requiredFields) return config;

  if (Array.isArray(requiredFields)) {
    config.cpf = requiredFields.includes('cpf');
    config.phone = requiredFields.includes('phone');
    return config;
  }

  if (typeof requiredFields === 'object') {
    const obj = requiredFields as Record<string, boolean>;
    config.cpf = obj.cpf === true;
    config.phone = obj.phone === true;
    return config;
  }

  return config;
}

/**
 * Converte RequiredFieldsConfig para array de strings.
 */
export function requiredFieldsToArray(config: RequiredFieldsConfig): string[] {
  const result: string[] = ['name', 'email'];
  if (config.cpf) result.push('cpf');
  if (config.phone) result.push('phone');
  return result;
}
