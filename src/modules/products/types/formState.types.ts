/**
 * Tipos de Estado da State Machine
 * 
 * Define o estado completo do sistema de Form State.
 * Parte do sistema XState State Machine.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - XState State Machine Edition
 */

import type {
  ServerDataSnapshot,
  EditedFormData,
  FormValidationErrors,
} from "./formData.types";
import type { ProductFormEvent } from "../machines/productFormMachine.types";

// ============================================================================
// PRODUCT FORM STATE (Estado Completo do Reducer)
// ============================================================================

/**
 * Estado completo do Reducer
 * Single Source of Truth para todos os formulários
 */
export interface ProductFormState {
  // Dados originais do servidor (snapshot imutável após load)
  serverData: ServerDataSnapshot;
  
  // Dados editados pelo usuário (mutable via dispatch)
  editedData: EditedFormData;
  
  // Estado de inicialização
  isInitialized: boolean;
  
  // Flag separada para checkout settings (carregadas em chamada separada)
  isCheckoutSettingsInitialized: boolean;
  
  // Dirty tracking: true se há diferenças entre editedData e serverData
  isDirty: boolean;
  
  // Dirty tracking granular por seção
  dirtyFlags: {
    general: boolean;
    image: boolean;
    offers: boolean;
    upsell: boolean;
    affiliate: boolean;
    checkoutSettings: boolean;
  };
  
  // Erros de validação
  validation: FormValidationErrors;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Tipo para dispatch function (XState send)
 * @see RISE V3 - Migrado de Reducer para XState
 */
export type ProductFormDispatch = (event: ProductFormEvent) => void;

/**
 * Props para o hook useProductFormContext
 */
export interface ProductFormContextValue {
  state: ProductFormState;
  dispatch: ProductFormDispatch;
}
