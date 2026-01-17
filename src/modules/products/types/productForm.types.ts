/**
 * Tipos do Sistema Centralizado de Form State
 * 
 * Este arquivo define todos os tipos necessários para o
 * Reducer Pattern de gerenciamento de estado de formulários.
 * 
 * @see RISE ARCHITECT PROTOCOL - Solução C (Nota 9.8/10)
 */

import type {
  ProductData,
  Offer,
  PaymentSettings,
  CheckoutFields,
  UpsellSettings,
  AffiliateSettings,
} from "./product.types";
import type { PaymentMethod } from "@/config/payment-gateways";

// ============================================================================
// CHECKOUT SETTINGS (para ConfiguracoesTab)
// ============================================================================

/**
 * Dados do formulário de configurações de checkout
 */
export interface CheckoutSettingsFormData {
  required_fields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    cpf: boolean;
  };
  default_payment_method: PaymentMethod;
  pix_gateway: string;
  credit_card_gateway: string;
}

/**
 * Status de credencial de gateway
 */
export interface GatewayCredentialStatus {
  configured: boolean;
  viaSecrets?: boolean;
}

/**
 * Credenciais de gateways de pagamento
 */
export interface GatewayCredentials {
  mercadopago?: GatewayCredentialStatus;
  pushinpay?: GatewayCredentialStatus;
  stripe?: GatewayCredentialStatus;
  asaas?: GatewayCredentialStatus;
  [key: string]: GatewayCredentialStatus | undefined;
}

// ============================================================================
// FORM DATA TYPES (Dados Editáveis)
// ============================================================================

/**
 * Dados do formulário da aba Geral
 */
export interface GeneralFormData {
  name: string;
  description: string;
  price: number;
  support_name: string;
  support_email: string;
  delivery_url: string;
  external_delivery: boolean;
}

/**
 * Estado da imagem no formulário
 */
export interface ImageFormState {
  imageFile: File | null;
  imageUrl: string;
  pendingRemoval: boolean;
}

/**
 * Dados do formulário de ofertas
 */
export interface OffersFormState {
  localOffers: Offer[];
  deletedOfferIds: string[];
  modified: boolean;
}

// ============================================================================
// SERVER DATA SNAPSHOT (Dados do Servidor - Imutáveis após load)
// ============================================================================

/**
 * Snapshot dos dados como vieram do servidor
 * Usado para comparação e detecção de mudanças
 */
export interface ServerDataSnapshot {
  product: ProductData | null;
  general: GeneralFormData;
  upsell: UpsellSettings;
  affiliateSettings: AffiliateSettings | null;
  offers: Offer[];
  checkoutSettings: CheckoutSettingsFormData;
}

// Re-export para uso externo
export type { UpsellSettings, AffiliateSettings } from "./product.types";

// ============================================================================
// EDITED DATA (Dados Editados pelo Usuário)
// ============================================================================

/**
 * Dados atualmente sendo editados pelo usuário
 */
export interface EditedFormData {
  general: GeneralFormData;
  image: ImageFormState;
  offers: OffersFormState;
  upsell: UpsellSettings;
  affiliate: AffiliateSettings | null;
  checkoutSettings: CheckoutSettingsFormData;
}

// ============================================================================
// VALIDATION STATE
// ============================================================================

/**
 * Erros de validação por campo
 */
export interface FormValidationErrors {
  general: {
    name?: string;
    description?: string;
    price?: string;
    support_name?: string;
    support_email?: string;
    delivery_url?: string;
  };
  upsell: {
    customPageUrl?: string;
  };
  affiliate: {
    defaultRate?: string;
    cookieDuration?: string;
    supportEmail?: string;
    marketplaceDescription?: string;
    marketplaceCategory?: string;
  };
}

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
  | ResetToServerAction
  | MarkSavedAction
  | SetValidationErrorAction
  | ClearValidationErrorsAction
  | ResetImageAction
  | ResetOffersAction
  | MarkUserInteractionAction;

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Tipo para dispatch function do reducer
 */
export type ProductFormDispatch = React.Dispatch<ProductFormAction>;

/**
 * Props para o hook useProductFormContext
 */
export interface ProductFormContextValue {
  state: ProductFormState;
  dispatch: ProductFormDispatch;
}
