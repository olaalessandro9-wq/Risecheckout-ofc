import { BuilderComponentConfig } from "../../types";
import { TestimonialEditor } from "./TestimonialEditor";
import { TestimonialView } from "./TestimonialView";
import { MessageSquare } from "lucide-react";

export interface TestimonialContent {
  testimonialText: string;
  authorName: string;
  authorImage?: string;
}

export const TestimonialConfig: BuilderComponentConfig<TestimonialContent> = {
  label: "Depoimento",
  icon: MessageSquare,
  view: TestimonialView,
  editor: TestimonialEditor,
  defaults: {
    testimonialText: "Depoimento do cliente aqui",
    authorName: "Nome do Cliente",
    authorImage: "",
  },
};
