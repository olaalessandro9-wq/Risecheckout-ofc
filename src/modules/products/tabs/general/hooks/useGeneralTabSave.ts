/**
 * useGeneralTabSave - Lógica de Salvamento e Exclusão
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { GeneralFormData } from "../types";

interface UseGeneralTabSaveProps {
  productId: string | undefined;
  form: GeneralFormData;
  validate: () => boolean;
  uploadImage: () => Promise<string | null | undefined>;
  imageFile: File | null;
  pendingRemoval: boolean;
  currentImageUrl: string | null | undefined;
  saveDeletedOffers: () => Promise<void>;
  saveOffers: () => Promise<void>;
  resetImage: () => void;
  resetOffers: () => void;
  refreshProduct: () => Promise<void>;
  refreshOffers: () => Promise<void>;
  refreshPaymentLinks: () => Promise<void>;
  deleteProduct: () => Promise<boolean>;
}

export function useGeneralTabSave({
  productId,
  form,
  validate,
  uploadImage,
  imageFile,
  pendingRemoval,
  currentImageUrl,
  saveDeletedOffers,
  saveOffers,
  resetImage,
  resetOffers,
  refreshProduct,
  refreshOffers,
  refreshPaymentLinks,
  deleteProduct,
}: UseGeneralTabSaveProps) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      toast.error("Corrija os erros antes de salvar");
      return;
    }

    if (!productId) return;

    setIsSaving(true);

    try {
      let finalImageUrl = currentImageUrl;

      if (imageFile) {
        finalImageUrl = await uploadImage();
      } else if (pendingRemoval) {
        finalImageUrl = null;
      }

      const sessionToken = localStorage.getItem('producer_session_token');
      const { data, error } = await supabase.functions.invoke('product-settings', {
        body: {
          action: 'update-general',
          productId: productId,
          data: {
            name: form.name,
            description: form.description,
            price: form.price,
            support_name: form.support_name,
            support_email: form.support_email,
            delivery_url: form.external_delivery ? null : (form.delivery_url || null),
            external_delivery: form.external_delivery,
            status: "active",
            image_url: finalImageUrl,
          },
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao atualizar produto');

      await saveDeletedOffers();
      await saveOffers();

      toast.success("Produto salvo com sucesso");

      resetImage();
      resetOffers();

      await refreshProduct();
      await refreshOffers();
      await refreshPaymentLinks();
    } catch (error: unknown) {
      console.error("Erro ao salvar:", error);
      toast.error("Não foi possível salvar o produto");
    } finally {
      setIsSaving(false);
    }
  }, [
    validate,
    productId,
    form,
    imageFile,
    pendingRemoval,
    currentImageUrl,
    uploadImage,
    saveDeletedOffers,
    saveOffers,
    resetImage,
    resetOffers,
    refreshProduct,
    refreshOffers,
    refreshPaymentLinks,
  ]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const success = await deleteProduct();
      if (!success) {
        throw new Error("Falha ao excluir produto");
      }
      navigate("/dashboard/produtos");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteProduct, navigate]);

  return {
    isSaving,
    isDeleting,
    handleSave,
    handleDelete,
  };
}
