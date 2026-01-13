import { ComponentData } from "../../types";
import { VideoEmbed } from "@/features/checkout-builder/components";
import type { VideoContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";

interface VideoViewProps {
  component: ComponentData;
  design?: CheckoutDesign;
}

export const VideoView = ({ component, design }: VideoViewProps) => {
  // Type assertion segura - o componente só recebe content do tipo correto via registry
  const content = component.content as VideoContent | undefined;

  return (
    <VideoEmbed
      videoUrl={content?.videoUrl || ""}
      videoType={content?.videoType || "youtube"}
      backgroundColor={design?.colors?.formBackground || "#F9FAFB"}
      placeholderColor={design?.colors?.secondaryText || "#9CA3AF"}
    />
  );
};
