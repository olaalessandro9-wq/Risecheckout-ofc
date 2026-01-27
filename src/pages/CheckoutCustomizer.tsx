/**
 * Checkout Customizer Page
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Persistence logic extracted to useCheckoutPersistence hook
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Monitor, Smartphone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutPreview } from "@/components/checkout/CheckoutPreview";
import { CheckoutCustomizationPanel } from "@/components/checkout/CheckoutCustomizationPanel";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useCheckoutEditor } from "@/hooks/useCheckoutEditor";
import { UnsavedChangesGuard } from "@/providers/UnsavedChangesGuard";
import { useCheckoutPersistence } from "./checkout-customizer/hooks/useCheckoutPersistence";

const CheckoutCustomizer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutId = searchParams.get("id");

  // Editor hook (UI state, drag-drop, component management)
  const editor = useCheckoutEditor();

  // Persistence hook (load/save)
  const { state: persistence, loadCheckoutData, handleSave } = useCheckoutPersistence({
    checkoutId,
    customization: editor.customization,
    setCustomization: editor.setCustomization,
    setIsDirty: editor.setIsDirty,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Initial load
  useEffect(() => {
    if (checkoutId) loadCheckoutData(checkoutId);
  }, [checkoutId, loadCheckoutData]);

  // Reload on window focus (if not dirty)
  useEffect(() => {
    const handleFocus = () => {
      if (checkoutId && !editor.isDirty) loadCheckoutData(checkoutId);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkoutId, editor.isDirty, loadCheckoutData]);

  return (
    <UnsavedChangesGuard isDirty={editor.isDirty}>
      <DndContext sensors={sensors} onDragStart={editor.handleDragStart} onDragEnd={editor.handleDragEnd}>
        <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-none border-b bg-card z-50">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold">Personalizar Checkout</h1>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={editor.viewMode === "desktop" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.setViewMode("desktop")}
                  >
                    <Monitor className="h-4 w-4 mr-2" /> Desktop
                  </Button>
                  <Button
                    variant={editor.viewMode === "mobile" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.setViewMode("mobile")}
                  >
                    <Smartphone className="h-4 w-4 mr-2" /> Mobile
                  </Button>
                </div>

                <Button variant="outline" onClick={() => editor.setIsPreviewMode(!editor.isPreviewMode)}>
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </Button>

                <Button onClick={handleSave} disabled={persistence.loading || persistence.isSaving}>
                  {persistence.loading || persistence.isSaving ? "Salvando..." : "Salvar"}
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
                productData={persistence.productData}
                orderBumps={persistence.orderBumps}
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
                  productId={persistence.productData?.id}
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
