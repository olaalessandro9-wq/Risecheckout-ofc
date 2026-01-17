/**
 * productFormReducer - Reducer Central para Estado de Formulários
 * 
 * Este reducer é a Single Source of Truth para todo estado
 * de formulários no sistema de edição de produtos.
 * 
 * MODULARIZADO seguindo RISE Protocol V3 - cada action handler
 * está em seu próprio arquivo para manutenibilidade.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solução C (Nota 9.8/10)
 */

import type { ProductFormState, ProductFormAction } from "../../types/productForm.types";

// Import action handlers
import {
  handleInitFromServer,
  handleResetToServer,
  handleMarkSaved,
  handleUpdateGeneral,
  handleUpdateImage,
  handleResetImage,
  handleUpdateOffers,
  handleAddDeletedOffer,
  handleResetOffers,
  handleUpdateUpsell,
  handleUpdateAffiliate,
  handleUpdateCheckoutSettings,
  handleInitCheckoutSettings,
  handleSetValidationError,
  handleClearValidationErrors,
} from "./actions";

// ============================================================================
// REDUCER
// ============================================================================

export function productFormReducer(
  state: ProductFormState,
  action: ProductFormAction
): ProductFormState {
  switch (action.type) {
    case "INIT_FROM_SERVER":
      return handleInitFromServer(state, action.payload);
    
    case "UPDATE_GENERAL":
      return handleUpdateGeneral(state, action.payload);
    
    case "UPDATE_IMAGE":
      return handleUpdateImage(state, action.payload);
    
    case "UPDATE_OFFERS":
      return handleUpdateOffers(state, action.payload);
    
    case "ADD_DELETED_OFFER":
      return handleAddDeletedOffer(state, action.payload);
    
    case "UPDATE_UPSELL":
      return handleUpdateUpsell(state, action.payload);
    
    case "UPDATE_AFFILIATE":
      return handleUpdateAffiliate(state, action.payload);
    
    case "UPDATE_CHECKOUT_SETTINGS":
      return handleUpdateCheckoutSettings(state, action.payload);
    
    case "INIT_CHECKOUT_SETTINGS":
      return handleInitCheckoutSettings(state, action.payload);
    
    case "RESET_TO_SERVER":
      return handleResetToServer(state);
    
    case "MARK_SAVED":
      return handleMarkSaved(state, action.payload);
    
    case "SET_VALIDATION_ERROR":
      return handleSetValidationError(state, action.payload);
    
    case "CLEAR_VALIDATION_ERRORS":
      return handleClearValidationErrors(state);
    
    case "RESET_IMAGE":
      return handleResetImage(state);
    
    case "RESET_OFFERS":
      return handleResetOffers(state);
    
    case "MARK_USER_INTERACTION":
      return state;
    
    default:
      return state;
  }
}
