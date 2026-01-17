/**
 * useGeneralTabImage - Lógica de Imagem
 * 
 * REFATORADO para usar estado do ProductContext via reducer.
 * Não mantém estado local - usa formState.editedData.image.
 * 
 * @see RISE ARCHITECT PROTOCOL - Solução C
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { uploadViaEdge } from "@/lib/storage/storageProxy";
import { useProductContext } from "../../../context/ProductContext";
import type { ImageFormState } from "../../../types/productForm.types";

interface UseGeneralTabImageProps {
  userId: string | undefined;
  productId: string | undefined;
  currentImageUrl: string | null | undefined;
}

export function useGeneralTabImage({ userId, productId, currentImageUrl }: UseGeneralTabImageProps) {
  const { imageState, updateImageState } = useProductContext();

  const handleImageFileChange = useCallback((file: File | null) => {
    updateImageState({ imageFile: file, pendingRemoval: false });
  }, [updateImageState]);

  const handleImageUrlChange = useCallback((url: string) => {
    updateImageState({ imageUrl: url, pendingRemoval: false });
  }, [updateImageState]);

  const handleRemoveImage = useCallback(() => {
    updateImageState({ pendingRemoval: true });
    toast.success("Imagem marcada para remoção. Clique em 'Salvar Alterações' para confirmar.");
  }, [updateImageState]);

  const uploadImage = useCallback(async (): Promise<string | null | undefined> => {
    if (!imageState.imageFile || !userId || !productId) return currentImageUrl;

    try {
      const fileExt = imageState.imageFile.name.split(".").pop();
      const fileName = `${userId}/${productId}.${fileExt}`;

      const { publicUrl, error: uploadError } = await uploadViaEdge(
        "product-images",
        fileName,
        imageState.imageFile,
        { upsert: true }
      );

      if (uploadError) throw uploadError;

      return publicUrl;
    } catch (error: unknown) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast.error("Não foi possível fazer upload da imagem");
      throw error;
    }
  }, [imageState.imageFile, userId, productId, currentImageUrl]);

  const resetImage = useCallback(() => {
    updateImageState({ imageFile: null, imageUrl: "", pendingRemoval: false });
  }, [updateImageState]);

  return {
    image: imageState,
    handleImageFileChange,
    handleImageUrlChange,
    handleRemoveImage,
    uploadImage,
    resetImage,
  };
}
