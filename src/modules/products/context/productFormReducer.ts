/**
 * productFormReducer - Re-export do módulo modularizado
 * 
 * Este arquivo mantém compatibilidade com imports existentes.
 * A implementação real está em ./reducer/
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 * @deprecated Import from './reducer' instead for new code
 */

// Re-export tudo do módulo reducer para compatibilidade
export { productFormReducer, INITIAL_FORM_STATE, formActions } from "./reducer";
