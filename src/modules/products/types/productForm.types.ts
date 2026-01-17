/**
 * Tipos do Sistema Centralizado de Form State
 * 
 * Este arquivo é um barrel export para manter compatibilidade.
 * Os tipos foram modularizados em arquivos separados.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10/10
 */

// Re-export de formData.types.ts
export type {
  CheckoutSettingsFormData,
  GatewayCredentialStatus,
  GatewayCredentials,
  GeneralFormData,
  ImageFormState,
  OffersFormState,
  ServerDataSnapshot,
  EditedFormData,
  FormValidationErrors,
} from "./formData.types";

// Re-export de formActions.types.ts
export type {
  InitFromServerAction,
  UpdateGeneralAction,
  UpdateImageAction,
  UpdateOffersAction,
  AddDeletedOfferAction,
  UpdateUpsellAction,
  UpdateAffiliateAction,
  UpdateCheckoutSettingsAction,
  InitCheckoutSettingsAction,
  ResetToServerAction,
  MarkSavedAction,
  SetValidationErrorAction,
  ClearValidationErrorsAction,
  ResetImageAction,
  ResetOffersAction,
  MarkUserInteractionAction,
  ProductFormAction,
} from "./formActions.types";

// Re-export de formState.types.ts
export type {
  ProductFormState,
  ProductFormDispatch,
  ProductFormContextValue,
} from "./formState.types";

// Re-export de product.types.ts para compatibilidade
export type { UpsellSettings, AffiliateSettings } from "./product.types";
