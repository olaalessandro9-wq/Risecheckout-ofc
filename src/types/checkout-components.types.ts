/**
 * Tipos Type-Safe para Componentes do Checkout Builder
 * RISE Protocol V2: Zero any, Zero dívida técnica
 * 
 * Este arquivo centraliza todos os tipos de conteúdo dos componentes
 * do builder para garantir tipagem completa e eliminar `any`.
 */

// ============================================================================
// CONTENT TYPES - Definições individuais de cada componente
// ============================================================================

export interface VideoContent {
  videoType: "youtube" | "vimeo" | "custom" | "other";
  videoUrl: string;
}

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

export interface TimerContent {
  minutes: number;
  seconds: number;
  timerColor: string;
  textColor: string;
  activeText: string;
  finishedText: string;
  fixedTop: boolean;
}

export interface SealContent {
  topText: string;
  title: string;
  subtitle: string;
  primaryColor: string;
  titleColor: string;
  alignment: "left" | "center" | "right";
  darkMode: boolean;
}

export interface AdvantageContent {
  title: string;
  description: string;
  icon: string;
  primaryColor: string;
  titleColor: string;
  darkMode: boolean;
  verticalMode: boolean;
  size: "small" | "original" | "large";
}

export interface TestimonialContent {
  testimonialText: string;
  authorName: string;
  authorImage?: string;
}

export interface OrderBumpContent {
  title: string;
  showImages: boolean;
  layout: "list" | "grid";
  highlightColor?: string;
  backgroundColor?: string;
}

// ============================================================================
// UNION TYPE - Tipo discriminado de todos os conteúdos
// ============================================================================

/**
 * Union type de todos os conteúdos de componentes do checkout builder.
 * Substitui o `[key: string]: any` anterior por tipagem forte.
 */
export type CheckoutComponentContent =
  | VideoContent
  | TextContent
  | ImageContent
  | TimerContent
  | SealContent
  | AdvantageContent
  | TestimonialContent
  | OrderBumpContent;

// ============================================================================
// TYPE MAP - Mapeamento tipo → content para acesso type-safe
// ============================================================================

/**
 * Mapeamento entre o tipo do componente e seu conteúdo.
 * Permite acesso type-safe via: ComponentContentMap["video"] → VideoContent
 */
export interface ComponentContentMap {
  video: VideoContent;
  text: TextContent;
  image: ImageContent;
  timer: TimerContent;
  seal: SealContent;
  advantage: AdvantageContent;
  testimonial: TestimonialContent;
  orderBump: OrderBumpContent;
}

/**
 * Tipos de componentes suportados pelo builder
 */
export type CheckoutComponentType = keyof ComponentContentMap;

// ============================================================================
// HELPER TYPES - Utilitários para trabalhar com componentes
// ============================================================================

/**
 * Extrai o tipo de conteúdo baseado no tipo do componente
 */
export type ContentForType<T extends CheckoutComponentType> = ComponentContentMap[T];

/**
 * Verifica se um tipo é válido
 */
export function isValidComponentType(type: string): type is CheckoutComponentType {
  return ["video", "text", "image", "timer", "seal", "advantage", "testimonial", "orderBump"].includes(type);
}
