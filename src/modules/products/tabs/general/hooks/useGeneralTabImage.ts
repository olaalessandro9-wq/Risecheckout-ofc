/**
 * useGeneralTabImage - Lógica de Imagem (View Only)
 * 
 * REFATORADO para usar estado do ProductContext via State Machine.
 * Não mantém estado local - usa formState.editedData.image.
 * 
 * NOTA: uploadImage foi REMOVIDO
 * Motivo: Upload unificado via useGlobalValidationHandlers + saveFunctions.ts
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - XState State Machine Edition
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useProductContext } from "../../../context/ProductContext";

export function useGeneralTabImage() {
  const { imageState, updateImageState } = useProductContext();

  const handleImageFileChange = useCallback((file: File | null) => {
    updateImageState({ imageFile: file, pendingRemoval: false });
  }, [updateImageState]);

  const handleImageUrlChange = useCallback((url: string) => {
    updateImageState({ imageUrl: url, pendingRemoval: false });
  }, [updateImageState]);

  const handleRemoveImage = useCallback(() => {
    updateImageState({ pendingRemoval: true });
    toast.success("Imagem marcada para remoção. Clique em 'Salvar Produto' para confirmar.");
  }, [updateImageState]);

  const resetImage = useCallback(() => {
    updateImageState({ imageFile: null, imageUrl: "", pendingRemoval: false });
  }, [updateImageState]);

  return {
    image: imageState,
    handleImageFileChange,
    handleImageUrlChange,
    handleRemoveImage,
    resetImage,
  };
}
