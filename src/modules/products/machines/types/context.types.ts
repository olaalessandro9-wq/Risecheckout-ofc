/**
 * Context Types - State Machine Context
 * 
 * Define interfaces para o contexto da State Machine.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 * @module products/machines/types
 */

import type {
  ServerDataSnapshot,
  EditedFormData,
  GatewayCredentials,
} from "../../types/formData.types";
import type { TabValidationMap } from "../../types/tabValidation.types";
import type { ProductEntities, ValidationErrors } from "./entities.types";

// ============================================================================
// CONTEXT (Estado interno da máquina)
// ============================================================================

export interface ProductFormContext {
  // IDs
  productId: string | null;
  userId: string | undefined;
  
  // Dados do servidor (imutáveis até novo load)
  serverData: ServerDataSnapshot;
  
  // Dados editados pelo usuário
  editedData: EditedFormData;
  
  // Entidades relacionadas
  entities: ProductEntities;
  
  // Credentials para gateways
  credentials: GatewayCredentials;
  
  // Erros
  validationErrors: ValidationErrors;
  saveError: string | null;
  loadError: string | null;
  
  // Timestamps
  lastLoadedAt: number | null;
  lastSavedAt: number | null;
  
  // Tab state
  activeTab: string;
  tabErrors: TabValidationMap;
  
  // Initialization flags
  isCheckoutSettingsInitialized: boolean;
  
  // URL pendente da imagem (usada durante salvamento para sincronizar serverData)
  pendingImageUrl: string | null;
}
