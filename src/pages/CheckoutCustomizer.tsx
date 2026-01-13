import { useState, useEffect } from "react";
import { parseJsonSafely } from "@/lib/utils"; 
import { hasPendingUploads, waitForUploadsToFinish, getAllComponentsFromCustomization } from "@/lib/uploadUtils";
import { normalizeDesign } from "@/lib/checkout/normalizeDesign";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Monitor, Smartphone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutPreview } from "@/components/checkout/CheckoutPreview";
import { CheckoutCustomizationPanel } from "@/components/checkout/CheckoutCustomizationPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useCheckoutEditor, CheckoutCustomization } from "@/hooks/useCheckoutEditor";
import { UnsavedChangesGuard } from "@/providers/UnsavedChangesGuard";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";

const CheckoutCustomizer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutId = searchParams.get("id");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados de dados externos (Produtos/Ofertas)
  const [productData, setProductData] = useState<any>(null);
  const [orderBumps, setOrderBumps] = useState<any[]>([]);
  const [productOffers, setProductOffers] = useState<any[]>([]);
  const [currentLinks, setCurrentLinks] = useState<any[]>([]);

  // 🚀 HOOK DO EDITOR: Centraliza toda a lógica complexa
  const editor = useCheckoutEditor();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // --- Persistence Logic (Load/Save) ---
  
  const loadCheckoutData = async (id: string) => {
    setLoading(true);
    try {
      const sessionToken = getProducerSessionToken();
      if (!sessionToken) {
        toast({ title: "Sessão expirada", description: "Faça login novamente", variant: "destructive" });
        navigate("/login");
        return;
      }

      // Use Edge Function to load all data in one call
      const { data: response, error } = await supabase.functions.invoke('checkout-management', {
        body: { action: 'get-editor-data', checkoutId: id },
        headers: { 'x-producer-session-token': sessionToken }
      });

      if (error) throw error;
      if (!response.success) throw new Error(response.error || 'Erro ao carregar dados');

      const { checkout, product, offers, orderBumps } = response.data;
      console.log('Checkout carregado via Edge Function:', checkout);

      // Extract offer price from checkout_links
      const checkoutLink = checkout?.checkout_links?.[0];
      const paymentLink = checkoutLink?.payment_links;
      const offer = paymentLink?.offers;
      const offerPrice = offer?.price || product?.price || 0;
      
      // Use normalizeDesign utility
      const themePreset = normalizeDesign(checkout);
      
      // Convert ThemePreset to CheckoutDesign
      const designWithFallbacks = {
        theme: checkout.theme || 'light',
        font: checkout.font || 'Inter',
        colors: themePreset.colors,
        backgroundImage: parseJsonSafely(checkout.design, {})?.backgroundImage,
      };
      
      const loadedCustomization: CheckoutCustomization = {
         design: designWithFallbacks,
         topComponents: parseJsonSafely(checkout.top_components, []),
         bottomComponents: parseJsonSafely(checkout.bottom_components, []),
      };

      editor.setCustomization(loadedCustomization);
      
      // Set product data with offer price
      setProductData({
        ...product,
        price: offerPrice,
      });

      // Set offers
      if (offers) setProductOffers(offers);

      // Map order bumps
      if (orderBumps && orderBumps.length > 0) {
        const mappedBumps = orderBumps.map((bump: any) => ({
          id: bump.id,
          name: bump.custom_title || bump.products?.name || "Produto",
          price: bump.offers?.price || bump.products?.price || 0,
          image_url: bump.show_image ? bump.products?.image_url : null,
          description: bump.custom_description
        }));
        setOrderBumps(mappedBumps);
      } else {
        setOrderBumps([]);
      }

    } catch (error: any) {
      console.error('[CheckoutCustomizer] Load error:', error);
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!checkoutId) return;
    setIsSaving(true);
    toast({ title: "Salvando..." });

    // Verify session
    const sessionToken = getProducerSessionToken();
    if (!sessionToken) {
      toast({ title: "Sessão expirada", description: "Faça login novamente", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    // Check pending uploads
    if (hasPendingUploads(editor.customization)) {
       try {
           await waitForUploadsToFinish(() => editor.customization, 45000);
       } catch (e) {
           toast({ title: "Erro no upload", variant: "destructive" });
           setIsSaving(false);
           return;
       }
    }

    try {
        // Collect old paths for cleanup
        let oldPaths: string[] = [];
        getAllComponentsFromCustomization(editor.customization).forEach(c => {
            if (c.content?._old_storage_path) oldPaths.push(c.content._old_storage_path);
        });

        // Save via Edge Function
        const { data: response, error } = await supabase.functions.invoke('checkout-management', {
          body: {
            action: 'update-design',
            checkoutId,
            design: editor.customization.design,
            topComponents: editor.customization.topComponents,
            bottomComponents: editor.customization.bottomComponents,
          },
          headers: { 'x-producer-session-token': sessionToken }
        });

        if (error) throw error;
        if (!response.success) throw new Error(response.error || 'Erro ao salvar');

        // Cleanup old storage paths
        if (oldPaths.length > 0) {
            fetch("/api/storage/remove", { 
                method: "POST", 
                body: JSON.stringify({ paths: oldPaths, bucket: "product-images" }) 
            }).catch(console.error);
        }

        editor.setIsDirty(false);
        toast({ title: "Sucesso!", description: "Checkout salvo." });

    } catch (error: any) {
        console.error('[CheckoutCustomizer] Save error:', error);
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  // Effects
  useEffect(() => {
    if (checkoutId) loadCheckoutData(checkoutId);
  }, [checkoutId]);

  useEffect(() => {
      const handleFocus = () => {
          if (checkoutId && !editor.isDirty) loadCheckoutData(checkoutId);
      };
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
  }, [checkoutId, editor.isDirty]);


  // --- Render ---
  
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

                <Button onClick={handleSave} disabled={loading || isSaving}>
                  {loading || isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Preview Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30">
              <CheckoutPreview
                customization={editor.customization}
                viewMode={editor.viewMode}
                selectedComponentId={editor.selectedComponent}
                onSelectComponent={editor.setSelectedComponent}
                isPreviewMode={editor.isPreviewMode}
                productData={productData}
                orderBumps={orderBumps}
              />
            </div>

            {/* Editor Panel */}
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
