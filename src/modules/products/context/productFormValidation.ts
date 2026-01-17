/**
 * productFormValidation - Validação Centralizada de Formulários
 * 
 * Este arquivo contém todas as regras de validação para
 * o sistema de edição de produtos.
 * 
 * @see RISE ARCHITECT PROTOCOL - Solução C (Nota 9.8/10)
 */

import type {
  GeneralFormData,
  FormValidationErrors,
} from "../types/productForm.types";
import type { UpsellSettings, AffiliateSettings } from "../types/product.types";

// ============================================================================
// VALIDATION RESULT TYPE
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: Partial<FormValidationErrors>;
}

// ============================================================================
// GENERAL FORM VALIDATION
// ============================================================================

export function validateGeneralForm(data: GeneralFormData): ValidationResult {
  const errors: FormValidationErrors["general"] = {};
  let isValid = true;

  // Nome do produto
  if (!data.name.trim()) {
    errors.name = "Nome do produto é obrigatório";
    isValid = false;
  }

  // Descrição
  if (data.description.trim().length < 100) {
    errors.description = "A descrição deve ter no mínimo 100 caracteres";
    isValid = false;
  }

  // Preço
  if (!data.price || data.price <= 0) {
    errors.price = "Preço deve ser maior que zero";
    isValid = false;
  }

  // Nome de suporte
  if (!data.support_name.trim()) {
    errors.support_name = "Nome de exibição é obrigatório";
    isValid = false;
  }

  // E-mail de suporte
  if (!data.support_email.trim()) {
    errors.support_email = "E-mail de suporte é obrigatório";
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.support_email)) {
    errors.support_email = "E-mail inválido";
    isValid = false;
  }

  // Link de entrega (opcional, mas se preenchido deve ser https)
  if (data.delivery_url && !data.delivery_url.startsWith("https://")) {
    errors.delivery_url = "O link deve começar com https://";
    isValid = false;
  }

  return {
    isValid,
    errors: { general: errors },
  };
}

// ============================================================================
// UPSELL SETTINGS VALIDATION
// ============================================================================

export function validateUpsellSettings(data: UpsellSettings): ValidationResult {
  const errors: FormValidationErrors["upsell"] = {};
  let isValid = true;

  // Se página personalizada está ativa, URL é obrigatória
  if (data.hasCustomThankYouPage) {
    const url = data.customPageUrl.trim();

    if (!url) {
      errors.customPageUrl = "URL é obrigatória quando a página personalizada está ativa";
      isValid = false;
    } else {
      // Validar formato da URL
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          errors.customPageUrl = "URL inválida. Use o formato: https://exemplo.com/pagina";
          isValid = false;
        }
      } catch {
        errors.customPageUrl = "URL inválida. Use o formato: https://exemplo.com/pagina";
        isValid = false;
      }
    }
  }

  return {
    isValid,
    errors: { upsell: errors },
  };
}

// ============================================================================
// AFFILIATE SETTINGS VALIDATION
// ============================================================================

export function validateAffiliateSettings(data: AffiliateSettings | null): ValidationResult {
  const errors: FormValidationErrors["affiliate"] = {};
  let isValid = true;

  if (!data) {
    return { isValid: true, errors: {} };
  }

  // Comissão padrão (1-90%)
  if (data.defaultRate < 1 || data.defaultRate > 90) {
    errors.defaultRate = "A comissão deve estar entre 1% e 90%";
    isValid = false;
  }

  // Duração do cookie (1-365 dias)
  if (data.cookieDuration < 1 || data.cookieDuration > 365) {
    errors.cookieDuration = "A duração do cookie deve estar entre 1 e 365 dias";
    isValid = false;
  }

  // E-mail de suporte (opcional, mas se preenchido deve ser válido)
  if (data.supportEmail && data.supportEmail.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.supportEmail)) {
      errors.supportEmail = "E-mail inválido";
      isValid = false;
    }
  }

  // Validações de marketplace (se ativo)
  if (data.showInMarketplace) {
    if (!data.marketplaceDescription || data.marketplaceDescription.trim() === "") {
      errors.marketplaceDescription = "Descrição do marketplace é obrigatória";
      isValid = false;
    } else if (data.marketplaceDescription.length < 50) {
      errors.marketplaceDescription = "A descrição deve ter pelo menos 50 caracteres";
      isValid = false;
    } else if (data.marketplaceDescription.length > 500) {
      errors.marketplaceDescription = "A descrição deve ter no máximo 500 caracteres";
      isValid = false;
    }

    if (!data.marketplaceCategory) {
      errors.marketplaceCategory = "Categoria do marketplace é obrigatória";
      isValid = false;
    }
  }

  return {
    isValid,
    errors: { affiliate: errors },
  };
}

// ============================================================================
// FULL FORM VALIDATION
// ============================================================================

export function validateAllForms(
  general: GeneralFormData,
  upsell: UpsellSettings,
  affiliate: AffiliateSettings | null
): ValidationResult {
  const generalResult = validateGeneralForm(general);
  const upsellResult = validateUpsellSettings(upsell);
  const affiliateResult = validateAffiliateSettings(affiliate);

  const allErrors: Partial<FormValidationErrors> = {
    ...generalResult.errors,
    ...upsellResult.errors,
    ...affiliateResult.errors,
  };

  return {
    isValid: generalResult.isValid && upsellResult.isValid && affiliateResult.isValid,
    errors: allErrors,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Verifica se um objeto de erros tem algum erro definido
 */
export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some((error) => error !== undefined && error !== "");
}

/**
 * Conta o número de erros em um objeto de erros
 */
export function countErrors(errors: Record<string, string | undefined>): number {
  return Object.values(errors).filter((error) => error !== undefined && error !== "").length;
}
