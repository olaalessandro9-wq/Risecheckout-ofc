/**
 * Actor Types - State Machine Actor Inputs
 * 
 * Define interfaces de entrada para os actors da State Machine.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 * @module products/machines/types
 */

import type {
  ServerDataSnapshot,
  EditedFormData,
} from "../../types/formData.types";

// ============================================================================
// ACTOR INPUT TYPES
// ============================================================================

export interface LoadProductInput {
  productId: string | null;
  userId?: string;
}

export interface SaveAllInput {
  productId: string | null;
  userId?: string;
  editedData: EditedFormData;
  serverData: ServerDataSnapshot;
}

export interface SaveHandlerRegistry {
  [handlerId: string]: () => Promise<{ success: boolean; errors?: string[] }>;
}
