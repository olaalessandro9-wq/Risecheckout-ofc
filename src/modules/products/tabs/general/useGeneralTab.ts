/**
 * useGeneralTab - Hook com toda a lógica da aba Geral
 * 
 * Segue o padrão do useProductSettings:
 * - Gerencia estado do formulário
 * - Detecção automática de mudanças via useEffect
 * - Validação e salvamento
 * - Abstrai chamadas ao Supabase
 */

import { useState, useEffect, useMemo, useLayoutEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProductContext } from "../../context/ProductContext";
import type { Offer } from "@/components/products/OffersManager";
import type { GeneralFormData, GeneralFormErrors, ImageState } from "./types";

export function useGeneralTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    product,
    offers,
    refreshOffers,
    refreshProduct,
    deleteProduct,
    updateGeneralModified,
  } = useProductContext();

  // Estados do formulário
  const [form, setForm] = useState<GeneralFormData>({
    name: "",
    description: "",
    price: 0,
    support_name: "",
    support_email: "",
    delivery_url: "",
  });

  const [errors, setErrors] = useState<GeneralFormErrors>({
    name: "",
    description: "",
    price: "",
    support_name: "",
    support_email: "",
    delivery_url: "",
  });

  // Estados de imagem
  const [image, setImage] = useState<ImageState>({
    imageFile: null,
    imageUrl: "",
    pendingRemoval: false,
  });

  // Estados de ofertas
  const [localOffers, setLocalOffers] = useState<Offer[]>([]);
  const [deletedOfferIds, setDeletedOfferIds] = useState<string[]>([]);
  const [offersModified, setOffersModified] = useState(false);

  // Estados de UI
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sincronizar form com product
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description || "",
        price: product.price,
        support_name: product.support_name || "",
        support_email: product.support_email || "",
        delivery_url: product.delivery_url || "",
      });
    }
  }, [product]);

  // Sincronizar ofertas
  useEffect(() => {
    setLocalOffers(offers);
  }, [offers]);

  // Detecção automática de mudanças (igual ConfiguracoesTab)
  const hasChanges = useMemo(() => {
    if (!product) return false;

    const formChanged = (
      form.name !== product.name ||
      form.description !== (product.description || "") ||
      form.support_name !== (product.support_name || "") ||
      form.support_email !== (product.support_email || "")
    );

    const imageChanged = image.imageFile !== null || image.pendingRemoval;

    return formChanged || imageChanged || offersModified || deletedOfferIds.length > 0;
  }, [form, product, image, offersModified, deletedOfferIds]);

  // Notificar contexto sobre mudanças (antes do paint)
  useLayoutEffect(() => {
    updateGeneralModified(hasChanges);
  }, [hasChanges, updateGeneralModified]);

  // Validação
  const validate = useCallback((): boolean => {
    const newErrors: GeneralFormErrors = {
      name: "",
      description: "",
      price: "",
      support_name: "",
      support_email: "",
      delivery_url: "",
    };
    let valid = true;

    if (!form.name.trim()) {
      newErrors.name = "Nome do produto é obrigatório";
      valid = false;
    }

    if (form.description.trim().length < 100) {
      newErrors.description = "A descrição deve ter no mínimo 100 caracteres";
      valid = false;
    }

    if (!form.price || form.price <= 0) {
      newErrors.price = "Preço deve ser maior que zero";
      valid = false;
    }

    if (form.support_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.support_email)) {
      newErrors.support_email = "E-mail inválido";
      valid = false;
    }

    // Validar delivery_url se fornecida
    if (form.delivery_url && !form.delivery_url.startsWith("https://")) {
      newErrors.delivery_url = "O link deve começar com https://";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [form]);

  // Upload de imagem
  const uploadImage = useCallback(async (): Promise<string | null | undefined> => {
    if (!image.imageFile || !user || !product?.id) return product?.image_url;

    try {
      const fileExt = image.imageFile.name.split(".").pop();
      const fileName = `${user.id}/${product.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, image.imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast.error("Não foi possível fazer upload da imagem");
      throw error;
    }
  }, [image.imageFile, user, product?.id, product?.image_url]);

  // Salvar ofertas deletadas
  const saveDeletedOffers = useCallback(async () => {
    if (deletedOfferIds.length === 0) return;

    for (const offerId of deletedOfferIds) {
      await supabase
        .from("payment_links")
        .update({ status: "inactive" })
        .eq("offer_id", offerId);

      await supabase
        .from("offers")
        .update({ status: "deleted" })
        .eq("id", offerId);
    }
  }, [deletedOfferIds]);

  // Salvar ofertas modificadas
  const saveOffers = useCallback(async () => {
    if (!offersModified || !product?.id) return;

    for (const offer of localOffers) {
      if (offer.id.startsWith("temp-")) {
        await supabase.from("offers").insert({
          product_id: product.id,
          name: offer.name,
          price: offer.price,
          is_default: false,
          status: "active",
        });
      } else {
        await supabase
          .from("offers")
          .update({ name: offer.name, price: offer.price })
          .eq("id", offer.id);
      }
    }
  }, [offersModified, localOffers, product?.id]);

  // Handler de salvamento principal
  const handleSave = useCallback(async () => {
    if (!validate()) {
      toast.error("Corrija os erros antes de salvar");
      return;
    }

    if (!product?.id || !user) return;

    setIsSaving(true);

    try {
      let finalImageUrl = product.image_url;

      if (image.imageFile) {
        finalImageUrl = await uploadImage();
      } else if (image.pendingRemoval) {
        finalImageUrl = null;
      }

      const { error } = await supabase
        .from("products")
        .update({
          name: form.name,
          description: form.description,
          price: form.price,
          support_name: form.support_name,
          support_email: form.support_email,
          delivery_url: form.delivery_url || null,
          status: "active",
          image_url: finalImageUrl,
        })
        .eq("id", product.id)
        .eq("user_id", user.id);

      if (error) throw error;

      await saveDeletedOffers();
      await saveOffers();

      toast.success("Produto salvo com sucesso");

      // Reset estados
      setImage({ imageFile: null, imageUrl: "", pendingRemoval: false });
      setOffersModified(false);
      setDeletedOfferIds([]);

      await refreshProduct();
      await refreshOffers();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Não foi possível salvar o produto");
    } finally {
      setIsSaving(false);
    }
  }, [
    validate,
    product,
    user,
    form,
    image,
    uploadImage,
    saveDeletedOffers,
    saveOffers,
    refreshProduct,
    refreshOffers,
  ]);

  // Handler de exclusão
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const success = await deleteProduct();
      if (success) {
        navigate("/dashboard/produtos");
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deleteProduct, navigate]);

  // Handlers de imagem
  const handleImageFileChange = useCallback((file: File | null) => {
    setImage((prev) => ({ ...prev, imageFile: file, pendingRemoval: false }));
  }, []);

  const handleImageUrlChange = useCallback((url: string) => {
    setImage((prev) => ({ ...prev, imageUrl: url, pendingRemoval: false }));
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImage((prev) => ({ ...prev, pendingRemoval: true }));
    toast.success("Imagem marcada para remoção. Clique em 'Salvar Alterações' para confirmar.");
  }, []);

  // Handlers de ofertas
  const handleOffersChange = useCallback((newOffers: Offer[]) => {
    setLocalOffers(newOffers);
  }, []);

  const handleOffersModifiedChange = useCallback((modified: boolean) => {
    setOffersModified(modified);
  }, []);

  const handleOfferDeleted = useCallback((offerId: string) => {
    setDeletedOfferIds((prev) => [...prev, offerId]);
  }, []);

  // Limpar erro ao editar campo
  const clearError = useCallback((field: keyof GeneralFormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  return {
    // Estados
    product,
    form,
    setForm,
    errors,
    clearError,
    image,
    localOffers,
    hasChanges,
    isSaving,
    isDeleting,

    // Handlers
    handleSave,
    handleDelete,
    handleImageFileChange,
    handleImageUrlChange,
    handleRemoveImage,
    handleOffersChange,
    handleOffersModifiedChange,
    handleOfferDeleted,
  };
}
