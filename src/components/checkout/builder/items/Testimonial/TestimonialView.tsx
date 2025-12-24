import { ComponentData } from "../../types";
import { Testimonial } from "@/features/checkout-builder/components";

interface TestimonialViewProps {
  component: ComponentData;
  design?: any;
}

export const TestimonialView = ({ component, design }: TestimonialViewProps) => {
  const { content } = component;

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
