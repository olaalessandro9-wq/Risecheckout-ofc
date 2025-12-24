import { BuilderComponentConfig } from "../../types";
import { OrderBumpEditor } from "./OrderBumpEditor";
import { OrderBumpView } from "./OrderBumpView";
import { Zap } from "lucide-react";

export interface OrderBumpContent {
  title: string;
  showImages: boolean;
  layout: "list" | "grid";
  highlightColor?: string;
  backgroundColor?: string;
}

export const OrderBumpConfig: BuilderComponentConfig<OrderBumpContent> = {
  label: "Order Bumps",
  icon: Zap,
  view: OrderBumpView,
  editor: OrderBumpEditor,
  defaults: {
    title: "Ofertas limitadas",
    showImages: true,
    layout: "list",
  },
};
