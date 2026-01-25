/**
 * ProductFormMachine Guards
 * 
 * Funções de guarda que determinam se transições podem ocorrer.
 * Usadas para validação condicional de transições.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solução 10.0/10
 * @module products/machines
 */

import type { ProductFormContext, GeneralFormData, UpsellSettings, AffiliateSettings } from "./productFormMachine.types";

// ============================================================================
// DIRTY DETECTION HELPERS
// ============================================================================

function isGeneralDirty(server: GeneralFormData, edited: GeneralFormData): boolean {
  return (
    server.name !== edited.name ||
    server.description !== edited.description ||
    server.price !== edited.price ||
    server.support_name !== edited.support_name ||
    server.support_email !== edited.support_email ||
    server.delivery_url !== edited.delivery_url ||
    server.delivery_type !== edited.delivery_type
  );
}

function isImageDirty(context: ProductFormContext): boolean {
  return context.editedData.image.imageFile !== null || context.editedData.image.pendingRemoval;
}

function isOffersDirty(context: ProductFormContext): boolean {
  return context.editedData.offers.modified || context.editedData.offers.deletedOfferIds.length > 0;
}

function isUpsellDirty(server: UpsellSettings, edited: UpsellSettings): boolean {
  return (
    server.hasCustomThankYouPage !== edited.hasCustomThankYouPage ||
    server.customPageUrl !== edited.customPageUrl ||
    server.redirectIgnoringOrderBumpFailures !== edited.redirectIgnoringOrderBumpFailures
  );
}

function isAffiliateDirty(server: AffiliateSettings | null, edited: AffiliateSettings | null): boolean {
  if (server === null && edited === null) return false;
  if (server === null || edited === null) return true;
  
  return (
    server.enabled !== edited.enabled ||
    server.defaultRate !== edited.defaultRate ||
    server.requireApproval !== edited.requireApproval ||
    server.attributionModel !== edited.attributionModel ||
    server.cookieDuration !== edited.cookieDuration ||
    server.showInMarketplace !== edited.showInMarketplace ||
    server.marketplaceDescription !== edited.marketplaceDescription ||
    server.marketplaceCategory !== edited.marketplaceCategory ||
    server.supportEmail !== edited.supportEmail ||
    server.publicDescription !== edited.publicDescription ||
    server.commissionOnOrderBump !== edited.commissionOnOrderBump ||
    server.commissionOnUpsell !== edited.commissionOnUpsell
  );
}

function isCheckoutSettingsDirty(context: ProductFormContext): boolean {
  if (!context.isCheckoutSettingsInitialized) return false;
  
  const server = context.serverData.checkoutSettings;
  const edited = context.editedData.checkoutSettings;
  
  return (
    server.pix_gateway !== edited.pix_gateway ||
    server.credit_card_gateway !== edited.credit_card_gateway ||
    server.default_payment_method !== edited.default_payment_method ||
    server.required_fields.name !== edited.required_fields.name ||
    server.required_fields.email !== edited.required_fields.email ||
    server.required_fields.phone !== edited.required_fields.phone ||
    server.required_fields.cpf !== edited.required_fields.cpf
  );
}

// ============================================================================
// MAIN GUARDS
// ============================================================================

/**
 * Verifica se há mudanças não salvas (qualquer seção dirty)
 */
export function isDirty({ context }: { context: ProductFormContext }): boolean {
  return (
    isGeneralDirty(context.serverData.general, context.editedData.general) ||
    isImageDirty(context) ||
    isOffersDirty(context) ||
    isUpsellDirty(context.serverData.upsell, context.editedData.upsell) ||
    isAffiliateDirty(context.serverData.affiliateSettings, context.editedData.affiliate) ||
    isCheckoutSettingsDirty(context)
  );
}

/**
 * Calcula dirty flags granulares por seção
 */
export function calculateDirtyFlags(context: ProductFormContext) {
  return {
    general: isGeneralDirty(context.serverData.general, context.editedData.general),
    image: isImageDirty(context),
    offers: isOffersDirty(context),
    upsell: isUpsellDirty(context.serverData.upsell, context.editedData.upsell),
    affiliate: isAffiliateDirty(context.serverData.affiliateSettings, context.editedData.affiliate),
    checkoutSettings: isCheckoutSettingsDirty(context),
  };
}

/**
 * Verifica se o formulário está válido
 */
export function isValid({ context }: { context: ProductFormContext }): boolean {
  const { validationErrors } = context;
  
  // Verificar erros em cada seção
  const hasGeneralErrors = validationErrors.general ? Object.values(validationErrors.general).some(Boolean) : false;
  const hasUpsellErrors = validationErrors.upsell ? Object.values(validationErrors.upsell).some(Boolean) : false;
  const hasAffiliateErrors = validationErrors.affiliate ? Object.values(validationErrors.affiliate).some(Boolean) : false;
  const hasCheckoutErrors = validationErrors.checkoutSettings ? Object.values(validationErrors.checkoutSettings).some(Boolean) : false;
  
  return !hasGeneralErrors && !hasUpsellErrors && !hasAffiliateErrors && !hasCheckoutErrors;
}

/**
 * Verifica se pode salvar (dirty E válido)
 */
export function canSave({ context }: { context: ProductFormContext }): boolean {
  return isDirty({ context }) && isValid({ context });
}

/**
 * Verifica se o produto foi carregado
 */
export function hasProduct({ context }: { context: ProductFormContext }): boolean {
  return context.serverData.product !== null;
}

/**
 * Verifica se está em estado prístino (sem mudanças)
 */
export function isPristine({ context }: { context: ProductFormContext }): boolean {
  return !isDirty({ context });
}

/**
 * Verifica se checkout settings foram inicializadas
 */
export function isCheckoutSettingsInitialized({ context }: { context: ProductFormContext }): boolean {
  return context.isCheckoutSettingsInitialized;
}
