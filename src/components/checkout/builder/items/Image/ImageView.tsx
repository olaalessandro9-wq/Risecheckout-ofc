import { ComponentData } from "../../types";
import { ImageBlock } from "@/features/checkout-builder/components";

interface ImageViewProps {
  component: ComponentData;
  design?: any;
}

export const ImageView = ({ component }: ImageViewProps) => {
  const { content } = component;
  
  // Ler src com fallback seguro (suporta imageUrl e url legado)
  const src = typeof content?.imageUrl === 'string'
    ? content.imageUrl
    : (typeof content?.url === 'string' ? content.url : '');

  return (
    <ImageBlock
      imageUrl={src}
      alt={content?.alt || "Componente"}
      alignment={content?.alignment || "center"}
      maxWidth={content?.maxWidth || 720}
      roundedImage={content?.roundedImage !== false}
    />
  );
};
