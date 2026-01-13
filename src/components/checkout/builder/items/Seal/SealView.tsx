import { ComponentData } from "../../types";
import { BadgeBlock } from "@/features/checkout-builder/components";
import type { SealContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";

interface SealViewProps {
  component: ComponentData;
  design?: CheckoutDesign;
}

export const SealView = ({ component }: SealViewProps) => {
  // Type assertion segura - o componente só recebe content do tipo correto via registry
  const content = component.content as SealContent | undefined;

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
