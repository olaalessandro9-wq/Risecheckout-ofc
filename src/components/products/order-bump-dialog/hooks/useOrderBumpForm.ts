/**
 * useOrderBumpForm - Order Bump Form Hook
 * 
 * @version 2.0.0 - RISE Protocol V3 - Zero console.log
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { parseBRLInput } from "@/lib/money";
import { NormalizedOffer } from "@/services/offers";
import { OrderBumpFormData, OrderBumpProduct, DEFAULT_FORM_VALUES, EditOrderBump } from "../types";
import { createLogger } from "@/lib/logger";

const log = createLogger("UseOrderBumpForm");

interface UseOrderBumpFormProps {
  open: boolean;
  productId: string;
  editOrderBump?: EditOrderBump;
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
      // Support both field names - original_price is the new name, discount_price is deprecated
      const marketingPrice = editOrderBump.original_price ?? editOrderBump.discount_price;
      setFormData({
        discountEnabled: !!marketingPrice,
        // original_price is MARKETING ONLY - for strikethrough display
        discountPrice: marketingPrice
          ? (marketingPrice / 100).toFixed(2).replace(".", ",")
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
        log.error("Error loading saved form data:", e);
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
      
      // RISE V3: Use parent_product_id directly (productId is the parent product)
      // No need to lookup checkout anymore - order bumps are linked to products, not checkouts
      
      // Payload normalizado para snake_case (padrão da Edge Function)
      // NOTE: original_price is MARKETING ONLY - for strikethrough display
      // The REAL price charged comes from the selected offer
      const orderBumpData = {
        parent_product_id: productId, // RISE V3: Product that owns this bump
        product_id: selectedProductId, // Product being offered as bump
        offer_id: selectedOfferId,
        active: true,
        discount_enabled: !!formData.discountEnabled,
        // original_price is the MARKETING price (strikethrough) - never used for billing
        original_price: formData.discountEnabled ? parseBRLInput(formData.discountPrice) : null,
        call_to_action: formData.callToAction?.trim() || null,
        custom_title: formData.customTitle?.trim() || null,
        custom_description: formData.customDescription?.trim() || null,
        show_image: !!formData.showImage,
      };

      if (editOrderBump) {
        // Update via Edge Function
        const { data, error } = await api.call<{ success?: boolean; error?: string }>('order-bump-crud', { 
          action: 'update', 
          order_bump_id: editOrderBump.id,
          ...orderBumpData 
        });

        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || 'Falha ao atualizar order bump');
        
        toast.success("Order bump atualizado com sucesso");
      } else {
        // Create via Edge Function
        const { data, error } = await api.call<{ success?: boolean; error?: string }>('order-bump-crud', { 
          action: 'create', 
          ...orderBumpData 
        });

        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || 'Falha ao criar order bump');
        
        toast.success("Order bump adicionado com sucesso");
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      log.error("Erro ao salvar order_bumps:", error);
      const errObj = error as { code?: string; message?: string };

      if (errObj.code === "23505" || errObj.message?.includes("já está configurado")) {
        toast.error("Este produto já está configurado como order bump");
      } else {
        toast.error(`Não foi possível salvar: ${errObj.message ?? "erro desconhecido"}`);
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
