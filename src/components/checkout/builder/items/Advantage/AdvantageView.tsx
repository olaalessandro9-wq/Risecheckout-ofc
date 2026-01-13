import { ComponentData } from "../../types";
import { BenefitBlock } from "@/features/checkout-builder/components";
import type { AdvantageContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";

interface AdvantageViewProps {
  component: ComponentData;
  design?: CheckoutDesign;
}

export const AdvantageView = ({ component, design }: AdvantageViewProps) => {
  // Type assertion segura - o componente só recebe content do tipo correto via registry
  const content = component.content as AdvantageContent | undefined;

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
