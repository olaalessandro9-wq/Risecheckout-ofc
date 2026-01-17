/**
 * Reducer Module Index - Re-exporta tudo do módulo reducer
 * 
 * Este é o ponto de entrada único para o módulo de reducer.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

// Reducer principal
export { productFormReducer } from "./productFormReducer";

// Estado inicial
export { INITIAL_FORM_STATE } from "./initialState";

// Action creators
export { formActions } from "./actionCreators";

// Helpers (para uso externo se necessário)
export { deriveGeneralFromProduct, calculateDirtyFlags, anyDirty } from "./helpers";
