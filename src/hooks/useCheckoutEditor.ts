import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

// --- TIPOS ---

export type ViewMode = "desktop" | "mobile" | "public";

export interface CheckoutComponent {
  id: string;
  type: "text" | "image" | "advantage" | "seal" | "timer" | "testimonial" | "video";
  content?: any;
}

export interface CheckoutDesign {
  theme: string;
  font: string;
  colors: {
    background: string;
    primaryText: string;
    secondaryText: string;
    active: string;
    icon: string;
    formBackground: string;
    border: string;
    unselectedButton: { text: string; background: string; icon: string };
    selectedButton: { text: string; background: string; icon: string };
    box: { headerBg: string; headerPrimaryText: string; headerSecondaryText: string; bg: string; primaryText: string; secondaryText: string };
    unselectedBox: { headerBg: string; headerPrimaryText: string; headerSecondaryText: string; bg: string; primaryText: string; secondaryText: string };
    selectedBox: { headerBg: string; headerPrimaryText: string; headerSecondaryText: string; bg: string; primaryText: string; secondaryText: string };
    button: { background: string; text: string };
    orderSummary?: { background: string; titleText: string; productName: string; priceText: string; labelText: string; borderColor: string };
    footer?: { background: string; primaryText: string; secondaryText: string; border: string };
    securePurchase?: { headerBackground: string; headerText: string; cardBackground: string; primaryText: string; secondaryText: string; linkText: string };
    orderBump: { headerBackground: string; headerText: string; footerBackground: string; footerText: string; contentBackground: string; titleText: string; descriptionText: string; priceText: string; selectedHeaderBackground?: string; selectedHeaderText?: string; selectedFooterBackground?: string; selectedFooterText?: string };
    creditCardFields?: { textColor?: string; placeholderColor?: string; borderColor?: string; backgroundColor?: string; focusBorderColor?: string; focusTextColor?: string };
    personalDataFields?: { textColor?: string; placeholderColor?: string; borderColor?: string; backgroundColor?: string; focusBorderColor?: string; focusTextColor?: string };
    infoBox?: { background: string; border: string; text: string };
    inputBackground?: string;
    placeholder?: string;
    productPrice?: string;
  };
  backgroundImage?: { url?: string; fixed?: boolean; repeat?: boolean; expand?: boolean };
}

export interface CheckoutCustomization {
  design: CheckoutDesign;
  topComponents: CheckoutComponent[];
  bottomComponents: CheckoutComponent[];
}

// --- ESTADO INICIAL ---

const DEFAULT_DESIGN: CheckoutCustomization = {
    design: {
      theme: "custom",
      font: "Inter",
      colors: {
        background: "#FFFFFF",
        primaryText: "#000000",
        secondaryText: "#6B7280",
        active: "#10B981",
        icon: "#000000",
        formBackground: "#F9FAFB",
        border: "#E5E7EB",
        unselectedButton: { text: "#000000", background: "#FFFFFF", icon: "#000000" },
        selectedButton: { text: "#FFFFFF", background: "#10B981", icon: "#FFFFFF" },
        box: { headerBg: "#1A1A1A", headerPrimaryText: "#FFFFFF", headerSecondaryText: "#CCCCCC", bg: "#0A0A0A", primaryText: "#FFFFFF", secondaryText: "#CCCCCC" },
        unselectedBox: { headerBg: "#1A1A1A", headerPrimaryText: "#FFFFFF", headerSecondaryText: "#CCCCCC", bg: "#0A0A0A", primaryText: "#FFFFFF", secondaryText: "#CCCCCC" },
        selectedBox: { headerBg: "#10B981", headerPrimaryText: "#FFFFFF", headerSecondaryText: "#CCCCCC", bg: "#0A0A0A", primaryText: "#FFFFFF", secondaryText: "#CCCCCC" },
        button: { background: "#10B981", text: "#FFFFFF" },
        orderBump: {
          headerBackground: 'rgba(0,0,0,0.15)', headerText: '#10B981', footerBackground: 'rgba(0,0,0,0.15)', footerText: '#000000',
          contentBackground: '#F9FAFB', titleText: '#000000', descriptionText: '#6B7280', priceText: '#10B981',
        },
        creditCardFields: { textColor: '#000000', placeholderColor: '#999999', borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', focusBorderColor: '#10B981', focusTextColor: '#000000' },
      },
    },
    topComponents: [],
    bottomComponents: [],
};

// --- HOOK ---

export const useCheckoutEditor = () => {
  // Estados de UI
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"components" | "rows" | "settings">("components");
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Estados de Seleção
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // Estado Principal
  const [customization, setCustomization] = useState<CheckoutCustomization>(DEFAULT_DESIGN);
  
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
    console.log('🎨 [useCheckoutEditor] Updating design');
    setCustomization((prev) => ({ ...prev, design }));
    touch();
  }, [touch]);

  const handleUpdateComponent = useCallback((componentId: string, partialContent: any) => {
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
      return {
        ...prev,
        topComponents: filter(prev.topComponents),
        bottomComponents: filter(prev.bottomComponents),
      };
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
        
        // Check Top
        const topIdx = prev.topComponents.findIndex(c => c.id === componentId);
        if (topIdx >= 0) {
            const newArr = [...prev.topComponents];
            newArr.splice(topIdx + 1, 0, clone(prev.topComponents[topIdx]));
            return { ...prev, topComponents: newArr };
        }

        // Check Bottom
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

          return {
              ...prev,
              topComponents: move(prev.topComponents),
              bottomComponents: move(prev.bottomComponents),
          };
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
      newComponent = {
        id: newComponentId,
        type: activeIdStr as any,
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
         // Remove Top
         const topIdx = prev.topComponents.findIndex(c => c.id === activeIdStr);
         if (topIdx >= 0) {
             componentToMove = prev.topComponents[topIdx];
             newState.topComponents = prev.topComponents.filter(c => c.id !== activeIdStr);
         }
         // Remove Bottom
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
}
