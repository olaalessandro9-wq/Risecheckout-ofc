/**
 * Checkout Actions - Ações para configurações de checkout
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { ProductFormState, CheckoutSettingsFormData, GatewayCredentials } from "../../../types/productForm.types";
import { calculateDirtyFlags, anyDirty } from "../helpers";

// ============================================================================
// UPDATE CHECKOUT SETTINGS
// ============================================================================

export function handleUpdateCheckoutSettings(
  state: ProductFormState,
  payload: Partial<CheckoutSettingsFormData>
): ProductFormState {
  const newCheckoutSettings = { ...state.editedData.checkoutSettings, ...payload };
  const newEditedData = { ...state.editedData, checkoutSettings: newCheckoutSettings };
  const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
  
  return {
    ...state,
    editedData: newEditedData,
    dirtyFlags: newDirtyFlags,
    isDirty: anyDirty(newDirtyFlags),
  };
}

// ============================================================================
// INIT CHECKOUT SETTINGS
// ============================================================================

export function handleInitCheckoutSettings(
  state: ProductFormState,
  payload: { settings: CheckoutSettingsFormData; credentials: GatewayCredentials }
): ProductFormState {
  const { settings } = payload;
  
  return {
    ...state,
    serverData: {
      ...state.serverData,
      checkoutSettings: { ...settings },
    },
    editedData: {
      ...state.editedData,
      checkoutSettings: { ...settings },
    },
    dirtyFlags: {
      ...state.dirtyFlags,
      checkoutSettings: false,
    },
  };
}
