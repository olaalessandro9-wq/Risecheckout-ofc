import { ReactNode, ComponentType } from "react";

/**
 * Represents a checkout component data
 */
export interface ComponentData {
  id: string;
  type: string;
  content?: any;
}

/**
 * Checkout component from database (content optional)
 */
export interface CheckoutComponent {
  id?: string;
  type: string;
  content?: any;
}

/**
 * Configuração de um componente registrado no builder
 * @template T - Tipo do conteúdo específico do componente
 */
export interface BuilderComponentConfig<T = any> {
  /** Nome legível do componente (ex: "Texto", "Vídeo") */
  label: string;
  
  /** Ícone para a lista de seleção (opcional) - can be ReactNode or Component */
  icon?: ReactNode | ComponentType<any>;
  
  /** O componente visual que aparece no checkout (Preview) */
  view: React.ComponentType<{ 
    component: ComponentData; 
    design?: any 
  }>;
  
  /** O formulário de edição que aparece na sidebar */
  editor: React.ComponentType<{ 
    component: ComponentData; 
    onChange: (newContent: Partial<T>) => void; 
    design?: any 
  }>;
  
  /** Dados iniciais quando o componente é criado */
  defaults: T;
}
