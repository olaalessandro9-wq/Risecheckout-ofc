/**
 * useCardValidation - Hook para validação de campos do formulário de cartão
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 */

import { useState, useCallback } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger("CardValidation");
export interface ValidationErrors {
  cardNumber?: string;
  expirationDate?: string;
  securityCode?: string;
  cardholderName?: string;
  identificationNumber?: string;
  submit?: string;
}

/**
 * Tipo para erros retornados pelo SDK do MercadoPago
 */
interface MercadoPagoErrorCause {
  field?: string;
  code?: string;
}

interface MercadoPagoError {
  cause?: MercadoPagoErrorCause | MercadoPagoErrorCause[];
  message?: string;
}

export interface CardValidationReturn {
  errors: ValidationErrors;
  hasAttemptedSubmit: boolean;
  setHasAttemptedSubmit: (value: boolean) => void;
  setErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
  clearError: (fieldName: string) => void;
  clearCardNumberError: () => void;
  clearExpirationDateError: () => void;
  clearSecurityCodeError: () => void;
  validateLocalFields: (name: string, cpf: string) => ValidationErrors;
  mapMPErrorsToFields: (error: MercadoPagoError) => ValidationErrors;
}

export function useCardValidation(): CardValidationReturn {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Limpar erro de campo específico
  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      if (!prev[fieldName as keyof ValidationErrors]) return prev;
      const updated = { ...prev };
      delete updated[fieldName as keyof ValidationErrors];
      return updated;
    });
  }, []);

  // Callbacks estáveis para limpar erros dos campos MP
  const clearCardNumberError = useCallback(() => clearError('cardNumber'), [clearError]);
  const clearExpirationDateError = useCallback(() => clearError('expirationDate'), [clearError]);
  const clearSecurityCodeError = useCallback(() => clearError('securityCode'), [clearError]);

  // Validar campos locais (Nome e CPF)
  const validateLocalFields = useCallback((name: string, cpf: string): ValidationErrors => {
    const localErrors: ValidationErrors = {};

    if (!name.trim()) {
      localErrors.cardholderName = 'Obrigatório';
    }

    if (!cpf.trim()) {
      localErrors.identificationNumber = 'Obrigatório';
    } else if (cpf.replace(/\D/g, '').length !== 11) {
      localErrors.identificationNumber = 'CPF inválido';
    }

    return localErrors;
  }, []);

  // Mapear erros do SDK MP para campos
  const mapMPErrorsToFields = useCallback((error: MercadoPagoError): ValidationErrors => {
    const mpErrors: ValidationErrors = {};

    if (error.cause) {
      const causes = Array.isArray(error.cause) ? error.cause : [error.cause];
      
      causes.forEach((c: MercadoPagoErrorCause) => {
        const field = c.field;
        const code = c.code;
        
        log.trace(`Erro - Field: ${field}, Code: ${code}`);

        if (field === 'cardNumber' || ["205", "E301"].includes(code)) {
          mpErrors.cardNumber = "Obrigatório";
        }
        
        if (field === 'expirationMonth' || field === 'expirationYear' || ["208", "209", "325", "326"].includes(code)) {
          mpErrors.expirationDate = "Obrigatório";
        }
        
        if (field === 'securityCode' || ["224", "E302"].includes(code)) {
          mpErrors.securityCode = "Obrigatório";
        }
        
        if (["221", "316"].includes(code)) mpErrors.cardholderName = "Nome inválido";
        if (["214", "324"].includes(code)) mpErrors.identificationNumber = "CPF inválido";
      });
    }

    // Fallback: Se o SDK não retornou erros específicos mas falhou
    if (Object.keys(mpErrors).length === 0 && error) {
      log.trace('Aplicando fallback de erros para campos vazios');
      mpErrors.cardNumber = "Obrigatório";
      mpErrors.expirationDate = "Obrigatório";
      mpErrors.securityCode = "Obrigatório";
    }

    return mpErrors;
  }, []);

  return {
    errors,
    hasAttemptedSubmit,
    setHasAttemptedSubmit,
    setErrors,
    clearError,
    clearCardNumberError,
    clearExpirationDateError,
    clearSecurityCodeError,
    validateLocalFields,
    mapMPErrorsToFields
  };
}
