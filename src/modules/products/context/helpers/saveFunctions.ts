/**
 * saveFunctions - Funções de salvamento puras
 * 
 * Funções que executam operações de salvamento sem depender de contexto React.
 * Usadas pelo useGlobalValidationHandlers para executar saves de forma centralizada.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Zero dependência de componentes
 */

import { api } from "@/lib/api";
import { uploadViaEdge } from "@/lib/storage/storageProxy";
import type { GeneralFormData } from "../../types/productForm.types";
import type { Offer } from "../../types/product.types";

// ============================================================================
// IMAGE UPLOAD
// ============================================================================

interface UploadImageParams {
  imageFile: File | null;
  userId: string;
  productId: string;
  currentImageUrl: string | null;
}

/**
 * Faz upload de imagem para o storage via Edge Function.
 * Retorna a URL pública da imagem ou a URL atual se não há arquivo.
 */
export async function uploadProductImage({
  imageFile,
  userId,
  productId,
  currentImageUrl,
}: UploadImageParams): Promise<string | null> {
  if (!imageFile) return currentImageUrl;

  const fileExt = imageFile.name.split(".").pop();
  const fileName = `${userId}/${productId}.${fileExt}`;

  const { publicUrl, error } = await uploadViaEdge(
    "product-images",
    fileName,
    imageFile,
    { upsert: true }
  );

  if (error) throw error;
  return publicUrl || currentImageUrl;
}

// ============================================================================
// OFFERS SAVE
// ============================================================================

interface SaveDeletedOffersParams {
  deletedOfferIds: string[];
}

/**
 * Deleta ofertas marcadas para remoção via Edge Function.
 */
export async function saveDeletedOffers({
  deletedOfferIds,
}: SaveDeletedOffersParams): Promise<void> {
  if (deletedOfferIds.length === 0) return;

  for (const offerId of deletedOfferIds) {
    const { data, error } = await api.call<{ success?: boolean; error?: string }>('offer-crud/delete', {
      offerId,
    });
    
    if (error) {
      console.error('[saveFunctions] Error deleting offer:', error);
      throw new Error(error.message);
    }
    if (!data?.success) {
      throw new Error(data?.error || 'Falha ao deletar oferta');
    }
  }
}

interface SaveOffersParams {
  productId: string;
  localOffers: Offer[];
  offersModified: boolean;
}

/**
 * Salva ofertas modificadas via Edge Function (bulk save).
 */
export async function saveOffers({
  productId,
  localOffers,
  offersModified,
}: SaveOffersParams): Promise<void> {
  if (!offersModified || !productId) return;

  const offersToSave = localOffers.map(offer => ({
    id: offer.id.startsWith("temp-") ? undefined : offer.id,
    productId: productId,
    name: offer.name,
    price: offer.price,
    isDefault: offer.is_default || false,
    memberGroupId: null,
  }));
  
  const { data, error } = await api.call<{ success?: boolean; error?: string }>('offer-bulk/bulk-save', {
    productId: productId,
    offers: offersToSave,
  });
  
  if (error) {
    console.error('[saveFunctions] Error saving offers:', error);
    throw new Error(error.message);
  }
  if (!data?.success) {
    throw new Error(data?.error || 'Falha ao salvar ofertas');
  }
}

// ============================================================================
// GENERAL PRODUCT SAVE
// ============================================================================

interface SaveGeneralParams {
  productId: string;
  generalForm: GeneralFormData;
  finalImageUrl: string | null;
}

/**
 * Salva informações gerais do produto via Edge Function.
 */
export async function saveGeneralProduct({
  productId,
  generalForm,
  finalImageUrl,
}: SaveGeneralParams): Promise<void> {
  const { data, error } = await api.call<{ success?: boolean; error?: string }>('product-settings', {
    action: 'update-general',
    productId,
    data: {
      name: generalForm.name,
      description: generalForm.description,
      price: generalForm.price,
      support_name: generalForm.support_name,
      support_email: generalForm.support_email,
      delivery_url: generalForm.external_delivery ? null : (generalForm.delivery_url || null),
      external_delivery: generalForm.external_delivery,
      status: "active",
      image_url: finalImageUrl,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Falha ao atualizar produto');
}
