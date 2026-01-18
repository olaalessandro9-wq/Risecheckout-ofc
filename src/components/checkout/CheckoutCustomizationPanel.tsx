import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckoutComponent, CheckoutDesign, CheckoutCustomization } from "@/types/checkoutEditor";
import type { CheckoutComponentContent } from "@/types/checkout-components.types";
import { ArrowLeft, Trash2, Columns, Columns2, Columns3, LayoutGrid, Copy, MoveUp, MoveDown } from "lucide-react";
import { SettingsManager } from "@/features/checkout-builder/settings";
import { TypeIcon, ImageIcon, CheckCircleIcon, AwardIcon, TimerIcon, QuoteIcon, VideoIcon } from "@/components/icons";
import { useDraggable } from "@dnd-kit/core";
import { getComponentConfig } from "./builder/registry";

// --- Interfaces ---
interface CheckoutCustomizationPanelProps {
  customization: CheckoutCustomization;
  selectedComponent: CheckoutComponent | null;
  onUpdateComponent: (componentId: string, content: Partial<CheckoutComponentContent>) => void;
  onRemoveComponent: (componentId: string) => void;
  onDuplicateComponent?: (componentId: string) => void;
  onMoveComponentUp?: (componentId: string) => void;
  onMoveComponentDown?: (componentId: string) => void;
  onUpdateDesign: (design: CheckoutDesign) => void;
  onBack: () => void;
  activeTab: "components" | "rows" | "settings";
  onActiveTabChange: (tab: "components" | "rows" | "settings") => void;
  viewMode: "desktop" | "mobile" | "public";
}

// --- Subcomponentes Estáticos (fora do componente principal) ---

// Container de Scroll Otimizado
const TabScrollArea = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div 
    className="absolute inset-0 overflow-y-auto overflow-x-hidden"
    style={{ overscrollBehavior: 'contain', touchAction: 'manipulation' }}
  >
    <div className={cn("p-6 space-y-6 min-h-full", className)}>
      {children}
    </div>
  </div>
);

// Item arrastável da biblioteca
const DraggableComponent = ({ type, icon, label }: { type: string; icon: React.ReactNode; label: string }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: type });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed cursor-grab active:cursor-grabbing transition-all",
        isDragging ? "opacity-50 scale-95" : "hover:border-primary hover:bg-primary/5"
      )}
    >
      {icon}
      <span className="text-sm mt-2">{label}</span>
    </div>
  );
};

