/**
 * useGeneralTab - Hook Orquestrador (Refatorado)
 * 
 * Refatorado seguindo RISE ARCHITECT PROTOCOL:
 * - De 438 linhas para ~120 linhas (-73%)
 * - Cada responsabilidade em hook especializado
 * - Composição via hooks menores
 * - Single Responsibility aplicado
 * 
 * FIXES:
 * - Normalized value comparison to prevent false positive hasChanges
 * - Added isInitialized flag to prevent popup without edits
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

/**
 * Normalizes a value for comparison:
 * - null/undefined -> ""
 * - false/undefined -> false
 */
function normalizeString(value: string | null | undefined): string {
  return value ?? "";
}

function normalizeBoolean(value: boolean | null | undefined): boolean {
  return value ?? false;
}

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
    isInitialized,
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

  // Detect changes - ONLY after initialization to prevent false positives
  const hasChanges = useMemo(() => {
    // Don't report changes until form is initialized with product data
    if (!isInitialized || !product) return false;

    // Normalize values before comparison to handle null/undefined vs ""
    const formChanged = (
      form.name !== product.name ||
      form.description !== normalizeString(product.description) ||
      form.price !== product.price ||
      form.support_name !== normalizeString(product.support_name) ||
      form.support_email !== normalizeString(product.support_email) ||
      form.delivery_url !== normalizeString(product.delivery_url) ||
      form.external_delivery !== normalizeBoolean(product.external_delivery)
    );

    const imageChanged = image.imageFile !== null || image.pendingRemoval;

    return formChanged || imageChanged || offersModified || deletedOfferIds.length > 0;
  }, [form, product, image, offersModified, deletedOfferIds, isInitialized]);

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
