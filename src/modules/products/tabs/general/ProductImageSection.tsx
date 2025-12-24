/**
 * ProductImageSection - Seção de imagem do produto
 */

import { ImageSelector } from "@/components/products/ImageSelector";
import type { ImageState } from "./types";

interface Props {
  currentImageUrl?: string | null;
  image: ImageState;
  onImageFileChange: (file: File | null) => void;
  onImageUrlChange: (url: string) => void;
  onRemoveImage: () => void;
}

export function ProductImageSection({
  currentImageUrl,
  image,
  onImageFileChange,
  onImageUrlChange,
  onRemoveImage,
}: Props) {
  return (
    <div className="border-t border-border pt-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Imagem do Produto</h3>
      <ImageSelector
        imageUrl={currentImageUrl}
        imageFile={image.imageFile}
        onImageFileChange={onImageFileChange}
        onImageUrlChange={onImageUrlChange}
        onRemoveImage={onRemoveImage}
        pendingRemoval={image.pendingRemoval}
      />
    </div>
  );
}
