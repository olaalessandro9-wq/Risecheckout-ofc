/**
 * Update Wrappers - Funções de atualização sincronizadas com reducer
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { ProductFormDispatch, GeneralFormData } from "../../types/productForm.types";
import type { ProductData, UpsellSettings, AffiliateSettings } from "../../types/product.types";
import { formActions } from "../reducer";

// ============================================================================
// TYPES
// ============================================================================

interface CoreHook {
  updateProduct: (field: keyof ProductData, value: ProductData[keyof ProductData]) => void;
  updateProductBulk: (data: Partial<ProductData>) => void;
}

interface SettingsHook {
  updateUpsellSettings: (updates: Partial<UpsellSettings>) => void;
  updateAffiliateSettings: (updates: Partial<AffiliateSettings>) => void;
}

// ============================================================================
// UPDATE WRAPPERS
// ============================================================================

const GENERAL_FIELDS: (keyof GeneralFormData)[] = [
  'name', 'description', 'price', 'support_name', 
  'support_email', 'delivery_url', 'external_delivery'
];

export function createUpdateProduct(core: CoreHook, formDispatch: ProductFormDispatch) {
  return (field: keyof ProductData, value: ProductData[keyof ProductData]) => {
    core.updateProduct(field, value);
    
    if (GENERAL_FIELDS.includes(field as keyof GeneralFormData)) {
      formDispatch(formActions.updateGeneral({ [field]: value } as Partial<GeneralFormData>));
    }
  };
}

export function createUpdateProductBulk(core: CoreHook, formDispatch: ProductFormDispatch) {
  return (data: Partial<ProductData>) => {
    core.updateProductBulk(data);
    
    const generalUpdate: Partial<GeneralFormData> = {};
    if ('name' in data) generalUpdate.name = data.name;
    if ('description' in data) generalUpdate.description = data.description ?? "";
    if ('price' in data) generalUpdate.price = data.price;
    if ('support_name' in data) generalUpdate.support_name = data.support_name ?? "";
    if ('support_email' in data) generalUpdate.support_email = data.support_email ?? "";
    if ('delivery_url' in data) generalUpdate.delivery_url = data.delivery_url ?? "";
    if ('external_delivery' in data) generalUpdate.external_delivery = data.external_delivery ?? false;
    
    if (Object.keys(generalUpdate).length > 0) {
      formDispatch(formActions.updateGeneral(generalUpdate));
    }
  };
}

export function createUpdateUpsellSettings(settings: SettingsHook, formDispatch: ProductFormDispatch) {
  return (updates: Partial<UpsellSettings>) => {
    settings.updateUpsellSettings(updates);
    formDispatch(formActions.updateUpsell(updates));
  };
}

export function createUpdateAffiliateSettings(settings: SettingsHook, formDispatch: ProductFormDispatch) {
  return (updates: Partial<AffiliateSettings>) => {
    settings.updateAffiliateSettings(updates);
    formDispatch(formActions.updateAffiliate(updates));
  };
}
