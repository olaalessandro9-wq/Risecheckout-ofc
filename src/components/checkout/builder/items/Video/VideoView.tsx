import { ComponentData } from "../../types";
import { VideoEmbed } from "@/features/checkout-builder/components";

interface VideoViewProps {
  component: ComponentData;
  design?: any;
}

export const VideoView = ({ component, design }: VideoViewProps) => {
  const { content } = component;

  return (
    <VideoEmbed
      videoUrl={content?.videoUrl || ""}
      videoType={content?.videoType || "youtube"}
      backgroundColor={design?.colors?.formBackground || "#F9FAFB"}
      placeholderColor={design?.colors?.secondaryText || "#9CA3AF"}
    />
  );
};
