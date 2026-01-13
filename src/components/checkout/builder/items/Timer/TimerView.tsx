import { ComponentData } from "../../types";
import { CountdownTimer } from "@/features/checkout-builder/components";
import type { TimerContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";

interface TimerViewProps {
  component: ComponentData;
  design?: CheckoutDesign;
}

export const TimerView = ({ component, design }: TimerViewProps) => {
  // Type assertion segura - o componente só recebe content do tipo correto via registry
  const content = component.content as TimerContent | undefined;

  return (
    <CountdownTimer
      initialMinutes={content?.minutes || 15}
      initialSeconds={content?.seconds || 0}
      backgroundColor={content?.timerColor || design?.colors?.active || "#10B981"}
      textColor={content?.textColor || "#FFFFFF"}
      activeText={content?.activeText || "Oferta por tempo limitado"}
      finishedText={content?.finishedText || "Oferta finalizada"}
      onClick={() => {}} // Será preenchido pelo CheckoutPreview
      className="" // Será preenchido pelo CheckoutPreview
    />
  );
};
