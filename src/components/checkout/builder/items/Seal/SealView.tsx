import { ComponentData } from "../../types";
import { BadgeBlock } from "@/features/checkout-builder/components";

interface SealViewProps {
  component: ComponentData;
  design?: any;
}

export const SealView = ({ component, design }: SealViewProps) => {
  const { content } = component;

  return (
    <BadgeBlock
      topText={content?.topText || "7"}
      title={content?.title || "Privacidade"}
      subtitle={content?.subtitle || "Garantida"}
      primaryColor={content?.primaryColor || "#4F9EF8"}
      titleColor={content?.titleColor || "#FFFFFF"}
      alignment={content?.alignment || "center"}
      darkMode={content?.darkMode || false}
    />
  );
};
