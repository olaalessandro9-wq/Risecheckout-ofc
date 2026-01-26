/**
 * Tipos do Checkout Builder
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */
import { ReactNode, ComponentType } from "react";
import type { CheckoutComponentContent, CheckoutComponentType } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";

/**
 * Content type for builder components - Zero any, tipagem centralizada
 */
export type BuilderComponentContent = CheckoutComponentContent;

/**
 * Represents a checkout component data
 */
export interface ComponentData {
  id: string;
  type: CheckoutComponentType;
  content?: BuilderComponentContent;
}

/**
 * Checkout component from database (content optional)
 */
export interface CheckoutComponent {
  id?: string;
  type: CheckoutComponentType;
  content?: BuilderComponentContent;
}

/**
 * Design type for builder components
 * Re-exported from checkoutEditor for consistency
 */
export type { CheckoutDesign as BuilderDesign } from "@/types/checkoutEditor";

/**
 * Configuração de um componente registrado no builder
 * @template T - Tipo do conteúdo específico do componente
 */
export interface BuilderComponentConfig<T extends BuilderComponentContent = BuilderComponentContent> {
  /** Nome legível do componente (ex: "Texto", "Vídeo") */
  label: string;
  
  /** Ícone para a lista de seleção (opcional) - can be ReactNode or Component */
  icon?: ReactNode | ComponentType<Record<string, unknown>>;
  
  /** O componente visual que aparece no checkout (Preview) */
  view: React.ComponentType<{ 
    component: ComponentData; 
    design?: CheckoutDesign;
  }>;
  
  /** O formulário de edição que aparece na sidebar */
  editor: React.ComponentType<{ 
    component: ComponentData; 
    onChange: (newContent: Partial<T>) => void; 
    design?: CheckoutDesign;
  }>;
  
  /** Dados iniciais quando o componente é criado */
  defaults: T;
}
