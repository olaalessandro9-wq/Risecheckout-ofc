import { useState, useEffect } from "react";
import { parseJsonSafely } from "@/lib/utils"; 
import { hasPendingUploads, waitForUploadsToFinish, getAllComponentsFromCustomization } from "@/lib/uploadUtils";
import { normalizeDesign } from "@/lib/checkout/normalizeDesign"; // ✅ Usando o utilitário existente
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Monitor, Smartphone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutPreview } from "@/components/checkout/CheckoutPreview";
import { CheckoutCustomizationPanel } from "@/components/checkout/CheckoutCustomizationPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useCheckoutEditor, CheckoutCustomization } from "@/hooks/useCheckoutEditor";

const CheckoutCustomizer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutId = searchParams.get("id");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados de dados externos (Produtos/Ofertas) - Mantidos aqui pois são dados, não estado de UI
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
      const { data: checkout, error: checkoutError } = await supabase
        .from("checkouts")
        .select(`
          *,
          products (*),
          checkout_links (
            payment_links (
              offers (
                id,
                name,
                price
              )
            )
          )
        `)
        .eq("id", id)
        .single();

      if (checkoutError) throw checkoutError;

      if (checkout) {
        console.log('Checkout carregado:', checkout);
        
        // ✅ BUSCAR PREÇO DA OFERTA ASSOCIADA
        const checkoutLink = (checkout as any)?.checkout_links?.[0];
        const paymentLink = checkoutLink?.payment_links;
        const offer = paymentLink?.offers;
        const offerPrice = offer?.price || checkout.products?.price || 0; // ✅ Preço já vem correto do banco
        
        // ✅ OPÇÃO A: Usar utilitário normalizeDesign existente
        // Isso limpa 100 linhas de código de fallback de cores
        const themePreset = normalizeDesign(checkout);
        
        // Converter ThemePreset para CheckoutDesign adicionando theme e font
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
        
        // ✅ USAR PREÇO DA OFERTA NO PRODUCT DATA
        setProductData({
          ...checkout.products,
          price: offerPrice, // Substituir price por offerPrice
        });

        // Load auxiliary data
        if (checkout.product_id) {
            const { data: offers } = await supabase.from("offers").select("*").eq("product_id", checkout.product_id);
            if (offers) setProductOffers(offers);
        }
      }

      // Load Order Bumps
      const { data: bumps } = await supabase.from("order_bumps")
        .select(`*, products!order_bumps_product_id_fkey(*), offers(*)`)
        .eq("checkout_id", id).eq("active", true).order("position");

      if (bumps) {
          const mappedBumps = bumps.map((bump: any) => ({
            id: bump.id,
            name: bump.custom_title || bump.products?.name || "Produto",
            price: bump.offers?.price || bump.products?.price || 0,
            image_url: bump.show_image ? bump.products?.image_url : null,
            description: bump.custom_description
          }));
          setOrderBumps(mappedBumps);
      }

    } catch (error: any) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!checkoutId) return;
    setIsSaving(true);
    toast({ title: "Salvando..." });

    // Verifica uploads usando função importada de src/lib/uploadUtils.ts
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
        // Coletar lixo (imagens deletadas)
        let oldPaths: string[] = [];
        getAllComponentsFromCustomization(editor.customization).forEach(c => {
            if (c.content?._old_storage_path) oldPaths.push(c.content._old_storage_path);
        });

        // Salva no banco
        const { error } = await supabase
            .from("checkouts")
            .update({
                // Mapeia de volta para colunas legadas para compatibilidade
                theme: editor.customization.design.theme,
                font: editor.customization.design.font,
                background_color: editor.customization.design.colors.background,
                primary_text_color: editor.customization.design.colors.primaryText,
                secondary_text_color: editor.customization.design.colors.secondaryText,
                active_text_color: editor.customization.design.colors.active,
                icon_color: editor.customization.design.colors.icon,
                form_background_color: editor.customization.design.colors.formBackground,
                payment_button_bg_color: editor.customization.design.colors.button.background,
                payment_button_text_color: editor.customization.design.colors.button.text,
                
                // JSONBs Principais
                design: JSON.parse(JSON.stringify(editor.customization.design)),
                components: [],
                top_components: JSON.parse(JSON.stringify(editor.customization.topComponents)),
                bottom_components: JSON.parse(JSON.stringify(editor.customization.bottomComponents)),
            })
            .eq("id", checkoutId);

        if (error) throw error;

        // Limpa storage
        if (oldPaths.length > 0) {
            fetch("/api/storage/remove", { 
                method: "POST", 
                body: JSON.stringify({ paths: oldPaths, bucket: "product-images" }) 
            }).catch(console.error);
        }

        editor.setIsDirty(false);
        toast({ title: "Sucesso!", description: "Checkout salvo." });

    } catch (error: any) {
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
                // Mapeando funções do hook para as props do painel
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
  );
};

export default CheckoutCustomizer;
