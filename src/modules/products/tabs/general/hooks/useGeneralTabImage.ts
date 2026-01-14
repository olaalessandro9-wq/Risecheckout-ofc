/**
 * useGeneralTabImage - Lógica de Imagem
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { uploadViaEdge } from "@/lib/storage/storageProxy";
import type { ImageState } from "../types";

interface UseGeneralTabImageProps {
  userId: string | undefined;
  productId: string | undefined;
  currentImageUrl: string | null | undefined;
}

export function useGeneralTabImage({ userId, productId, currentImageUrl }: UseGeneralTabImageProps) {
  const [image, setImage] = useState<ImageState>({
    imageFile: null,
    imageUrl: "",
    pendingRemoval: false,
  });

  const handleImageFileChange = useCallback((file: File | null) => {
    setImage((prev) => ({ ...prev, imageFile: file, pendingRemoval: false }));
  }, []);

  const handleImageUrlChange = useCallback((url: string) => {
    setImage((prev) => ({ ...prev, imageUrl: url, pendingRemoval: false }));
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImage((prev) => ({ ...prev, pendingRemoval: true }));
    toast.success("Imagem marcada para remoção. Clique em 'Salvar Alterações' para confirmar.");
  }, []);

  const uploadImage = useCallback(async (): Promise<string | null | undefined> => {
    if (!image.imageFile || !userId || !productId) return currentImageUrl;

    try {
      const fileExt = image.imageFile.name.split(".").pop();
      const fileName = `${userId}/${productId}.${fileExt}`;

      const { publicUrl, error: uploadError } = await uploadViaEdge(
        "product-images",
        fileName,
        image.imageFile,
        { upsert: true }
      );

      if (uploadError) throw uploadError;

      return publicUrl;
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast.error("Não foi possível fazer upload da imagem");
      throw error;
    }
  }, [image.imageFile, userId, productId, currentImageUrl]);

  const resetImage = useCallback(() => {
    setImage({ imageFile: null, imageUrl: "", pendingRemoval: false });
  }, []);

  return {
    image,
    handleImageFileChange,
    handleImageUrlChange,
    handleRemoveImage,
    uploadImage,
    resetImage,
  };
}
