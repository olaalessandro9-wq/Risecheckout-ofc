/**
 * Form Helpers - Funções helper para campos de formulário
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { ProductFormDispatch } from "../../types/productForm.types";
import type { GeneralFormData, ImageFormState, CheckoutSettingsFormData, GatewayCredentials } from "../../types/productForm.types";
import type { Offer } from "../../types/product.types";
import { formActions } from "../reducer";

// ============================================================================
// FORM FIELD UPDATERS
// ============================================================================

export function createUpdateGeneralField(dispatch: ProductFormDispatch) {
  return <K extends keyof GeneralFormData>(field: K, value: GeneralFormData[K]) => {
    dispatch(formActions.updateGeneral({ [field]: value }));
  };
}

export function createUpdateImageState(dispatch: ProductFormDispatch) {
  return (update: Partial<ImageFormState>) => {
    dispatch(formActions.updateImage(update));
  };
}

export function createUpdateLocalOffers(dispatch: ProductFormDispatch) {
  return (offers: Offer[]) => {
    dispatch(formActions.updateOffers({ localOffers: offers }));
  };
}

export function createMarkOfferDeleted(dispatch: ProductFormDispatch) {
  return (offerId: string) => {
    dispatch(formActions.addDeletedOffer(offerId));
  };
}

export function createSetOffersModified(dispatch: ProductFormDispatch) {
  return (modified: boolean) => {
    dispatch(formActions.updateOffers({ modified }));
  };
}

export function createUpdateCheckoutSettingsField(dispatch: ProductFormDispatch) {
  return <K extends keyof CheckoutSettingsFormData>(field: K, value: CheckoutSettingsFormData[K]) => {
    dispatch(formActions.updateCheckoutSettings({ [field]: value }));
  };
}

export function createInitCheckoutSettings(
  dispatch: ProductFormDispatch,
  setCredentials: (credentials: GatewayCredentials) => void
) {
  return (settings: CheckoutSettingsFormData, credentials: GatewayCredentials) => {
    dispatch(formActions.initCheckoutSettings({ settings, credentials }));
    setCredentials(credentials);
  };
}
