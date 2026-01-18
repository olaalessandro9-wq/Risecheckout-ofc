/**
 * validationHandlerConfigs - Funções de Configuração de Validação
 * 
 * Extraído de useGlobalValidationHandlers para manter o arquivo < 300 linhas.
 * Contém as funções de criação de validação para cada seção.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Arquitetura Modular
 */

import type { GeneralFormData, CheckoutSettingsFormData } from "../../types/productForm.types";
import type { UpsellSettings, AffiliateSettings } from "../../types/product.types";
import { 
  validateGeneralForm, 
  validateUpsellSettings, 
  validateAffiliateSettings 
} from "../productFormValidation";
import { getGatewayById, isGatewayAvailable } from "@/config/payment-gateways";

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  tabKey: string;
}

// ============================================================================
// VALIDATION FACTORIES
// ============================================================================

/**
 * Cria função de validação para a aba Geral
 */
export function createGeneralValidation(
  formRef: React.RefObject<GeneralFormData>
): () => ValidationResult {
  return () => {
    const currentForm = formRef.current;
    const result = validateGeneralForm(currentForm);
    const fieldErrors: Record<string, string> = {};
    
    if (result.errors.general) {
      Object.entries(result.errors.general).forEach(([field, error]) => {
        if (error) fieldErrors[field] = error;
      });
    }
    
    return {
      isValid: result.isValid,
      errors: fieldErrors,
      tabKey: 'geral',
    };
  };
}

/**
 * Cria função de validação para a aba Configurações (Checkout Settings)
 */
export function createCheckoutSettingsValidation(
  formRef: React.RefObject<CheckoutSettingsFormData>
): () => ValidationResult {
  return () => {
    const form = formRef.current;
    const pixGateway = getGatewayById(form.pix_gateway);
    const ccGateway = getGatewayById(form.credit_card_gateway);
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!isGatewayAvailable(form.pix_gateway)) {
      errors.pix_gateway = `Gateway de PIX "${pixGateway?.displayName || form.pix_gateway}" não está disponível`;
      isValid = false;
    }
    if (!isGatewayAvailable(form.credit_card_gateway)) {
      errors.credit_card_gateway = `Gateway de Cartão "${ccGateway?.displayName || form.credit_card_gateway}" não está disponível`;
      isValid = false;
    }

    return {
      isValid,
      errors,
      tabKey: 'configuracoes',
    };
  };
}

/**
 * Cria função de validação para a aba Upsell
 */
export function createUpsellValidation(
  settingsRef: React.RefObject<UpsellSettings>
): () => ValidationResult {
  return () => {
    const result = validateUpsellSettings(settingsRef.current);
    const fieldErrors: Record<string, string> = {};
    
    if (result.errors.upsell) {
      Object.entries(result.errors.upsell).forEach(([field, error]) => {
        if (error) fieldErrors[field] = error;
      });
    }
    
    return {
      isValid: result.isValid,
      errors: fieldErrors,
      tabKey: 'upsell',
    };
  };
}

/**
 * Cria função de validação para a aba Afiliados
 */
export function createAffiliateValidation(
  settingsRef: React.RefObject<AffiliateSettings | null>
): () => ValidationResult {
  return () => {
    const result = validateAffiliateSettings(settingsRef.current);
    const fieldErrors: Record<string, string> = {};
    
    if (result.errors.affiliate) {
      Object.entries(result.errors.affiliate).forEach(([field, error]) => {
        if (error) fieldErrors[field] = error;
      });
    }
    
    return {
      isValid: result.isValid,
      errors: fieldErrors,
      tabKey: 'afiliados',
    };
  };
}
