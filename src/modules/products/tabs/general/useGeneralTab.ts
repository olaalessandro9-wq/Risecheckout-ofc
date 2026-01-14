/**
 * useGeneralTab - Hook Orquestrador (Refatorado)
 * 
 * Refatorado seguindo RISE ARCHITECT PROTOCOL:
 * - De 438 linhas para ~120 linhas (-73%)
 * - Cada responsabilidade em hook especializado
 * - Composição via hooks menores
 * - Single Responsibility aplicado
 */

import { useMemo, useLayoutEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProductContext } from "../../context/ProductContext";
import {
  useGeneralTabForm,
  useGeneralTabImage,
  useGeneralTabOffers,
  useGeneralTabMemberGroups,
  useGeneralTabSave,
} from "./hooks";

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
  } = useProductContext();

  // Form state and validation
  const {
    form,
    setForm,
    errors,
    validate,
    clearError,
  } = useGeneralTabForm({ product });

  // Image handling
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

  // Offers handling
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
    offers,
    productId: product?.id,
  });

  // Member groups
  const { memberGroups, hasMembersArea } = useGeneralTabMemberGroups({
    productId: product?.id,
    membersAreaEnabled: product?.members_area_enabled,
  });

  // Detect changes
  const hasChanges = useMemo(() => {
    if (!product) return false;

    const formChanged = (
      form.name !== product.name ||
      form.description !== (product.description || "") ||
      form.price !== product.price ||
      form.support_name !== (product.support_name || "") ||
      form.support_email !== (product.support_email || "") ||
      form.delivery_url !== (product.delivery_url || "") ||
      form.external_delivery !== (product.external_delivery ?? false)
    );

    const imageChanged = image.imageFile !== null || image.pendingRemoval;

    return formChanged || imageChanged || offersModified || deletedOfferIds.length > 0;
  }, [form, product, image, offersModified, deletedOfferIds]);

  // Notify context about changes
  useLayoutEffect(() => {
    updateGeneralModified(hasChanges);
  }, [hasChanges, updateGeneralModified]);

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