// Componente para seleção de layout de linha
const RowLayoutOption = ({ 
  label, 
  icon: Icon, 
  onClick 
}: { 
  label: string; 
  icon: React.ElementType; 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
  >
    <Icon className="h-8 w-8 mb-2" />
    <span className="text-sm">{label}</span>
  </button>
);

// --- Componente Principal ---

export const CheckoutCustomizationPanel = ({
  customization,
  selectedComponent,
  onUpdateComponent,
  onRemoveComponent,
  onDuplicateComponent,
  onMoveComponentUp,
  onMoveComponentDown,
  onUpdateDesign,
  onBack,
  activeTab,
  onActiveTabChange,
  viewMode,
}: CheckoutCustomizationPanelProps) => {

  // Lógica de atualização de design (Simplificada e usando lodash-style path se necessário)
  const handleDesignUpdate = useCallback((field: string, value: unknown) => {
    // 1. Atualização completa do objeto design
    if (field === 'design') {
      onUpdateDesign(value as CheckoutDesign);
      return;
    }

    const newDesign = { ...customization.design };

    // 2. Atalhos para propriedades raiz
    if (field === 'design.theme') {
      newDesign.theme = value as string;
    } else if (field === 'design.font') {
      newDesign.font = value as string;
    } 
    // 3. Atualização profunda de cores (Nested Objects)
    else if (field.startsWith('design.colors.')) {
      // Ex: design.colors.button.background
      const path = field.replace('design.', '').split('.');
      let current: Record<string, unknown> = newDesign as unknown as Record<string, unknown>;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]] as Record<string, unknown>;
      }
      current[path[path.length - 1]] = value;
      
      // Ao editar uma cor manualmente, o tema vira 'custom'
      newDesign.theme = 'custom';
    }

    onUpdateDesign(newDesign);
  }, [customization.design, onUpdateDesign]);

  // --- Renderização do Modo de Edição (Se um componente estiver selecionado) ---
  if (selectedComponent) {
    const registryConfig = getComponentConfig(selectedComponent.type);
    
    // Título dinâmico
    const componentLabel = registryConfig ? registryConfig.label : selectedComponent.type;

    return (
      <div className="h-full flex flex-col bg-background">
        <div className="flex-none px-4 py-4 border-b flex items-center gap-2 bg-card/50">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm capitalize">Editar {componentLabel}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {registryConfig ? (
            <registryConfig.editor 
              component={selectedComponent}
              onChange={(newContent: Partial<CheckoutComponentContent>) => onUpdateComponent(selectedComponent.id, newContent)}
              design={customization.design}
            />
          ) : (
            <div className="text-muted-foreground text-sm">
              Editor não disponível para este componente.
            </div>
          )}
        </div>

        {/* Barra de Ações Fixa no Rodapé */}
        <div className="flex-none p-4 border-t bg-card grid grid-cols-2 gap-2">
          {onMoveComponentUp && (
            <Button variant="outline" size="sm" onClick={() => onMoveComponentUp(selectedComponent.id)}>
              <MoveUp className="h-4 w-4 mr-2" /> Subir
            </Button>
          )}
          {onMoveComponentDown && (
            <Button variant="outline" size="sm" onClick={() => onMoveComponentDown(selectedComponent.id)}>
              <MoveDown className="h-4 w-4 mr-2" /> Descer
            </Button>
          )}
          {onDuplicateComponent && (
            <Button variant="outline" size="sm" onClick={() => onDuplicateComponent(selectedComponent.id)}>
              <Copy className="h-4 w-4 mr-2" /> Duplicar
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => onRemoveComponent(selectedComponent.id)}>
            <Trash2 className="h-4 w-4 mr-2" /> Excluir
          </Button>
        </div>
      </div>
    );
  }

  // --- Renderização Principal (Abas) ---
  return (
    <div className="h-full flex flex-col bg-card">
      <Tabs value={activeTab} onValueChange={(v) => onActiveTabChange(v as "components" | "rows" | "settings")} className="h-full flex flex-col">
        {/* Header das Abas */}
        <div className="flex-none border-b bg-background z-10">
          <TabsList className="w-full grid grid-cols-2 rounded-none h-12 p-0 bg-transparent">
            <TabsTrigger value="components" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Componentes
            </TabsTrigger>
            <TabsTrigger value="settings" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Design
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 relative bg-muted/5 w-full">
          
          <TabsContent value="components" className="h-full m-0 p-0 data-[state=inactive]:hidden">
            <TabScrollArea>
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Componentes Disponíveis</h3>
                <p className="text-xs text-muted-foreground">Arraste para adicionar ao checkout</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DraggableComponent type="text" icon={<TypeIcon size={24} />} label="Texto" />
                <DraggableComponent type="image" icon={<ImageIcon size={24} />} label="Imagem" />
                <DraggableComponent type="advantage" icon={<CheckCircleIcon size={24} />} label="Vantagem" />
                <DraggableComponent type="seal" icon={<AwardIcon size={24} />} label="Selo" />
                <DraggableComponent type="timer" icon={<TimerIcon size={24} />} label="Cronômetro" />
                <DraggableComponent type="testimonial" icon={<QuoteIcon size={24} />} label="Depoimento" />
                <DraggableComponent type="video" icon={<VideoIcon size={24} />} label="Vídeo" />
              </div>
            </TabScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="h-full m-0 p-0 data-[state=inactive]:hidden">
            <TabScrollArea>
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Aparência Global</h3>
                <p className="text-xs text-muted-foreground">Personalize cores e fontes do checkout</p>
              </div>
              <SettingsManager 
                customization={customization}
                onUpdate={handleDesignUpdate}
              />
            </TabScrollArea>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
};
