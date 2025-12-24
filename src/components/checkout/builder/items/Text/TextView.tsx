import { ComponentData } from "../../types";
import { TextBlock } from "@/features/checkout-builder/components";

interface TextViewProps {
  component: ComponentData;
  design?: any;
}

export const TextView = ({ component, design }: TextViewProps) => {
  const { content } = component;

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
