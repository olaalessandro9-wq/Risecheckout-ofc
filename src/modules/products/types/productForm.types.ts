/**
 * Tipos do Sistema Centralizado de Form State
 * 
 * MIGRADO PARA XSTATE - Sistema legado de Reducer removido.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10.0/10
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

// Re-export de XState events (substitui formActions.types.ts)
export type {
  ProductFormEvent,
  ProductFormContext,
} from "../machines/productFormMachine.types";

// Re-export de formState.types.ts
export type {
  ProductFormState,
  ProductFormDispatch,
  ProductFormContextValue,
} from "./formState.types";

// Re-export de product.types.ts para compatibilidade
export type { UpsellSettings, AffiliateSettings } from "./product.types";
