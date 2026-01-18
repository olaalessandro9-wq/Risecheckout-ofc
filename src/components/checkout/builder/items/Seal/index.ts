import { BuilderComponentConfig } from "../../types";
import { SealView } from "./SealView";
import { SealEditor } from "./SealEditor";
import { Award } from "lucide-react";

export interface SealContent {
  topText: string;
  title: string;
  subtitle: string;
  primaryColor: string;
  titleColor: string;
  alignment: 'left' | 'center' | 'right';
  darkMode: boolean;
}

export const SealConfig: BuilderComponentConfig<SealContent> = {
  label: "Selo",
  icon: Award,
  view: SealView,
  editor: SealEditor,
  defaults: {
    topText: "7",
    title: "Privacidade",
    subtitle: "Garantida",
    primaryColor: "#4F9EF8",
    titleColor: "#FFFFFF",
    alignment: "center",
    darkMode: false,
  },
};
