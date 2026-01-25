/**
 * Hook para lógica do AddProductDialog
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant - 3 Delivery Types
 * @see RISE ARCHITECT PROTOCOL V3 - Separação de Lógica e UI
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { productSchema, deliveryUrlSchema } from "./types";
import type { AddProductFormData } from "./types";
import type { DeliveryType } from "@/modules/products/types/product.types";

const log = createLogger("AddProductDialog");

interface UseAddProductProps {
  onOpenChange: (open: boolean) => void;
  onProductAdded?: () => void;
}

export function useAddProduct({ onOpenChange, onProductAdded }: UseAddProductProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [deliveryUrlError, setDeliveryUrlError] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('standard');
  
  const [formData, setFormData] = useState<AddProductFormData>({
    name: "",
    description: "",
    price: 0,
    delivery_url: "",
  });

  const validateDeliveryUrl = useCallback((url: string): boolean => {
    // Só valida URL se for entrega padrão
    if (deliveryType !== 'standard') {
      setDeliveryUrlError("");
      return true;
    }
    
    const result = deliveryUrlSchema.safeParse(url);
    if (!result.success) {
      setDeliveryUrlError(result.error.errors[0].message);
      return false;
    }
    
    setDeliveryUrlError("");
    return true;
  }, [deliveryType]);

  const handleContinue = useCallback(() => {
    if (!formData.name || !formData.description || formData.price <= 0) {
      if (formData.price <= 0) {
        toast.error("O preço deve ser maior que R$ 0,00");
      }
      return;
    }
    
    const validation = productSchema.safeParse({ 
      name: formData.name, 
      description: formData.description, 
      price: formData.price 
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setStep(2);
  }, [formData]);

  const handleBack = useCallback(() => {
    setStep(1);
    setDeliveryUrlError("");
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ name: "", description: "", price: 0, delivery_url: "" });
    setDeliveryType('standard');
    setStep(1);
    setDeliveryUrlError("");
  }, []);

  const handleSubmit = useCallback(async () => {
    // Só valida URL se for entrega padrão
    if (deliveryType === 'standard' && !validateDeliveryUrl(formData.delivery_url)) {
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await api.call<{ success?: boolean; error?: string; product?: { id: string } }>("product-crud", {
        action: 'create',
        product: {
          name: formData.name.trim(),
          description: formData.description.trim() || "",
          price: formData.price,
          delivery_url: deliveryType === 'standard' ? (formData.delivery_url.trim() || null) : null,
          delivery_type: deliveryType,
          // Mantém external_delivery para compatibilidade com código legado
          external_delivery: deliveryType === 'external',
        },
      });

      if (error) {
        log.error("Edge function error:", error);
        throw new Error(error.message || "Erro ao criar produto");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Erro ao criar produto");
      }

      toast.success("Produto criado com sucesso!");
      onOpenChange(false);
      resetForm();
      
      if (onProductAdded) onProductAdded();
      
      navigate(`/dashboard/produtos/editar?id=${data.product?.id}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar produto");
      log.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [deliveryType, formData, validateDeliveryUrl, onOpenChange, onProductAdded, resetForm, navigate]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
    resetForm();
  }, [onOpenChange, resetForm]);

  const handleDeliveryTypeChange = useCallback((type: DeliveryType) => {
    setDeliveryType(type);
    // Limpa URL se não for entrega padrão
    if (type !== 'standard') {
      setFormData(prev => ({ ...prev, delivery_url: "" }));
      setDeliveryUrlError("");
    }
  }, []);

  const handleDeliveryUrlChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, delivery_url: value }));
  }, []);

  const updateFormData = useCallback((updates: Partial<AddProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    loading,
    step,
    formData,
    deliveryType,
    deliveryUrlError,
    handleContinue,
    handleBack,
    handleSubmit,
    handleCancel,
    handleDeliveryTypeChange,
    handleDeliveryUrlChange,
    validateDeliveryUrl,
    updateFormData,
  };
}
