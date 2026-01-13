import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseBRLInput } from "@/lib/money";
import { NormalizedOffer } from "@/services/offers";
import { OrderBumpFormData, OrderBumpProduct, DEFAULT_FORM_VALUES } from "../types";

interface UseOrderBumpFormProps {
  open: boolean;
  productId: string;
  editOrderBump?: any;
  products: OrderBumpProduct[];
  offers: NormalizedOffer[];
  selectedProductId: string;
  selectedOfferId: string;
  setSelectedProductId: (id: string) => void;
  setSelectedOfferId: (id: string) => void;
  onSuccess: () => void;
  onClose: () => void;
}

export function useOrderBumpForm({
  open,
  productId,
  editOrderBump,
  products,
  offers,
  selectedProductId,
  selectedOfferId,
  setSelectedProductId,
  setSelectedOfferId,
  onSuccess,
  onClose,
}: UseOrderBumpFormProps) {
  // Form data sem selectedProductId e selectedOfferId (gerenciados externamente)
  const [formData, setFormData] = useState<Omit<OrderBumpFormData, "selectedProductId" | "selectedOfferId">>({
    discountEnabled: DEFAULT_FORM_VALUES.discountEnabled,
    discountPrice: DEFAULT_FORM_VALUES.discountPrice,
    callToAction: DEFAULT_FORM_VALUES.callToAction,
    customTitle: DEFAULT_FORM_VALUES.customTitle,
    customDescription: DEFAULT_FORM_VALUES.customDescription,
    showImage: DEFAULT_FORM_VALUES.showImage,
  });
  const [loading, setLoading] = useState(false);
  const [productInitialized, setProductInitialized] = useState<string | null>(null);

  const STORAGE_KEY = `orderBumpForm_${productId}`;

  // Load form data when dialog opens
  useEffect(() => {
    if (!open) return;

    if (editOrderBump) {
      setFormData({
        discountEnabled: !!editOrderBump.discount_price,
        discountPrice: editOrderBump.discount_price
          ? (editOrderBump.discount_price / 100).toFixed(2).replace(".", ",")
          : "0,00",
        callToAction: editOrderBump.call_to_action || DEFAULT_FORM_VALUES.callToAction,
        showImage: editOrderBump.show_image !== false,
        customTitle: "",
        customDescription: "",
      });
      setProductInitialized(editOrderBump.product_id);
      return;
    }

    // Try to load saved form data
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData({
          discountEnabled: parsed.discountEnabled || false,
          discountPrice: parsed.discountPrice || "0,00",
          callToAction: parsed.callToAction || DEFAULT_FORM_VALUES.callToAction,
          customTitle: parsed.customTitle || "",
          customDescription: parsed.customDescription || "",
          showImage: parsed.showImage !== undefined ? parsed.showImage : true,
        });
        // Restore selected IDs from localStorage
        if (parsed.selectedProductId) {
          setSelectedProductId(parsed.selectedProductId);
        }
        if (parsed.selectedOfferId) {
          setSelectedOfferId(parsed.selectedOfferId);
        }
      } catch (e) {
        console.error("Error loading saved form data:", e);
      }
    }
  }, [open, editOrderBump, STORAGE_KEY, setSelectedProductId, setSelectedOfferId]);

  // Load title and description when editing
  useEffect(() => {
    if (editOrderBump && products.length > 0 && selectedProductId) {
      const product = products.find((p) => p.id === selectedProductId);
      if (product) {
        setFormData((prev) => ({
          ...prev,
          customTitle: editOrderBump.custom_title || product.name,
          customDescription: editOrderBump.custom_description || product.description || "",
        }));
      }
    }
  }, [editOrderBump, products, selectedProductId, open]);

  // Save form data to localStorage (only when not editing)
  useEffect(() => {
    if (open && !editOrderBump) {
      const dataToSave = {
        ...formData,
        selectedProductId,
        selectedOfferId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [open, formData, selectedProductId, selectedOfferId, STORAGE_KEY, editOrderBump]);

  // Update title/description when product changes (both new and edit mode)
  useEffect(() => {
    if (!selectedProductId) return;

    const selectedProduct = products.find((p) => p.id === selectedProductId);
    if (selectedProduct && productInitialized !== selectedProductId) {
      setFormData((prev) => ({
        ...prev,
        customTitle: selectedProduct.name,
        customDescription: selectedProduct.description || "",
      }));
      setProductInitialized(selectedProductId);
    }
  }, [selectedProductId, products, productInitialized]);

  const updateField = useCallback(<K extends keyof OrderBumpFormData>(
    field: K,
    value: OrderBumpFormData[K]
  ) => {
    // Campos gerenciados externamente
    if (field === "selectedProductId" || field === "selectedOfferId") {
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      discountEnabled: DEFAULT_FORM_VALUES.discountEnabled,
      discountPrice: DEFAULT_FORM_VALUES.discountPrice,
      callToAction: DEFAULT_FORM_VALUES.callToAction,
      customTitle: DEFAULT_FORM_VALUES.customTitle,
      customDescription: DEFAULT_FORM_VALUES.customDescription,
      showImage: DEFAULT_FORM_VALUES.showImage,
    });
    setProductInitialized(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [STORAGE_KEY]);

  const handleSave = async () => {
    const selectedProduct = products.find((p) => p.id === selectedProductId);
    if (!selectedProduct?.id) {
      toast.error("Selecione um produto válido antes de salvar.");
      return;
    }

    if (!selectedOfferId) {
      toast.error("Selecione uma oferta");
      return;
    }

    const selectedOffer = offers.find((o) => o.id === selectedOfferId);
    const currentPriceInCents = selectedOffer?.price || selectedProduct?.price || 0;
    const originPriceInCents = parseBRLInput(formData.discountPrice);

    if (formData.discountEnabled && originPriceInCents <= currentPriceInCents) {
      toast.error("Valor deve ser maior que a oferta");
      return;
    }

    try {
      setLoading(true);
      
      const sessionToken = localStorage.getItem('producer_session_token');
      
      // Buscar checkout_id do produto principal
      const { data: checkouts, error: checkoutsError } = await supabase
        .from("checkouts")
        .select("id")
        .eq("product_id", productId)
        .limit(1);

      if (checkoutsError) throw checkoutsError;

      if (!checkouts || checkouts.length === 0) {
        toast.error("Nenhum checkout encontrado para este produto");
        return;
      }

      const orderBumpData = {
        checkoutId: checkouts[0].id,
        productId: selectedProductId,
        offerId: selectedOfferId,
        active: true,
        discountEnabled: !!formData.discountEnabled,
        discountPrice: formData.discountEnabled ? parseBRLInput(formData.discountPrice) : null,
        callToAction: formData.callToAction?.trim() || null,
        customTitle: formData.customTitle?.trim() || null,
        customDescription: formData.customDescription?.trim() || null,
        showImage: !!formData.showImage,
      };

      if (editOrderBump) {
        // Update via Edge Function
        const { data, error } = await supabase.functions.invoke('order-bump-crud', {
          body: { 
            action: 'update', 
            orderBumpId: editOrderBump.id,
            ...orderBumpData 
          },
          headers: { 'x-producer-session-token': sessionToken || '' }
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Falha ao atualizar order bump');
        
        toast.success("Order bump atualizado com sucesso");
      } else {
        // Create via Edge Function
        const { data, error } = await supabase.functions.invoke('order-bump-crud', {
          body: { 
            action: 'create', 
            ...orderBumpData 
          },
          headers: { 'x-producer-session-token': sessionToken || '' }
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Falha ao criar order bump');
        
        toast.success("Order bump adicionado com sucesso");
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar order_bumps:", error);

      if (error.code === "23505" || error.message?.includes("já está configurado")) {
        toast.error("Este produto já está configurado como order bump");
      } else {
        toast.error(`Não foi possível salvar: ${error?.message ?? "erro desconhecido"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return {
    formData: {
      ...formData,
      selectedProductId,
      selectedOfferId,
    },
    loading,
    updateField,
    handleSave,
    handleCancel,
  };
}
