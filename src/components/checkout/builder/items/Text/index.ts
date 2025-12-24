import { BuilderComponentConfig } from "../../types";
import { TextEditor } from "./TextEditor";
import { TextView } from "./TextView";
import { TypeIcon } from "@/components/icons";

export interface TextContent {
  text: string;
  fontSize: number;
  color: string;
  alignment: "left" | "center" | "right";
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

export const TextConfig: BuilderComponentConfig<TextContent> = {
  label: "Texto",
  icon: TypeIcon,
  view: TextView,
  editor: TextEditor,
  defaults: {
    text: "Edite este texto",
    fontSize: 16,
    color: "#000000",
    alignment: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 8,
  },
};
