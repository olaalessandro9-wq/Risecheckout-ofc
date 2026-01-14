/**
 * Legacy Component Editor - Tipos Compartilhados
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import type { CheckoutComponent } from "@/types/checkoutEditor";
import type { 
  TextContent, 
  ImageContent, 
  AdvantageContent, 
  SealContent, 
  TimerContent, 
  TestimonialContent, 
  VideoContent 
} from "@/types/checkout-components.types";

export interface LegacyEditorProps {
  component: CheckoutComponent;
  onUpdate: (id: string, content: Record<string, unknown>) => void;
}

export interface EditorComponentProps<T = Record<string, unknown>> {
  content: T | undefined;
  handleChange: (field: string, value: unknown) => void;
  handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

// Re-export content types for convenience
export type {
  TextContent,
  ImageContent,
  AdvantageContent,
  SealContent,
  TimerContent,
  TestimonialContent,
  VideoContent,
};
