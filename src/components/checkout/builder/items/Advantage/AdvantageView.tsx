import { ComponentData } from "../../types";
import { BenefitBlock } from "@/features/checkout-builder/components";

interface AdvantageViewProps {
  component: ComponentData;
  design?: any;
}

export const AdvantageView = ({ component, design }: AdvantageViewProps) => {
  const { content } = component;

  return (
    <BenefitBlock
      title={content?.title || "Vantagem"}
      description={content?.description || "Descrição da vantagem"}
      icon={content?.icon || "check"}
      primaryColor={content?.primaryColor || "#1DB88E"}
      titleColor={content?.titleColor || "#000000"}
      descriptionColor={design?.colors?.secondaryText || "#6B7280"}
      backgroundColor={"#FFFFFF"}
      darkMode={content?.darkMode || false}
      verticalMode={content?.verticalMode || false}
      size={content?.size || "original"}
    />
  );
};
