/**
 * Product Form State Machine - Types
 * 
 * Define todos os tipos para a máquina de estados XState.
 * Esta é a definição formal de estados, eventos e contexto.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10/10
 */

import type {
  ProductData,
  Offer,
  UpsellSettings,
  AffiliateSettings,
} from "../types/product.types";
import type {
  GeneralFormData,
  ImageFormState,
  OffersFormState,
  ServerDataSnapshot,
  EditedFormData,
  FormValidationErrors,
  CheckoutSettingsFormData,
  GatewayCredentials,
} from "../types/productForm.types";

// ============================================================================
// MACHINE STATES
// ============================================================================

/**
 * Estados possíveis da máquina
 * Cada estado representa uma fase clara do ciclo de vida do formulário
 */
export type ProductFormMachineState =
  | { value: "idle"; context: ProductFormContext }
  | { value: "loading"; context: ProductFormContext }
  | { value: "editing"; context: ProductFormContext }
  | { value: "validating"; context: ProductFormContext }
  | { value: "saving"; context: ProductFormContext }
  | { value: "saved"; context: ProductFormContext }
  | { value: "error"; context: ProductFormContext };

/**
 * Estados como string literal (para uso em guards e actions)
 */
export type ProductFormStateValue = 
  | "idle"
  | "loading"
  | "editing"
  | "validating"
  | "saving"
  | "saved"
  | "error";

// ============================================================================
// MACHINE CONTEXT
// ============================================================================

/**
 * Contexto da máquina - todos os dados gerenciados
 */
export interface ProductFormContext {
  // IDs
  productId: string | null;
  userId: string | null;
  
  // Dados originais do servidor (snapshot imutável após load)
  serverData: ServerDataSnapshot;
  
  // Dados editados pelo usuário
  editedData: EditedFormData;
  
  // Dirty tracking
  isDirty: boolean;
  dirtyFlags: {
    general: boolean;
    image: boolean;
    offers: boolean;
    upsell: boolean;
    affiliate: boolean;
    checkoutSettings: boolean;
  };
  
  // Validação
  validation: FormValidationErrors;
  
  // Credenciais de checkout
  checkoutCredentials: GatewayCredentials;
  
  // Estado de erro (quando em estado "error")
  errorMessage: string | null;
  
  // Contagem de tentativas de save (para retry logic)
  saveAttempts: number;
}

// ============================================================================
// MACHINE EVENTS
// ============================================================================

/**
 * Evento: Iniciar carregamento
 */
export interface StartLoadingEvent {
  type: "START_LOADING";
  productId: string;
  userId: string;
}

/**
 * Evento: Dados carregados do servidor
 */
export interface DataLoadedEvent {
  type: "DATA_LOADED";
  data: {
    product: ProductData | null;
    upsellSettings: UpsellSettings;
    affiliateSettings: AffiliateSettings | null;
    offers: Offer[];
  };
}

/**
 * Evento: Erro ao carregar
 */
export interface LoadErrorEvent {
  type: "LOAD_ERROR";
  error: string;
}

/**
 * Evento: Atualizar campo do formulário geral
 */
export interface UpdateGeneralEvent {
  type: "UPDATE_GENERAL";
  data: Partial<GeneralFormData>;
}

/**
 * Evento: Atualizar estado da imagem
 */
export interface UpdateImageEvent {
  type: "UPDATE_IMAGE";
  data: Partial<ImageFormState>;
}

/**
 * Evento: Resetar imagem
 */
export interface ResetImageEvent {
  type: "RESET_IMAGE";
}

/**
 * Evento: Atualizar ofertas
 */
export interface UpdateOffersEvent {
  type: "UPDATE_OFFERS";
  data: {
    localOffers?: Offer[];
    deletedOfferIds?: string[];
    modified?: boolean;
  };
}

/**
 * Evento: Adicionar ID de oferta deletada
 */
export interface AddDeletedOfferEvent {
  type: "ADD_DELETED_OFFER";
  offerId: string;
}

/**
 * Evento: Resetar ofertas
 */
export interface ResetOffersEvent {
  type: "RESET_OFFERS";
}

