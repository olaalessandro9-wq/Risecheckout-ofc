import { ComponentData } from "../../types";
import { ImageBlock } from "@/features/checkout-builder/components";
import type { ImageContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";

interface ImageViewProps {
  component: ComponentData;
  design?: CheckoutDesign;
}

export const ImageView = ({ component }: ImageViewProps) => {
  // Type assertion segura - o componente só recebe content do tipo correto via registry
  const content = component.content as ImageContent | undefined;
  
  // Ler src com fallback seguro (suporta imageUrl e url alternativo)
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
