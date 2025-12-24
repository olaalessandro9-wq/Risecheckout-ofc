import { BuilderComponentConfig } from "../../types";
import { ImageEditor } from "./ImageEditor";
import { ImageView } from "./ImageView";
import { ImageIcon } from "@/components/icons";

export interface ImageContent {
  imageUrl?: string;
  url?: string; // Suporte legado
  alt?: string;
  alignment?: "left" | "center" | "right";
  maxWidth?: number;
  roundedImage?: boolean;
  _uploading?: boolean;
  _preview?: boolean;
  _uploadError?: boolean;
  _fileName?: string;
  _storage_path?: string;
  _old_storage_path?: string;
}

export const ImageConfig: BuilderComponentConfig<ImageContent> = {
  label: "Imagem",
  icon: ImageIcon,
  view: ImageView,
  editor: ImageEditor,
  defaults: {
    alignment: "center",
    maxWidth: 720,
    roundedImage: true,
    alt: "Imagem do checkout",
  },
};