/**
 * Evento: Atualizar upsell
 */
export interface UpdateUpsellEvent {
  type: "UPDATE_UPSELL";
  data: Partial<UpsellSettings>;
}

/**
 * Evento: Atualizar affiliate
 */
export interface UpdateAffiliateEvent {
  type: "UPDATE_AFFILIATE";
  data: Partial<AffiliateSettings>;
}

/**
 * Evento: Atualizar checkout settings
 */
export interface UpdateCheckoutSettingsEvent {
  type: "UPDATE_CHECKOUT_SETTINGS";
  data: Partial<CheckoutSettingsFormData>;
}

/**
 * Evento: Inicializar checkout settings
 */
export interface InitCheckoutSettingsEvent {
  type: "INIT_CHECKOUT_SETTINGS";
  settings: CheckoutSettingsFormData;
  credentials: GatewayCredentials;
}

/**
 * Evento: Definir erro de validação
 */
export interface SetValidationErrorEvent {
  type: "SET_VALIDATION_ERROR";
  section: "general" | "upsell" | "affiliate";
  field: string;
  error: string | undefined;
}

/**
 * Evento: Limpar erros de validação
 */
export interface ClearValidationErrorsEvent {
  type: "CLEAR_VALIDATION_ERRORS";
}

/**
 * Evento: Solicitar salvamento
 */
export interface RequestSaveEvent {
  type: "REQUEST_SAVE";
}

/**
 * Evento: Validação passou
 */
export interface ValidationPassedEvent {
  type: "VALIDATION_PASSED";
}

/**
 * Evento: Validação falhou
 */
export interface ValidationFailedEvent {
  type: "VALIDATION_FAILED";
  errors: FormValidationErrors;
}

/**
 * Evento: Salvamento bem-sucedido
 */
export interface SaveSuccessEvent {
  type: "SAVE_SUCCESS";
  newServerData?: Partial<ServerDataSnapshot>;
}

/**
 * Evento: Erro ao salvar
 */
export interface SaveErrorEvent {
  type: "SAVE_ERROR";
  error: string;
}

/**
 * Evento: Descartar mudanças
 */
export interface DiscardChangesEvent {
  type: "DISCARD_CHANGES";
}

/**
 * Evento: Resetar para servidor
 */
export interface ResetToServerEvent {
  type: "RESET_TO_SERVER";
}

/**
 * Evento: Tentar novamente
 */
export interface RetryEvent {
  type: "RETRY";
}

/**
 * Evento: Continuar editando
 */
export interface ContinueEditingEvent {
  type: "CONTINUE_EDITING";
}

/**
 * Union de todos os eventos
 */
export type ProductFormEvent =
  | StartLoadingEvent
  | DataLoadedEvent
  | LoadErrorEvent
  | UpdateGeneralEvent
  | UpdateImageEvent
  | ResetImageEvent
  | UpdateOffersEvent
  | AddDeletedOfferEvent
  | ResetOffersEvent
  | UpdateUpsellEvent
  | UpdateAffiliateEvent
  | UpdateCheckoutSettingsEvent
  | InitCheckoutSettingsEvent
  | SetValidationErrorEvent
  | ClearValidationErrorsEvent
  | RequestSaveEvent
  | ValidationPassedEvent
  | ValidationFailedEvent
  | SaveSuccessEvent
  | SaveErrorEvent
  | DiscardChangesEvent
  | ResetToServerEvent
  | RetryEvent
  | ContinueEditingEvent;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isUpdateEvent(event: ProductFormEvent): event is 
  | UpdateGeneralEvent
  | UpdateImageEvent
  | UpdateOffersEvent
  | UpdateUpsellEvent
  | UpdateAffiliateEvent
  | UpdateCheckoutSettingsEvent {
  return [
    "UPDATE_GENERAL",
    "UPDATE_IMAGE",
    "UPDATE_OFFERS",
    "UPDATE_UPSELL",
    "UPDATE_AFFILIATE",
    "UPDATE_CHECKOUT_SETTINGS",
  ].includes(event.type);
}
