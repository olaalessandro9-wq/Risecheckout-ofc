import { BuilderComponentConfig } from "../../types";
import { VideoEditor } from "./VideoEditor";
import { VideoView } from "./VideoView";
import { VideoIcon } from "@/components/icons";

export interface VideoContent {
  videoType: "youtube" | "vimeo" | "custom";
  videoUrl: string;
}

export const VideoConfig: BuilderComponentConfig<VideoContent> = {
  label: "Vídeo",
  icon: VideoIcon,
  view: VideoView,
  editor: VideoEditor,
  defaults: {
    videoType: "youtube",
    videoUrl: "",
  },
};
