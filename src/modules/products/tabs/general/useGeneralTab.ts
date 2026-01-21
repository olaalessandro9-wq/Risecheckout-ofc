/**
 * useGeneralTab - Hook Orquestrador (View Only)
 * 
 * Refatorado para XState State Machine:
 * - Estado de formulário centralizado no ProductContext via State Machine
 * - Tabs são Pure Views - consomem estado do Context
 * - Zero estado local de formulário
 * - Single Source of Truth
 * - Salvamento unificado via botão global "Salvar Produto" (useGlobalValidationHandlers)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - XState 10.0/10
 */

import { useMemo, useCallback } from "react";
import { useProductContext } from "../../context/ProductContext";
import {
  useGeneralTabImage,
  useGeneralTabOffers,
  useGeneralTabMemberGroups,
} from "./hooks";
import type { GeneralFormData, GeneralFormErrors } from "./types";

export function useGeneralTab() {
  const {
    product,
    formState,
    dispatchForm,
    formErrors,
  } = useProductContext();

  // Form state vem do Context (state machine) - NÃO do useState local
  const form = formState.editedData.general;

  // Setter que dispara action para a state machine
  const setForm = useCallback((updater: GeneralFormData | ((prev: GeneralFormData) => GeneralFormData)) => {
    if (typeof updater === 'function') {
      const newForm = updater(form);
      dispatchForm({ type: 'EDIT_GENERAL', payload: newForm });
    } else {
      dispatchForm({ type: 'EDIT_GENERAL', payload: updater });
    }
  }, [form, dispatchForm]);

  // Errors vem do formState - mapear para tipo correto
  const errors: GeneralFormErrors = {
    name: formErrors.general?.name || "",
    description: formErrors.general?.description || "",
    price: formErrors.general?.price || "",
    support_name: formErrors.general?.support_name || "",
    support_email: formErrors.general?.support_email || "",
    delivery_url: formErrors.general?.delivery_url || "",
  };

  // Clear error - dispara action
  const clearError = useCallback((field: keyof GeneralFormErrors) => {
    dispatchForm({ 
      type: 'SET_VALIDATION_ERROR', 
      section: 'general',
      field,
      error: undefined,
    });
  }, [dispatchForm]);

  // Image handling - view only (salvamento via useGlobalValidationHandlers)
  const {
    image,
    handleImageFileChange,
    handleImageUrlChange,
    handleRemoveImage,
  } = useGeneralTabImage();

  // Offers handling - view only (salvamento via useGlobalValidationHandlers)
  const {
    localOffers,
    offersModified,
    deletedOfferIds,
    handleOffersChange,
    handleOffersModifiedChange,
    handleOfferDeleted,
  } = useGeneralTabOffers();

  // Member groups
  const { memberGroups, hasMembersArea } = useGeneralTabMemberGroups({
    productId: product?.id,
    membersAreaEnabled: product?.members_area_enabled,
  });

  // Detect changes - compara editedData com serverData
  const hasChanges = useMemo(() => {
    if (!product) return false;

    // Compara os dados editados com os dados do servidor
    const serverGeneral = formState.serverData.general;
    const editedGeneral = formState.editedData.general;

    const formChanged = (
      editedGeneral.name !== serverGeneral.name ||
      editedGeneral.description !== serverGeneral.description ||
      editedGeneral.price !== serverGeneral.price ||
      editedGeneral.support_name !== serverGeneral.support_name ||
      editedGeneral.support_email !== serverGeneral.support_email ||
      editedGeneral.delivery_url !== serverGeneral.delivery_url ||
      editedGeneral.external_delivery !== serverGeneral.external_delivery
    );

    const imageChanged = image.imageFile !== null || image.pendingRemoval;

    return formChanged || imageChanged || offersModified || deletedOfferIds.length > 0;
  }, [formState, product, image, offersModified, deletedOfferIds]);

  return {
    // State
    product,
    form,
    setForm,
    errors,
    clearError,
    image,
    localOffers,
    hasChanges,
    memberGroups,
    hasMembersArea,

    // Handlers
    handleImageFileChange,
    handleImageUrlChange,
    handleRemoveImage,
    handleOffersChange,
    handleOffersModifiedChange,
    handleOfferDeleted,
  };
}
