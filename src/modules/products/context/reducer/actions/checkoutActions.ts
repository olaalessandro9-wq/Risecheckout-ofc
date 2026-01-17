/**
 * Checkout Actions - Ações para configurações de checkout
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { ProductFormState, CheckoutSettingsFormData, GatewayCredentials } from "../../../types/productForm.types";
import { calculateDirtyFlags, anyDirty } from "../helpers";
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
  
  // GUARD: Se já inicializado E há alterações não salvas, NÃO sobrescrever
  // Isso preserva as edições do usuário ao navegar entre abas
  if (state.isCheckoutSettingsInitialized && state.dirtyFlags.checkoutSettings) {
    return state;
  }
  
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
    isCheckoutSettingsInitialized: true,
    dirtyFlags: {
      ...state.dirtyFlags,
      checkoutSettings: false,
    },
  };
}

// ============================================================================
// MARK CHECKOUT SETTINGS SAVED
// ============================================================================

/**
 * Marca checkout settings como salvo após save bem-sucedido
 * Atualiza serverData com os valores atuais e reseta dirty flag
 * NÃO tem guard - sempre executa (usado após save)
 */
export function handleMarkCheckoutSettingsSaved(
  state: ProductFormState,
  payload: { settings: CheckoutSettingsFormData }
): ProductFormState {
  const { settings } = payload;
  
  return {
    ...state,
    serverData: {
      ...state.serverData,
      checkoutSettings: { ...settings },
    },
    dirtyFlags: {
      ...state.dirtyFlags,
      checkoutSettings: false,
    },
    isDirty: anyDirty({
      ...state.dirtyFlags,
      checkoutSettings: false,
    }),
  };
}
