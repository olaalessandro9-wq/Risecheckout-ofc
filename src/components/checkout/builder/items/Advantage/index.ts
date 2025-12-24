import { BuilderComponentConfig } from "../../types";
import { AdvantageView } from "./AdvantageView";
import { CheckCircle } from "lucide-react";

export interface AdvantageContent {
  title: string;
  description: string;
  icon: string;
  primaryColor: string;
  titleColor: string;
  darkMode: boolean;
  verticalMode: boolean;
  size: 'small' | 'original' | 'large';
}

export const AdvantageConfig: BuilderComponentConfig<AdvantageContent> = {
  label: "Vantagem",
  icon: CheckCircle,
  view: AdvantageView,
  editor: () => null, // Editor será criado depois se necessário
  defaults: {
    title: "Vantagem",
    description: "Descrição da vantagem",
    icon: "check",
    primaryColor: "#1DB88E",
    titleColor: "#000000",
    darkMode: false,
    verticalMode: false,
    size: "original",
  },
};
