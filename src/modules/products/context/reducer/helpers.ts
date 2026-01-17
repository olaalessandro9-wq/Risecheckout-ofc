/**
 * Reducer Helpers - Funções auxiliares para o ProductFormReducer
 * 
 * Contém funções de normalização, comparação e cálculo de dirty flags.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type {
  ProductFormState,
  EditedFormData,
  ServerDataSnapshot,
  GeneralFormData,
  ImageFormState,
  OffersFormState,
  CheckoutSettingsFormData,
} from "../../types/productForm.types";
import type { ProductData, UpsellSettings, AffiliateSettings } from "../../types/product.types";

import { INITIAL_GENERAL_FORM } from "./initialState";

// ============================================================================
// NORMALIZATION HELPERS
// ============================================================================

/**
 * Normaliza string para comparação (null/undefined → "")
 */
export function normalizeString(value: string | null | undefined): string {
  return value ?? "";
}

/**
 * Normaliza boolean para comparação (null/undefined → false)
 */
export function normalizeBoolean(value: boolean | null | undefined): boolean {
  return value ?? false;
}

// ============================================================================
// DERIVATION HELPERS
// ============================================================================

/**
 * Deriva GeneralFormData de ProductData
 */
export function deriveGeneralFromProduct(product: ProductData | null): GeneralFormData {
  if (!product) return INITIAL_GENERAL_FORM;
  
  return {
    name: product.name,
    description: normalizeString(product.description),
    price: product.price,
    support_name: normalizeString(product.support_name),
    support_email: normalizeString(product.support_email),
    delivery_url: normalizeString(product.delivery_url),
    external_delivery: normalizeBoolean(product.external_delivery),
  };
}

// ============================================================================
// DIRTY FLAG COMPARISON HELPERS
// ============================================================================

/**
 * Compara GeneralFormData com serverData.general para detectar mudanças
 */
export function isGeneralDirty(form: GeneralFormData, serverGeneral: GeneralFormData): boolean {
  return (
    form.name !== serverGeneral.name ||
    form.description !== serverGeneral.description ||
    form.price !== serverGeneral.price ||
    form.support_name !== serverGeneral.support_name ||
    form.support_email !== serverGeneral.support_email ||
    form.delivery_url !== serverGeneral.delivery_url ||
    form.external_delivery !== serverGeneral.external_delivery
  );
}

/**
 * Compara ImageFormState para detectar mudanças
 */
export function isImageDirty(image: ImageFormState): boolean {
  return image.imageFile !== null || image.pendingRemoval;
}

/**
 * Compara OffersFormState para detectar mudanças
 */
export function isOffersDirty(offers: OffersFormState): boolean {
  return offers.modified || offers.deletedOfferIds.length > 0;
}

/**
 * Compara UpsellSettings para detectar mudanças
 */
export function isUpsellDirty(edited: UpsellSettings, server: UpsellSettings): boolean {
  return (
    edited.hasCustomThankYouPage !== server.hasCustomThankYouPage ||
    edited.customPageUrl !== server.customPageUrl ||
    edited.redirectIgnoringOrderBumpFailures !== server.redirectIgnoringOrderBumpFailures
  );
}

/**
 * Compara AffiliateSettings para detectar mudanças
 */
export function isAffiliateDirty(edited: AffiliateSettings | null, server: AffiliateSettings | null): boolean {
  if (edited === null && server === null) return false;
  if (edited === null || server === null) return true;
  
  return JSON.stringify(edited) !== JSON.stringify(server);
}

/**
 * Compara CheckoutSettingsFormData para detectar mudanças
 */
export function isCheckoutSettingsDirty(edited: CheckoutSettingsFormData, server: CheckoutSettingsFormData): boolean {
  return JSON.stringify(edited) !== JSON.stringify(server);
}

// ============================================================================
// DIRTY FLAGS CALCULATOR
// ============================================================================

/**
 * Calcula todos os dirty flags
 */
export function calculateDirtyFlags(
  editedData: EditedFormData,
  serverData: ServerDataSnapshot
): ProductFormState["dirtyFlags"] {
  return {
    general: isGeneralDirty(editedData.general, serverData.general),
    image: isImageDirty(editedData.image),
    offers: isOffersDirty(editedData.offers),
    upsell: isUpsellDirty(editedData.upsell, serverData.upsell),
    affiliate: isAffiliateDirty(editedData.affiliate, serverData.affiliateSettings),
    checkoutSettings: isCheckoutSettingsDirty(editedData.checkoutSettings, serverData.checkoutSettings),
  };
}

/**
 * Verifica se algum flag está dirty
 */
export function anyDirty(flags: ProductFormState["dirtyFlags"]): boolean {
  return flags.general || flags.image || flags.offers || flags.upsell || flags.affiliate || flags.checkoutSettings;
}
