import { BuilderComponentConfig } from "../../types";
import { TimerEditor } from "./TimerEditor";
import { TimerView } from "./TimerView";
import { TimerIcon } from "@/components/icons";

export interface TimerContent {
  minutes: number;
  seconds: number;
  timerColor: string;
  textColor: string;
  activeText: string;
  finishedText: string;
  fixedTop: boolean;
}

export const TimerConfig: BuilderComponentConfig<TimerContent> = {
  label: "Timer",
  icon: TimerIcon,
  view: TimerView,
  editor: TimerEditor,
  defaults: {
    minutes: 15,
    seconds: 0,
    timerColor: "#10B981",
    textColor: "#FFFFFF",
    activeText: "Oferta por tempo limitado",
    finishedText: "Oferta finalizada",
    fixedTop: false,
  },
};
