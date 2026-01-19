/**
 * useCheckoutEditor - Hook para gerenciamento do editor de checkout
 * 
 * Responsabilidades:
 * - Estado de UI (viewMode, preview, tabs)
 * - Estado de seleção de componentes
 * - Estado de customização (design + components)
 * - Ações de CRUD de componentes
 * - Drag and Drop
 * 
 * Linha: ~230 (compliance RISE ARCHITECT PROTOCOL)
 */

import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

// Tipos extraídos para módulo
import type { 
  ViewMode, 
  CheckoutComponent, 
  CheckoutDesign, 
  CheckoutCustomization 
} from "@/types/checkoutEditor";
import type { CheckoutComponentContent } from "@/types/checkout-components.types";
import { isValidComponentType } from "@/types/checkout-components.types";
import type { CheckoutComponentType } from "@/types/checkout-components.types";
export type { ViewMode, CheckoutComponent, CheckoutDesign, CheckoutCustomization };

// Estado inicial extraído para módulo
import { DEFAULT_CHECKOUT_DESIGN } from "./checkout/defaultCheckoutDesign";

// ============================================================================
// HOOK
// ============================================================================

export const useCheckoutEditor = () => {
  // Estados de UI
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"components" | "rows" | "settings">("components");
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Estados de Seleção
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // Estado Principal
  const [customization, setCustomization] = useState<CheckoutCustomization>(DEFAULT_CHECKOUT_DESIGN);
  
  // Controle de Alterações
  const [isDirty, setIsDirty] = useState(false);
  const [lastLocalRev, setLastLocalRev] = useState<number>(Date.now());

  const touch = useCallback(() => {
    setIsDirty(true);
    setLastLocalRev(Date.now());
  }, []);

  // Helper: Obter dados do componente selecionado
  const getSelectedComponentData = useCallback(() => {
    if (!selectedComponent) return null;
    const top = customization.topComponents.find((c) => c.id === selectedComponent);
    if (top) return top;
    const bottom = customization.bottomComponents.find((c) => c.id === selectedComponent);
    if (bottom) return bottom;
    return null;
  }, [selectedComponent, customization]);

  // --- AÇÕES ---

  const handleUpdateDesign = useCallback((design: CheckoutDesign) => {
    setCustomization((prev) => ({ ...prev, design }));
    touch();
  }, [touch]);

  const handleUpdateComponent = useCallback((componentId: string, partialContent: Partial<CheckoutComponentContent>) => {
    setCustomization((prev) => {
      let found = false;
      const updateList = (list: CheckoutComponent[]) => list.map(c => {
        if (c.id === componentId) { found = true; return { ...c, content: { ...c.content, ...partialContent } }; }
        return c;
      });

      const newTop = updateList(prev.topComponents);
      if (found) { touch(); return { ...prev, topComponents: newTop }; }

      const newBottom = updateList(prev.bottomComponents);
      if (found) { touch(); return { ...prev, bottomComponents: newBottom }; }
      
      return prev;
    });
  }, [touch]);

  const handleRemoveComponent = useCallback((componentId: string) => {
    setCustomization((prev) => {
      const filter = (list: CheckoutComponent[]) => list.filter(c => c.id !== componentId);
      return { ...prev, topComponents: filter(prev.topComponents), bottomComponents: filter(prev.bottomComponents) };
    });
    if (selectedComponent === componentId) setSelectedComponent(null);
    touch();
  }, [selectedComponent, touch]);

  const handleDuplicateComponent = useCallback((componentId: string) => {
    setCustomization((prev) => {
      const clone = (c: CheckoutComponent) => ({ 
        ...c, 
        id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
      });
      
      const topIdx = prev.topComponents.findIndex(c => c.id === componentId);
      if (topIdx >= 0) {
        const newArr = [...prev.topComponents];
        newArr.splice(topIdx + 1, 0, clone(prev.topComponents[topIdx]));
        return { ...prev, topComponents: newArr };
      }

      const botIdx = prev.bottomComponents.findIndex(c => c.id === componentId);
      if (botIdx >= 0) {
        const newArr = [...prev.bottomComponents];
        newArr.splice(botIdx + 1, 0, clone(prev.bottomComponents[botIdx]));
        return { ...prev, bottomComponents: newArr };
      }

      return prev;
    });
    touch();
  }, [touch]);

  const handleMoveComponent = useCallback((componentId: string, direction: 'up' | 'down') => {
    setCustomization(prev => {
      const move = (list: CheckoutComponent[]) => {
        const idx = list.findIndex(c => c.id === componentId);
        if (idx === -1) return list;
        const newArr = [...list];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx >= 0 && swapIdx < newArr.length) {
          [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
        }
        return newArr;
      };

      return { ...prev, topComponents: move(prev.topComponents), bottomComponents: move(prev.bottomComponents) };
    });
    touch();
  }, [touch]);

  // --- DRAG AND DROP ---

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const dropZone = over.id as string;
    const isExisting = activeIdStr.startsWith("component-");

    // Gerar novo componente FORA do setState para ter ID estável
    let newComponentId: string | null = null;
    let newComponent: CheckoutComponent | null = null;

    if (!isExisting) {
      newComponentId = `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Use type guard for valid component types
      const componentType: CheckoutComponentType = isValidComponentType(activeIdStr) 
        ? activeIdStr 
        : 'timer';
      
      newComponent = {
        id: newComponentId,
        type: componentType,
        content: activeIdStr === 'timer' ? { 
          minutes: 15, seconds: 0, timerColor: "#EF4444", textColor: "#FFFFFF", 
          activeText: "Oferta por tempo limitado", finishedText: "Oferta finalizada", fixedTop: false 
        } : {}
      };
    }

    setCustomization((prev) => {
      let newState = { ...prev };
      let componentToMove: CheckoutComponent | null = newComponent;

      // 1. Remover da origem se for componente existente
      if (isExisting) {
        const topIdx = prev.topComponents.findIndex(c => c.id === activeIdStr);
        if (topIdx >= 0) {
          componentToMove = prev.topComponents[topIdx];
          newState.topComponents = prev.topComponents.filter(c => c.id !== activeIdStr);
        }
        if (!componentToMove) {
          const botIdx = prev.bottomComponents.findIndex(c => c.id === activeIdStr);
          if (botIdx >= 0) {
            componentToMove = prev.bottomComponents[botIdx];
            newState.bottomComponents = prev.bottomComponents.filter(c => c.id !== activeIdStr);
          }
        }
      }

      if (!componentToMove) return prev;

      // 2. Adicionar ao destino
      if (dropZone === "top-drop-zone") {
        newState.topComponents = [...newState.topComponents, componentToMove];
      } else if (dropZone === "bottom-drop-zone") {
        newState.bottomComponents = [...newState.bottomComponents, componentToMove];
      }
      
      return newState;
    });
    
    touch();
    
    // Selecionar automaticamente componente novo após drop
    if (newComponentId) {
      setSelectedComponent(newComponentId);
    }

  }, [touch]);

  return {
    // State Access
    customization,
    setCustomization,
    viewMode,
    setViewMode,
    isPreviewMode,
    setIsPreviewMode,
    activeTab,
    setActiveTab,
    activeId,
    selectedComponent,
    setSelectedComponent,
    isDirty,
    setIsDirty,
    
    // Computed
    selectedComponentData: getSelectedComponentData(),

    // Action Handlers
    handleUpdateDesign,
    handleUpdateComponent,
    handleRemoveComponent,
    handleDuplicateComponent,
    handleMoveComponent,
    
    // Dnd Handlers
    handleDragStart,
    handleDragEnd,
    
    // Utils
    touch
  };
};
