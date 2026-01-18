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

// NOTA: createSaveAll foi movido para ./createSaveAll.ts para suportar
// o novo sistema de validação global via Save Registry Pattern.
