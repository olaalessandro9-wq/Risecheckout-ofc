/**
 * useGeneralTab - Hook Orquestrador (Refatorado para Reducer Pattern)
 * 
 * Refatorado seguindo RISE ARCHITECT PROTOCOL V3:
 * - Estado de formulário centralizado no ProductContext via Reducer
 * - Tabs são Pure Views - consomem estado do Context
 * - Zero estado local de formulário
 * - Single Source of Truth
 * - Registra save handler via Registry Pattern
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Arquitetura de Form State Centralizado
 */

import { useMemo, useLayoutEffect, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProductContext } from "../../context/ProductContext";
import {
  useGeneralTabImage,
  useGeneralTabOffers,
  useGeneralTabMemberGroups,
  useGeneralTabSave,
} from "./hooks";
import type { GeneralFormData, GeneralFormErrors } from "./types";

export function useGeneralTab() {
  const { user } = useAuth();
  const {
    product,
    offers,
    refreshOffers,
    refreshProduct,
    refreshPaymentLinks,
    deleteProduct,
    updateGeneralModified,
    // Novo: estado do reducer
    formState,
    dispatchForm,
    formErrors,
    validateGeneralForm,
    // Save Registry
    registerSaveHandler,
  } = useProductContext();

  // Form state vem do Context (reducer) - NÃO do useState local
  const form = formState.editedData.general;
  const isInitialized = formState.isInitialized;

  // Setter que dispara action para o reducer
  const setForm = useCallback((updater: GeneralFormData | ((prev: GeneralFormData) => GeneralFormData)) => {
    if (typeof updater === 'function') {
      const newForm = updater(form);
      dispatchForm({ type: 'UPDATE_GENERAL', payload: newForm });
    } else {
      dispatchForm({ type: 'UPDATE_GENERAL', payload: updater });
    }
  }, [form, dispatchForm]);

  // Errors vem do formState - mapear para tipo correto
  const errors: GeneralFormErrors = {
    name: formErrors.general.name || "",
    description: formErrors.general.description || "",
    price: formErrors.general.price || "",
    support_name: formErrors.general.support_name || "",
    support_email: formErrors.general.support_email || "",
    delivery_url: formErrors.general.delivery_url || "",
  };

  // Clear error - dispara action
  const clearError = useCallback((field: keyof GeneralFormErrors) => {
    dispatchForm({ 
      type: 'SET_VALIDATION_ERROR', 
      payload: { section: 'general', field, error: undefined } 
    });
  }, [dispatchForm]);

  // Image handling - ainda usa estado local (não é formulário)
  const {
    image,
    handleImageFileChange,
    handleImageUrlChange,
    handleRemoveImage,
    uploadImage,
    resetImage,
  } = useGeneralTabImage({
    userId: user?.id,
    productId: product?.id,
    currentImageUrl: product?.image_url,
  });

  // Offers handling - agora consome do reducer via ProductContext
  const {
    localOffers,
    offersModified,
    deletedOfferIds,
    handleOffersChange,
    handleOffersModifiedChange,
    handleOfferDeleted,
    saveDeletedOffers,
    saveOffers,
    resetOffers,
  } = useGeneralTabOffers({
    productId: product?.id,
  });

  // Member groups
  const { memberGroups, hasMembersArea } = useGeneralTabMemberGroups({
    productId: product?.id,
    membersAreaEnabled: product?.members_area_enabled,
  });

  // Detect changes - compara editedData com serverData
  const hasChanges = useMemo(() => {
    if (!isInitialized || !product) return false;

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
  }, [formState, product, image, offersModified, deletedOfferIds, isInitialized]);

  // Notify context about changes
  useLayoutEffect(() => {
    updateGeneralModified(hasChanges);
  }, [hasChanges, updateGeneralModified]);

  // Validate wrapper
  const validate = useCallback((): boolean => {
    return validateGeneralForm();
  }, [validateGeneralForm]);

  // Save and delete
  const { isSaving, isDeleting, handleSave, handleDelete } = useGeneralTabSave({
    productId: product?.id,
    form,
    validate,
    uploadImage,
    imageFile: image.imageFile,
    pendingRemoval: image.pendingRemoval,
    currentImageUrl: product?.image_url,
    saveDeletedOffers,
    saveOffers,
    resetImage,
    resetOffers,
    refreshProduct,
    refreshOffers,
    refreshPaymentLinks,
    deleteProduct,
  });

  // NOTA: O handler de save registry foi movido para useGlobalValidationHandlers
  // no ProductContext para garantir que a validação funcione independente
  // de qual aba está ativa. Este hook agora é apenas uma Pure View.

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
    isSaving,
    isDeleting,
    memberGroups,
    hasMembersArea,

    // Handlers
    handleSave,
    handleDelete,
    handleImageFileChange,
    handleImageUrlChange,
    handleRemoveImage,
    handleOffersChange,
    handleOffersModifiedChange,
    handleOfferDeleted,
  };
}
