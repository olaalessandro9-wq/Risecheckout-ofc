import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Loader2 } from "lucide-react";
import { parseBRLInput } from "@/lib/money";
import { NormalizedOffer } from "@/services/offers";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

import { OrderBumpDialogProps } from "./types";
import { useOrderBumpData } from "./hooks/useOrderBumpData";
import { useOrderBumpForm } from "./hooks/useOrderBumpForm";
import { OrderBumpFormFields } from "./OrderBumpFormFields";
import { OrderBumpPreview } from "./OrderBumpPreview";

export function OrderBumpDialog({
  open,
  onOpenChange,
  productId,
  onSuccess,
  editOrderBump,
}: OrderBumpDialogProps) {
  const { user } = useUnifiedAuth();
  
  // Estado independente para selectedProductId - fonte única de verdade
  const [selectedProductId, setSelectedProductId] = useState<string>(
    editOrderBump?.product_id || ""
  );

  // Estado independente para selectedOfferId
  const [selectedOfferId, setSelectedOfferId] = useState<string>(
    editOrderBump?.offer_id || ""
  );

  // Sincroniza estados quando editOrderBump muda
  useEffect(() => {
    if (open) {
      setSelectedProductId(editOrderBump?.product_id || "");
      setSelectedOfferId(editOrderBump?.offer_id || "");
    }
  }, [editOrderBump?.id, open]);

  // Reset states when dialog opens/closes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen) {
      // Reset to editOrderBump values when opening
      setSelectedProductId(editOrderBump?.product_id || "");
      setSelectedOfferId(editOrderBump?.offer_id || "");
    }
    onOpenChange(newOpen);
  }, [editOrderBump, onOpenChange]);

  // Callback estável para quando ofertas são carregadas
  const handleOffersLoaded = useCallback((loadedOffers: NormalizedOffer[]) => {
    // Só seleciona automaticamente se não tiver oferta selecionada
    if (loadedOffers.length > 0 && !selectedOfferId) {
      setSelectedOfferId(loadedOffers[0].id);
    }
  }, [selectedOfferId]);

  // Hook de dados - usa selectedProductId externo
  const { products, offers, loadingProducts } = useOrderBumpData({
    open,
    productId,
    selectedProductId,
    userId: user?.id || "",
    onOffersLoaded: handleOffersLoaded,
  });

  // Handler para mudança de produto - limpa oferta selecionada
  const handleProductChange = useCallback((newProductId: string) => {
    setSelectedProductId(newProductId);
    setSelectedOfferId(""); // Reset offer when product changes
  }, []);

  // Hook de formulário - chamado apenas UMA vez com dados reais
  const {
    formData,
    loading,
    validationErrors,
    clearFieldError,
    updateField,
    handleSave,
    handleCancel,
  } = useOrderBumpForm({
    open,
    productId,
    editOrderBump,
    products,
    offers,
    selectedProductId,
    selectedOfferId,
    setSelectedProductId: handleProductChange,
    setSelectedOfferId,
    onSuccess,
    onClose: () => handleOpenChange(false),
  });

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const selectedOffer = useMemo(
    () => offers.find((o) => o.id === selectedOfferId),
    [offers, selectedOfferId]
  );

  const priceData = useMemo(() => {
    const finalPrice = selectedOffer?.price || selectedProduct?.price || 0;
    const originalPrice = formData.discountEnabled
      ? parseBRLInput(formData.discountPrice)
      : finalPrice;
    const discountPercentage =
      formData.discountEnabled && originalPrice > finalPrice && originalPrice > 0
        ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
        : 0;

    return { finalPrice, originalPrice, discountPercentage };
  }, [selectedOffer, selectedProduct, formData.discountEnabled, formData.discountPrice]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div>
            <DialogTitle className="text-foreground text-lg flex items-center gap-2">
              <div className="w-7 h-7 bg-primary/20 rounded flex items-center justify-center">
                <Gift className="w-3.5 h-3.5 text-primary" />
              </div>
              {editOrderBump ? "Editar Order Bump" : "Adicionar Order Bump"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selecione um produto para oferecer como complemento
            </p>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-3">
          {/* Form */}
          <OrderBumpFormFields
            formData={{
              ...formData,
              selectedProductId,
              selectedOfferId,
            }}
            products={products}
            offers={offers}
            loadingProducts={loadingProducts}
            selectedProduct={selectedProduct}
            selectedOffer={selectedOffer}
            discountPercentage={priceData.discountPercentage}
            validationErrors={validationErrors}
            onClearFieldError={clearFieldError}
            onFieldChange={(field, value) => {
              if (field === "selectedProductId") {
                handleProductChange(value as string);
              } else if (field === "selectedOfferId") {
                setSelectedOfferId(value as string);
              } else {
                updateField(field, value);
              }
            }}
          />

          {/* Preview */}
          <OrderBumpPreview
            selectedProduct={selectedProduct}
            customTitle={formData.customTitle}
            customDescription={formData.customDescription}
            callToAction={formData.callToAction}
            showImage={formData.showImage}
            discountEnabled={formData.discountEnabled}
            originalPrice={priceData.originalPrice}
            finalPrice={priceData.finalPrice}
            discountPercentage={priceData.discountPercentage}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="border border-border"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90"
            disabled={!selectedProductId || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export types and component
export type { OrderBumpDialogProps } from "./types";
