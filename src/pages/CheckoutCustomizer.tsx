/**
 * Checkout Customizer Page
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Now uses XState state machine via useCheckoutEditorState (Dual-Layout)
 */

import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, Smartphone, Eye, Copy, Link, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { CheckoutPreview } from "@/components/checkout/CheckoutPreview";
import { CheckoutCustomizationPanel } from "@/components/checkout/CheckoutCustomizationPanel";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { UnsavedChangesGuard } from "@/providers/UnsavedChangesGuard";
import { useCheckoutEditorState } from "./checkout-customizer/hooks/useCheckoutEditorState";

const CheckoutCustomizer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutId = searchParams.get("id");

  const editor = useCheckoutEditorState(checkoutId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  return (
    <UnsavedChangesGuard isDirty={editor.isDirty}>
      <DndContext sensors={sensors} onDragStart={editor.handleDragStart} onDragEnd={editor.handleDragEnd}>
        <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
          {/* Header - 3 zonas: Esquerda | Centro | Direita */}
          <div className="flex-none border-b bg-card z-50">
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              {/* ESQUERDA: Voltar + Título + Toggle Desktop/Mobile */}
              <div className="flex items-center gap-3 min-w-0">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0">
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <h1 className="text-lg font-semibold truncate">Personalizar Checkout</h1>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1 border rounded-lg p-1 flex-shrink-0">
                  <Button
                    variant={editor.activeViewport === "desktop" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.setViewMode("desktop")}
                  >
                    <Monitor className="h-4 w-4 mr-1" /> Desktop
                  </Button>
                  <Button
                    variant={editor.activeViewport === "mobile" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.setViewMode("mobile")}
                  >
                    <Smartphone className="h-4 w-4 mr-1" /> Mobile
                  </Button>
                </div>
              </div>

              {/* CENTRO: Sync/Copy (só aparece quando mobile ativo) */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {editor.activeViewport === "mobile" && (
                  <TooltipProvider delayDuration={300}>
                    <div className="flex items-center gap-2">
                      {/* Botão Sincronizado / Independente */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editor.setMobileSynced(!editor.isMobileSynced)}
                            className={editor.isMobileSynced ? "border-primary/50 text-primary" : "text-muted-foreground"}
                          >
                            {editor.isMobileSynced ? (
                              <>
                                <Link className="h-4 w-4 mr-1" />
                                Sincronizado
                              </>
                            ) : (
                              <>
                                <Unlink className="h-4 w-4 mr-1" />
                                Independente
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {editor.isMobileSynced
                            ? "Mobile espelha o Desktop automaticamente. Clique para tornar independente."
                            : "Mobile tem componentes independentes. Clique para sincronizar com Desktop."}
                        </TooltipContent>
                      </Tooltip>

                      {/* Botão Copiar Desktop (só quando sync OFF) */}
                      {!editor.isMobileSynced && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={editor.copyDesktopToMobile}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copiar Desktop
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Copia os componentes atuais do Desktop para o Mobile (ação única).
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                )}
              </div>

              {/* DIREITA: Preview + Salvar */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => editor.setIsPreviewMode(!editor.isPreviewMode)}>
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>

                <Button size="sm" onClick={editor.handleSave} disabled={editor.isLoading || editor.isSaving || !editor.isDirty}>
                  {editor.isLoading || editor.isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30">
              <CheckoutPreview
                customization={editor.customization}
                viewMode={editor.viewMode}
                selectedComponentId={editor.selectedComponent}
                onSelectComponent={editor.setSelectedComponent}
                isPreviewMode={editor.isPreviewMode}
                productData={editor.productData}
                orderBumps={editor.orderBumps}
              />
            </div>

            {!editor.isPreviewMode && (
              <aside className="flex-none w-96 border-l bg-card flex flex-col overflow-hidden">
              <CheckoutCustomizationPanel
                  customization={editor.customization}
                  selectedComponent={editor.selectedComponentData}
                  onUpdateComponent={editor.handleUpdateComponent}
                  onRemoveComponent={editor.handleRemoveComponent}
                  onDuplicateComponent={editor.handleDuplicateComponent}
                  onMoveComponentUp={(id) => editor.handleMoveComponent(id, 'up')}
                  onMoveComponentDown={(id) => editor.handleMoveComponent(id, 'down')}
                  onUpdateDesign={editor.handleUpdateDesign}
                  onBack={() => editor.setSelectedComponent(null)}
                  activeTab={editor.activeTab}
                  onActiveTabChange={editor.setActiveTab}
                  viewMode={editor.viewMode}
                  productId={editor.productData?.id}
                />
              </aside>
            )}
          </div>
        </div>

        <DragOverlay>
          {editor.activeId ? (
            <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 cursor-grabbing">
              <p className="text-sm font-medium capitalize">{editor.activeId}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </UnsavedChangesGuard>
  );
};

export default CheckoutCustomizer;
