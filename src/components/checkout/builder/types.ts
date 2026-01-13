import { ReactNode, ComponentType } from "react";

/**
 * Content type for builder components - allows dynamic properties
 * Each component has its own specific content type extending this base
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BuilderComponentContent = Record<string, any>;

/**
 * Represents a checkout component data
 */
export interface ComponentData {
  id: string;
  type: string;
  content?: BuilderComponentContent;
}

/**
 * Checkout component from database (content optional)
 */
export interface CheckoutComponent {
  id?: string;
  type: string;
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
export interface BuilderComponentConfig<T = BuilderComponentContent> {
  /** Nome legível do componente (ex: "Texto", "Vídeo") */
  label: string;
  
  /** Ícone para a lista de seleção (opcional) - can be ReactNode or Component */
  icon?: ReactNode | ComponentType<Record<string, unknown>>;
  
  /** O componente visual que aparece no checkout (Preview) */
  view: React.ComponentType<{ 
    component: ComponentData; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    design?: any; // Design varia entre checkouts, precisa ser flexível
  }>;
  
  /** O formulário de edição que aparece na sidebar */
  editor: React.ComponentType<{ 
    component: ComponentData; 
    onChange: (newContent: Partial<T>) => void; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    design?: any; // Design varia entre checkouts, precisa ser flexível
  }>;
  
  /** Dados iniciais quando o componente é criado */
  defaults: T;
}
