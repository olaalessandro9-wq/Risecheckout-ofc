/**
 * Tipos de Actions do Reducer
 * 
 * Define todas as ações possíveis para o sistema de Form State.
 * Parte do sistema centralizado de Form State.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização de Tipos
 */

import type { Offer, UpsellSettings, AffiliateSettings } from "./product.types";
import type { ProductData } from "./product.types";
import type {
  GeneralFormData,
  ImageFormState,
  CheckoutSettingsFormData,
  GatewayCredentials,
  ServerDataSnapshot,
} from "./formData.types";

// ============================================================================
// ACTIONS (Ações do Reducer)
// ============================================================================

/**
 * Ação: Inicializar estado com dados do servidor
 */
export interface InitFromServerAction {
  type: "INIT_FROM_SERVER";
  payload: {
    product: ProductData | null;
    upsellSettings: UpsellSettings;
    affiliateSettings: AffiliateSettings | null;
    offers: Offer[];
  };
}

/**
 * Ação: Atualizar campo(s) do formulário Geral
 */
export interface UpdateGeneralAction {
  type: "UPDATE_GENERAL";
  payload: Partial<GeneralFormData>;
}

/**
 * Ação: Atualizar estado da imagem
 */
export interface UpdateImageAction {
  type: "UPDATE_IMAGE";
  payload: Partial<ImageFormState>;
}

/**
 * Ação: Atualizar ofertas locais
 */
export interface UpdateOffersAction {
  type: "UPDATE_OFFERS";
  payload: {
    localOffers?: Offer[];
    deletedOfferIds?: string[];
    modified?: boolean;
  };
}

/**
 * Ação: Adicionar ID de oferta deletada
 */
export interface AddDeletedOfferAction {
  type: "ADD_DELETED_OFFER";
  payload: string;
}

/**
 * Ação: Atualizar configurações de Upsell
 */
export interface UpdateUpsellAction {
  type: "UPDATE_UPSELL";
  payload: Partial<UpsellSettings>;
}

/**
 * Ação: Atualizar configurações de Afiliados
 */
export interface UpdateAffiliateAction {
  type: "UPDATE_AFFILIATE";
  payload: Partial<AffiliateSettings>;
}

/**
 * Ação: Atualizar configurações de checkout (ConfiguracoesTab)
 */
export interface UpdateCheckoutSettingsAction {
  type: "UPDATE_CHECKOUT_SETTINGS";
  payload: Partial<CheckoutSettingsFormData>;
}

/**
 * Ação: Inicializar configurações de checkout (quando carregadas)
 */
export interface InitCheckoutSettingsAction {
  type: "INIT_CHECKOUT_SETTINGS";
  payload: {
    settings: CheckoutSettingsFormData;
    credentials: GatewayCredentials;
  };
}

/**
 * Ação: Marcar checkout settings como salvo (após save bem-sucedido)
 * Força atualização do serverData, ignorando o guard de dirty
 */
export interface MarkCheckoutSettingsSavedAction {
  type: "MARK_CHECKOUT_SETTINGS_SAVED";
  payload: {
    settings: CheckoutSettingsFormData;
  };
}

/**
 * Ação: Resetar para dados do servidor
 */
export interface ResetToServerAction {
  type: "RESET_TO_SERVER";
}

/**
 * Ação: Marcar como salvo (após save bem-sucedido)
 */
export interface MarkSavedAction {
  type: "MARK_SAVED";
  payload?: {
    newServerData?: Partial<ServerDataSnapshot>;
  };
}

/**
 * Ação: Setar erro de validação
 */
export interface SetValidationErrorAction {
  type: "SET_VALIDATION_ERROR";
  payload: {
    section: "general" | "upsell" | "affiliate";
    field: string;
    error: string | undefined;
  };
}

/**
 * Ação: Limpar todos os erros de validação
 */
export interface ClearValidationErrorsAction {
  type: "CLEAR_VALIDATION_ERRORS";
}

/**
 * Ação: Resetar imagem (após upload bem-sucedido)
 */
export interface ResetImageAction {
  type: "RESET_IMAGE";
}

/**
 * Ação: Resetar ofertas (após save bem-sucedido)
 */
export interface ResetOffersAction {
  type: "RESET_OFFERS";
}

/**
 * Ação: Marcar interação do usuário (para dirty tracking)
 */
export interface MarkUserInteractionAction {
  type: "MARK_USER_INTERACTION";
}

/**
 * Union de todas as ações possíveis
 */
export type ProductFormAction =
  | InitFromServerAction
  | UpdateGeneralAction
  | UpdateImageAction
  | UpdateOffersAction
  | AddDeletedOfferAction
  | UpdateUpsellAction
  | UpdateAffiliateAction
  | UpdateCheckoutSettingsAction
  | InitCheckoutSettingsAction
  | MarkCheckoutSettingsSavedAction
  | ResetToServerAction
  | MarkSavedAction
  | SetValidationErrorAction
  | ClearValidationErrorsAction
  | ResetImageAction
  | ResetOffersAction
  | MarkUserInteractionAction;
