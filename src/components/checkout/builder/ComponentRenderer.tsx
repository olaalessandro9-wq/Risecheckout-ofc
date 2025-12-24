import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CheckoutComponent, CheckoutCustomization } from "@/types/checkout";
import { getComponentConfig } from "./registry";

interface ComponentRendererProps {
  component: CheckoutComponent;
  isSelected: boolean;
  onClick: () => void;
  customization: CheckoutCustomization;
  isPreviewMode?: boolean;
  isDraggable?: boolean; // ✅ Nova prop para controlar o comportamento de drag
}

export const ComponentRenderer = memo(({
  component, 
  isSelected, 
  onClick,
  customization,
  isPreviewMode = false,
  isDraggable = true, // ✅ Por padrão, componentes são arrastáveis (comportamento original)
}: ComponentRendererProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: component.id,
    disabled: isPreviewMode || !isDraggable, // ✅ Desativa drag se isPreviewMode OU se isDraggable for false
  });

  // ✅ Ajusta o cursor baseado no contexto
  const cursorClass = isPreviewMode ? '' : (isDraggable ? 'cursor-move' : 'cursor-pointer');
  
  const baseClasses = isPreviewMode ? '' : `${cursorClass} transition-all ${
    isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:ring-1 hover:ring-primary/50"
  } ${isDragging ? "opacity-50" : ""}`;

  const renderContent = () => {
    // Tenta usar o Registry Pattern primeiro
    const config = getComponentConfig(component.type);
    
    if (config) {
      const View = config.view;
      return (
        <div 
          key={component.id}
          className={baseClasses}
          onClick={onClick}
        >
          <View component={component} design={customization.design} />
        </div>
      );
    }

    // Se o componente não está no registry, não renderiza
    return null;
  };

  return (
    <div 
      ref={setNodeRef} 
      {...attributes} 
      {...(isDraggable ? listeners : {})} // ✅ Só aplica listeners se for arrastável
    >
      {renderContent()}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada para evitar re-renders desnecessários
  return (
    prevProps.component === nextProps.component &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isPreviewMode === nextProps.isPreviewMode &&
    prevProps.isDraggable === nextProps.isDraggable && // ✅ Inclui isDraggable na comparação
    prevProps.customization.design === nextProps.customization.design
  );
});

ComponentRenderer.displayName = "ComponentRenderer";
