/**
 * Save Wrappers - Funções de salvamento com estado
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import { toast } from "sonner";
import type { ProductFormState, ProductFormDispatch, GeneralFormData } from "../../types/productForm.types";
import type { UpsellSettings, AffiliateSettings } from "../../types/product.types";
import { formActions } from "../reducer";
import { validateGeneralForm } from "../productFormValidation";

// ============================================================================
// TYPES
// ============================================================================

interface SaveDependencies {
  setSaving: (saving: boolean) => void;
  formDispatch: ProductFormDispatch;
  formState: ProductFormState;
  core: {
    product: unknown;
    saveProduct: () => Promise<void>;
  };
  settings: {
    savePaymentSettings: () => Promise<void>;
    saveCheckoutFields: () => Promise<void>;
    saveUpsellSettings: (settings?: UpsellSettings) => Promise<void>;
    saveAffiliateSettings: (settings?: AffiliateSettings) => Promise<void>;
  };
}

// ============================================================================
// SAVE WRAPPERS
// ============================================================================

export function createSaveProduct(deps: Pick<SaveDependencies, 'setSaving' | 'formDispatch' | 'core'>) {
  return async () => {
    deps.setSaving(true);
    try {
      await deps.core.saveProduct();
      deps.formDispatch(formActions.markSaved({ 
        newServerData: { product: deps.core.product as never } 
      }));
    } finally {
      deps.setSaving(false);
    }
  };
}

export function createSaveUpsellSettings(
  deps: Pick<SaveDependencies, 'setSaving' | 'settings'>
) {
  return async (settingsToSave?: UpsellSettings) => {
    deps.setSaving(true);
    try {
      await deps.settings.saveUpsellSettings(settingsToSave);
    } finally {
      deps.setSaving(false);
    }
  };
}

export function createSaveAffiliateSettings(
  deps: Pick<SaveDependencies, 'setSaving' | 'settings'>
) {
  return async (settingsToSave?: AffiliateSettings) => {
    deps.setSaving(true);
    try {
      await deps.settings.saveAffiliateSettings(settingsToSave);
    } finally {
      deps.setSaving(false);
    }
  };
}

export function createSaveAll(deps: SaveDependencies) {
  return async () => {
    deps.setSaving(true);
    try {
      const generalValidation = validateGeneralForm(deps.formState.editedData.general);
      if (!generalValidation.isValid) {
        toast.error("Corrija os erros antes de salvar");
        return;
      }

      await Promise.all([
        deps.core.saveProduct(),
        deps.settings.savePaymentSettings(),
        deps.settings.saveCheckoutFields(),
        deps.settings.saveUpsellSettings(),
        deps.settings.saveAffiliateSettings(),
      ]);
      
      toast.success("Todas as alterações foram salvas");
      deps.formDispatch(formActions.markSaved());
    } catch (error: unknown) {
      console.error("[ProductContext] Error saving all:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      deps.setSaving(false);
    }
  };
}
