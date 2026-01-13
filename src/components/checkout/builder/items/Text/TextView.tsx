import { ComponentData } from "../../types";
import { TextBlock } from "@/features/checkout-builder/components";
import type { TextContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";

interface TextViewProps {
  component: ComponentData;
  design?: CheckoutDesign;
}

export const TextView = ({ component, design }: TextViewProps) => {
  // Type assertion segura - o componente só recebe content do tipo correto via registry
  const content = component.content as TextContent | undefined;

  return (
    <TextBlock
      text={content?.text || "Texto editável - Clique para editar"}
      textColor={content?.color || design?.colors?.primaryText || "#000000"}
      fontSize={content?.fontSize || 16}
      textAlign={content?.alignment || "center"}
      backgroundColor={content?.backgroundColor || "#FFFFFF"}
      borderColor={content?.borderColor || "#E5E7EB"}
      borderWidth={content?.borderWidth || 1}
      borderRadius={content?.borderRadius || 8}
    />
  );
};
