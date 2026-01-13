import { ComponentData } from "../../types";
import { Testimonial } from "@/features/checkout-builder/components";
import type { TestimonialContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";

interface TestimonialViewProps {
  component: ComponentData;
  design?: CheckoutDesign;
}

export const TestimonialView = ({ component, design }: TestimonialViewProps) => {
  // Type assertion segura - o componente só recebe content do tipo correto via registry
  const content = component.content as TestimonialContent | undefined;

  return (
    <Testimonial
      testimonialText={content?.testimonialText || "Depoimento do cliente aqui"}
      authorName={content?.authorName || "Nome do Cliente"}
      authorImage={content?.authorImage}
      backgroundColor={design?.colors?.formBackground || "#F9FAFB"}
      textColor={design?.colors?.primaryText || "#000000"}
      authorColor={design?.colors?.secondaryText || "#6B7280"}
    />
  );
};
