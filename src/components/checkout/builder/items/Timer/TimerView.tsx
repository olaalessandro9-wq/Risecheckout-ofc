import { ComponentData } from "../../types";
import { CountdownTimer } from "@/features/checkout-builder/components";

interface TimerViewProps {
  component: ComponentData;
  design?: any;
}

export const TimerView = ({ component, design }: TimerViewProps) => {
  const { content } = component;

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
